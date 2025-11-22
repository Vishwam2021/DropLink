export enum ShareStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  DELETED = 'DELETED',
}

export interface ShareData {
  code: string;
  text?: string;
  file?: {
    name: string;
    size: number;
    type: string;
    dataUrl: string; // Using DataURL for local simulation. Appwrite would use fileId/bucketId.
  };
  createdAt: number;
  expiresAt: number;
  status: ShareStatus;
  downloadCount: number;
}

export interface CreateShareResponse {
  code: string;
  expiresAt: number;
}

export type TabMode = 'send' | 'receive';