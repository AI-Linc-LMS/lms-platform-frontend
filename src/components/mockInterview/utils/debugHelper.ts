// Debug Helper - Remove in production

export const debugLog = (_context: string, _data: any) => {
  if (import.meta.env.DEV) {
    // Only log in development
  }
};

export const debugFaceDetection = (_faceCount: number, _isValidFrame: boolean) => {
  if (import.meta.env.DEV) {
    // Only log in development
  }
};

