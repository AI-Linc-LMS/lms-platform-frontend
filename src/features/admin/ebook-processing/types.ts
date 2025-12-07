import { ExtractedContent } from './utils/fileReader';

export interface Ebook {
  id: string;
  name: string;
  fileName: string;
  fileSize: number;
  uploadDate: Date;
  status: 'processing' | 'ready';
  formats: {
    ppt: boolean;
    docx: boolean;
    pdf: boolean;
  };
  extractedContent?: ExtractedContent; // Store extracted content for downloads
}

export interface EbookFormData {
  file: File | null;
}

