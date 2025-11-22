import { Client, Databases, Storage, ID, Query } from 'appwrite';
import { ShareData, ShareStatus, CreateShareResponse } from '../types';
import { APPWRITE_CONFIG, CODE_LENGTH, ERROR_MESSAGES } from '../constants';

// Initialize Appwrite
const client = new Client()
  .setEndpoint(APPWRITE_CONFIG.ENDPOINT)
  .setProject(APPWRITE_CONFIG.PROJECT_ID);

const databases = new Databases(client);
const storage = new Storage(client);

const { DATABASE_ID, COLLECTION_ID, BUCKET_ID } = APPWRITE_CONFIG;

// Helper to check if config is still default
const isConfigured = () => {
  return APPWRITE_CONFIG.PROJECT_ID !== 'replace_with_your_project_id';
};

// Helper to generate random 6-char alphanumeric code
const generateCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const createShare = async (
  text: string, 
  file: File | null, 
  expiryHours: number
): Promise<CreateShareResponse> => {
  
  if (!isConfigured()) {
    throw new Error('CONFIG_ERROR');
  }

  // 1. Generate Code & Expiry
  // In a production app, you might want to check DB for collision, 
  // but 6 chars gives ~2 billion combinations, so collision is rare for low volume.
  const code = generateCode();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + (expiryHours * 60 * 60 * 1000));

  // 2. Upload File if exists
  let fileId = null;
  let fileName = null;
  let fileSize = null;
  let fileType = null;

  if (file) {
    try {
      const uploaded = await storage.createFile(
        BUCKET_ID,
        ID.unique(),
        file
      );
      fileId = uploaded.$id;
      fileName = uploaded.name;
      fileSize = uploaded.sizeOriginal;
      fileType = uploaded.mimeType;
    } catch (error) {
      console.error("Upload Failed:", error);
      throw new Error('NETWORK_ERROR');
    }
  }

  // 3. Create Document
  const payload = {
    code,
    text: text || null,
    fileId,
    fileName,
    fileSize,
    fileType,
    status: ShareStatus.ACTIVE,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    downloadCount: 0
  };

  try {
    await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID,
      ID.unique(),
      payload
    );
  } catch (error) {
    // If DB write fails, we should try to delete the file we just uploaded to be clean
    if (fileId) {
      await storage.deleteFile(BUCKET_ID, fileId).catch(() => {});
    }
    console.error("DB Creation Failed:", error);
    throw new Error('NETWORK_ERROR');
  }

  return { code, expiresAt };
};

export const getShare = async (code: string): Promise<ShareData> => {
  
  if (!isConfigured()) {
    throw new Error('CONFIG_ERROR');
  }

  try {
    // 1. Find Document by Code
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [
        Query.equal('code', code.toUpperCase())
      ]
    );

    if (response.documents.length === 0) {
      throw new Error('NOT_FOUND');
    }

    const doc = response.documents[0];
    
    // 2. Check Status & Expiry
    if (doc.status !== ShareStatus.ACTIVE) {
      throw new Error('EXPIRED');
    }

    if (new Date() > new Date(doc.expiresAt)) {
      throw new Error('EXPIRED');
    }

    // 3. Construct Share Data
    let fileData = undefined;
    if (doc.fileId) {
      // Get Download URL
      const downloadUrl = storage.getFileDownload(
        BUCKET_ID,
        doc.fileId
      ).href;

      fileData = {
        name: doc.fileName,
        size: doc.fileSize,
        type: doc.fileType,
        fileId: doc.fileId,
        downloadUrl: downloadUrl
      };
    }

    return {
      code: doc.code,
      text: doc.text,
      file: fileData,
      createdAt: doc.createdAt,
      expiresAt: doc.expiresAt,
      status: doc.status,
      downloadCount: doc.downloadCount
    };

  } catch (error: any) {
    if (error.message === 'NOT_FOUND' || error.message === 'EXPIRED') {
      throw error;
    }
    console.error("Fetch Error:", error);
    throw new Error('NETWORK_ERROR');
  }
};