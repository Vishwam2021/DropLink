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
    fileId: string; // ID reference to Appwrite Storage
    downloadUrl?: string; // Generated URL
  };
  createdAt: string; // ISO String for Appwrite
  expiresAt: string; // ISO String for Appwrite
  status: ShareStatus;
  downloadCount: number;
}

export interface CreateShareResponse {
  code: string;
  expiresAt: Date;
}

export interface ExpiryOption {
  label: string;
  value: number; // Hours
}

export type TabMode = 'send' | 'receive';