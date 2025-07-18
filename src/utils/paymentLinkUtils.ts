import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = import.meta.env.VITE_PAYMENT_ENCRYPTION_KEY || 'default-key-12345';

interface PaymentLinkData {
  amount: number;
  programType: 'flagship-program' | 'nanodegree-program';
  timestamp: number;
  generatedBy: string;
}

// Convert to base36 for more compact representation
const toBase36 = (num: number): string => num.toString(36);
const fromBase36 = (str: string): number => parseInt(str, 36);

/**
 * Generates a compact payment link
 */
export const generateEncodedPaymentLink = (data: PaymentLinkData): string => {
  // Create minimal payload using base36 encoding
  const timestamp = Math.floor(Date.now() / 1000); // Use seconds instead of milliseconds
  const amount = data.amount;
  const type = data.programType === 'flagship-program' ? 'f' : 'n';
  
  // Create compact string: amount_timestamp_type
  const compactData = `${toBase36(amount)}_${toBase36(timestamp)}_${type}`;
  
  // Create HMAC for security
  const hmac = CryptoJS.HmacSHA256(compactData, ENCRYPTION_KEY).toString().slice(0, 8);
  
  // Combine data with HMAC
  const finalData = `${compactData}.${hmac}`;

  // Generate the full URL
  const baseUrl = window.location.origin;
  return `${baseUrl}/${data.programType}-payment?data=${encodeURIComponent(finalData)}`;
};

/**
 * Decodes and validates a compact payment link
 */
export const decodePaymentLink = (encodedData: string): PaymentLinkData | null => {
  try {
    const decodedData = decodeURIComponent(encodedData);
    const [compactData, hmac] = decodedData.split('.');

    // Verify HMAC
    const expectedHmac = CryptoJS.HmacSHA256(compactData, ENCRYPTION_KEY).toString().slice(0, 8);
    if (hmac !== expectedHmac) {
      console.error('Invalid HMAC');
      return null;
    }

    // Split compact data
    const [amountStr, timestampStr, type] = compactData.split('_');
    
    if (!amountStr || !timestampStr || !type) {
      console.error('Invalid data format');
      return null;
    }

    // Parse values
    const amount = fromBase36(amountStr);
    const timestamp = fromBase36(timestampStr) * 1000; // Convert back to milliseconds
    const programType = type === 'f' ? 'flagship-program' : 'nanodegree-program';

    // Remove timestamp validation
    // const now = Date.now();
    // const validityPeriod = 30 * 60 * 1000; // 30 minutes
    
    // if (now - timestamp > validityPeriod) {
    //   console.error('Link expired');
    //   return null;
    // }

    // Reconstruct data
    return {
      amount,
      programType,
      timestamp,
      generatedBy: 'system' // Since we don't store this in compact format
    };
  } catch (error) {
    console.error('Error decoding payment link:', error);
    return null;
  }
}; 