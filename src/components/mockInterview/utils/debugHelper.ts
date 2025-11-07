// Debug Helper - Remove in production

export const debugLog = (context: string, data: any) => {
  if (import.meta.env.DEV) {
    // Only log in development
  }
};

export const debugFaceDetection = (faceCount: number, isValidFrame: boolean) => {
  if (import.meta.env.DEV) {
    // Only log in development
  }
};

