export interface Screen {
  id: string;
  name: string;
  location: string | null;
  playlist: { id: string; name: string } | null;
  online: boolean;
  lastSeenAt: string | null;
  pairedAt: string;
}

export interface PairScreenInput {
  code: string;
  name: string;
  location?: string | null;
  playlistId?: string | null;
}

export interface UpdateScreenInput {
  name?: string;
  location?: string | null;
  playlistId?: string | null;
}
