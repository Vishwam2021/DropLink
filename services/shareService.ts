import { ShareData, ShareStatus, CreateShareResponse } from '../types';
import { EXPIRY_HOURS, CODE_LENGTH } from '../constants';

/**
 * NOTE: This service currently uses LocalStorage to simulate the Appwrite backend.
 * In a production environment, you would replace the LocalStorage calls with
 * Appwrite SDK methods (Databases.createDocument, Storage.createFile, etc.).
 */

const STORAGE_KEY = 'droplink_shares';

// Helper to generate random 6-char alphanumeric code
const generateCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous chars like I, 1, O, 0
  let result = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Helper to convert file to base64 (for local simulation only)
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export const createShare = async (text: string, file: File | null): Promise<CreateShareResponse> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  const code = generateCode();
  const now = Date.now();
  const expiresAt = now + (EXPIRY_HOURS * 60 * 60 * 1000);

  let fileData = undefined;
  if (file) {
    // In Real Appwrite: Upload file to Bucket here -> Get ID
    // const uploaded = await storage.createFile('bucket_id', ID.unique(), file);
    const dataUrl = await fileToBase64(file);
    fileData = {
      name: file.name,
      size: file.size,
      type: file.type,
      dataUrl: dataUrl
    };
  }

  const newShare: ShareData = {
    code,
    text: text || undefined,
    file: fileData,
    createdAt: now,
    expiresAt,
    status: ShareStatus.ACTIVE,
    downloadCount: 0,
  };

  // Save to "Database" (LocalStorage)
  const shares = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  shares[code] = newShare;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shares));

  return { code, expiresAt };
};

export const getShare = async (code: string): Promise<ShareData> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  const shares = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  const share = shares[code.toUpperCase()] as ShareData;

  if (!share) {
    throw new Error('NOT_FOUND');
  }

  if (share.status !== ShareStatus.ACTIVE) {
     throw new Error('EXPIRED'); // Or deleted
  }

  if (Date.now() > share.expiresAt) {
    // Update status locally
    share.status = ShareStatus.EXPIRED;
    shares[code] = share;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shares));
    throw new Error('EXPIRED');
  }

  // Increment download count (Optional)
  share.downloadCount += 1;
  shares[code] = share;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shares));

  return share;
};