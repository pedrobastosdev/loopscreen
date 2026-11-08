/**
 * Contrato de armazenamento de arquivos. A implementação atual grava em disco
 * (LocalStorageService); para usar S3/Cloudflare R2 basta criar outra classe
 * com este contrato e trocar o provider no StorageModule.
 */
export abstract class StorageService {
  /** Diretório local onde o upload é recebido antes da validação. */
  abstract readonly incomingDir: string;

  /** Move um arquivo já validado do diretório de entrada para o storage. */
  abstract save(key: string, sourcePath: string, contentType: string): Promise<void>;

  /** Remove o arquivo. Não falha se ele já não existir. */
  abstract delete(key: string): Promise<void>;

  /** URL pública (relativa à origem do app) usada pelo painel e pelo player. */
  abstract publicUrl(key: string): string;
}
