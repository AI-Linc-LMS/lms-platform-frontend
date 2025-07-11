import { Buffer } from 'buffer';
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = import.meta.env.VITE_PAYMENT_ENCRYPTION_KEY || 'default-key-12345';

interface PaymentLinkData {
  amount: number;
  programType: 'flagship-program' | 'nanodegree-program';
  timestamp: number;
  generatedBy: string; // admin email or ID who generated the link
}

/**
 * Generates an encoded payment link that cannot be tampered with
 */
export const generateEncodedPaymentLink = (data: PaymentLinkData): string => {
  // Create payload with expiry
  const payload = {
    ...data,
    timestamp: Date.now(),
  };

  // Encrypt the payload
  const encrypted = CryptoJS.AES.encrypt(
    JSON.stringify(payload),
    ENCRYPTION_KEY
  ).toString();

  // Base64 encode for URL safety
  const encodedData = Buffer.from(encrypted).toString('base64');
  
  // Generate the full URL
  const baseUrl = window.location.origin;
  return `${baseUrl}/${data.programType}-payment?data=${encodedData}`;
};

/**
 * Decodes and validates an encoded payment link
 * Returns null if invalid or expired
 */
export const decodePaymentLink = (encodedData: string): PaymentLinkData | null => {
  try {
    // Decode base64
    const encrypted = Buffer.from(encodedData, 'base64').toString();
    
    // Decrypt the data
    const decrypted = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY).toString(
      CryptoJS.enc.Utf8
    );
    
    const data: PaymentLinkData = JSON.parse(decrypted);
    
    // Validate timestamp (30 minute expiry)
    const now = Date.now();
    const validityPeriod = 30 * 60 * 1000; // 30 minutes
    
    if (now - data.timestamp > validityPeriod) {
      return null; // Link expired
    }
    
    return data;
  } catch (error) {
    console.error('Error decoding payment link:', error);
    return null;
  }
}; 