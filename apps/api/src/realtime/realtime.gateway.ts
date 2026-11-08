import { type BeforeApplicationShutdown, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import {
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  type OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service.js';
import { DevicesService } from '../devices/devices.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { isOnline } from '../screens/screens.service.js';
import { ADMINS_ROOM, screenRoom, type SocketIdentity, SocketEvents } from './events.js';
import { RealtimeService } from './realtime.service.js';

interface SocketData {
  identity?: SocketIdentity;
}
type AppSocket = Socket<
  Record<string, never>,
  Record<string, never>,
  Record<string, never>,
  SocketData
>;

interface HandshakeAuth {
  deviceToken?: unknown;
  token?: unknown;
}

/**
 * Socket.IO na mesma origem do app (path /socket.io, sem CORS).
 * Autenticação só no handshake: o screenId vem sempre do token validado,
 * nunca do payload dos eventos.
 */
@WebSocketGateway({ path: '/socket.io', serveClient: false, maxHttpBufferSize: 10_000 })
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, BeforeApplicationShutdown
{
  private readonly logger = new Logger(RealtimeGateway.name);
  /** Último status enviado ao painel, para emitir só mudanças. */
  private readonly knownOnline = new Map<string, boolean>();

  constructor(
    private readonly realtime: RealtimeService,
    private readonly devices: DevicesService,
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  private server: Server | null = null;

  afterInit(server: Server): void {
    this.server = server;
    this.realtime.attach(server);
  }

  /**
   * WebSockets abertos impedem o servidor HTTP de fechar (SIGTERM ficaria
   * esperando até o SIGKILL). Desconecta todos; os clientes reconectam
   * sozinhos na nova instância.
   */
  beforeApplicationShutdown(): void {
    this.logger.log('Encerrando conexões em tempo real');
    this.server?.disconnectSockets(true);
  }

  async handleConnection(client: AppSocket): Promise<void> {
    const identity = await this.authenticate(client.handshake.auth);
    if (!identity) {
      client.disconnect(true);
      return;
    }
    client.data.identity = identity;

    if (identity.kind === 'admin') {
      await client.join(ADMINS_ROOM);
      return;
    }
    await client.join(screenRoom(identity.screenId));
    await this.markSeen(identity.screenId);
  }

  async handleDisconnect(client: AppSocket): Promise<void> {
    const identity = client.data.identity;
    if (identity?.kind !== 'device') return;
    const { screenId } = identity;
    // Sem outra conexão da mesma tela: o status passa a depender do lastSeenAt (90s).
    const others = await client.nsp.in(screenRoom(screenId)).fetchSockets();
    if (others.length === 0) this.logger.debug(`Tela ${screenId} desconectou`);
  }

  @SubscribeMessage(SocketEvents.Heartbeat)
  async heartbeat(client: AppSocket): Promise<{ ok: boolean }> {
    // Ignora qualquer payload: a tela é a do token autenticado.
    const identity = client.data.identity;
    if (identity?.kind !== 'device') return { ok: false };
    await this.markSeen(identity.screenId);
    return { ok: true };
  }

  /** Detecta telas que ficaram offline (sem heartbeat há mais de 90s). */
  @Interval(15_000)
  async sweepStatus(): Promise<void> {
    const screens = await this.prisma.screen.findMany({
      where: { pairedAt: { not: null } },
      select: { id: true, lastSeenAt: true },
    });
    for (const screen of screens) this.emitIfChanged(screen.id, screen.lastSeenAt);
  }

  private async authenticate(auth: HandshakeAuth): Promise<SocketIdentity | null> {
    if (typeof auth.deviceToken === 'string' && auth.deviceToken.length <= 128) {
      const screen = await this.devices.findByToken(auth.deviceToken);
      return screen ? { kind: 'device', screenId: screen.id } : null;
    }
    if (typeof auth.token === 'string') {
      const user = await this.auth.verifyToken(auth.token);
      return user ? { kind: 'admin', userId: user.id } : null;
    }
    return null;
  }

  private async markSeen(screenId: string): Promise<void> {
    const lastSeenAt = new Date();
    const screen = await this.prisma.screen
      .update({ where: { id: screenId }, data: { lastSeenAt }, select: { pairedAt: true } })
      .catch(() => null); // tela removida nesse meio-tempo
    if (screen?.pairedAt) this.emitIfChanged(screenId, lastSeenAt);
  }

  private emitIfChanged(screenId: string, lastSeenAt: Date | null): void {
    const online = isOnline(lastSeenAt);
    if (this.knownOnline.get(screenId) === online) return;
    this.knownOnline.set(screenId, online);
    this.realtime.screenStatus({
      screenId,
      online,
      lastSeenAt: lastSeenAt?.toISOString() ?? null,
    });
  }
}
