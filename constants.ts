export const APP_NAME = "DropLink";

// Limits
export const MAX_TEXT_LENGTH = 10000;
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
export const CODE_LENGTH = 6;

// Expiry Options
export const EXPIRY_OPTIONS = [
  { label: '1 Hour', value: 1 },
  { label: '6 Hours', value: 6 },
  { label: '24 Hours', value: 24 },
  { label: '3 Days', value: 72 },
];

// Appwrite Configuration
// REPLACE THESE WITH YOUR ACTUAL APPWRITE PROJECT DETAILS
export const APPWRITE_CONFIG = {
  ENDPOINT: 'https://cloud.appwrite.io/v1',
  PROJECT_ID: '69215b540028e54154fc',
  DATABASE_ID: '69215c8e0022a178076c',
  COLLECTION_ID: 'shares',
  BUCKET_ID: '69215e14001b01101641',
};

// Status Messages
export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: `File size exceeds the limit of ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB.`,
  NO_CONTENT: "Please enter text or select a file to send.",
  INVALID_CODE: "Please enter a valid 6-character alphanumeric code.",
  NOT_FOUND: "No active share found for this code.",
  EXPIRED: "This share has expired.",
  NETWORK_ERROR: "Network error. Please try again.",
  CONFIG_ERROR: "Backend not configured. Please check constants.ts.",
};