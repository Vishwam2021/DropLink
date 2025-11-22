export const APP_NAME = "DropLink";

// Limits
export const MAX_TEXT_LENGTH = 10000;
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
export const CODE_LENGTH = 6;
export const EXPIRY_HOURS = 24;

// Status Messages
export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: `File size exceeds the limit of ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB.`,
  NO_CONTENT: "Please enter text or select a file to send.",
  INVALID_CODE: "Please enter a valid 6-character alphanumeric code.",
  NOT_FOUND: "No active share found for this code.",
  EXPIRED: "This share has expired.",
  NETWORK_ERROR: "Network error. Please try again.",
};