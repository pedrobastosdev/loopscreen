export type MediaType = 'IMAGE' | 'VIDEO';

export interface Media {
  id: string;
  name: string;
  type: MediaType;
  mimeType: string;
  size: number;
  url: string;
  usageCount: number;
  createdAt: string;
}

export interface UploadLimits {
  maxUploadMb: number;
  maxFilesPerRequest: number;
  mimeTypes: string[];
  extensions: string[];
}
