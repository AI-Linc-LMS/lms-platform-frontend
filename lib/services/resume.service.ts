import apiClient from "./api";
import { config } from "../config";

export interface SavedResume {
  id: number;
  display_name: string;
  file_url: string;
  created_at: string;
}

// Cache for resumes list - invalidate on upload/delete
let resumesCache: SavedResume[] | null = null;

// Cache for PDF blob URLs (resume id -> blob URL), max 10 entries
const PDF_CACHE_MAX = 10;
const pdfBlobCache = new Map<number, string>();
const pdfBlobCacheOrder: number[] = [];

function evictPdfCacheIfNeeded() {
  while (pdfBlobCache.size >= PDF_CACHE_MAX && pdfBlobCacheOrder.length > 0) {
    const id = pdfBlobCacheOrder.shift()!;
    const url = pdfBlobCache.get(id);
    if (url) {
      URL.revokeObjectURL(url);
      pdfBlobCache.delete(id);
    }
  }
}

export const resumeService = {
  invalidateResumesCache: () => {
    resumesCache = null;
  },

  getSavedResumes: async (): Promise<SavedResume[]> => {
    if (resumesCache !== null) {
      return resumesCache;
    }
    const response = await apiClient.get<SavedResume[]>(
      `/accounts/clients/${config.clientId}/user-profile/resumes/`
    );
    resumesCache = response.data;
    return resumesCache;
  },

  uploadResume: async (
    file: File,
    displayName?: string
  ): Promise<SavedResume> => {
    const formData = new FormData();
    formData.append("file", file);
    if (displayName?.trim()) {
      formData.append("display_name", displayName.trim());
    }
    try {
      const response = await apiClient.post<SavedResume>(
        `/accounts/clients/${config.clientId}/user-profile/resumes/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      resumesCache = null;
      return response.data;
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string }; status?: number } };
      const message = axiosErr.response?.data?.error;
      if (message && axiosErr.response?.status === 400) {
        throw new Error(message);
      }
      throw err;
    }
  },

  deleteResume: async (id: number): Promise<void> => {
    await apiClient.delete(
      `/accounts/clients/${config.clientId}/user-profile/resumes/${id}/`
    );
    resumesCache = resumesCache ? resumesCache.filter((r) => r.id !== id) : null;
    const pdfUrl = pdfBlobCache.get(id);
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      pdfBlobCache.delete(id);
      const idx = pdfBlobCacheOrder.indexOf(id);
      if (idx >= 0) pdfBlobCacheOrder.splice(idx, 1);
    }
  },

  getDownloadUrl: (id: number): string => {
    const base = config.apiBaseUrl.replace(/\/$/, "");
    return `${base}/accounts/clients/${config.clientId}/user-profile/resumes/${id}/download/`;
  },

  /** Open resume download in new tab (backend redirects to presigned URL). */
  openDownload: (id: number): void => {
    const url = resumeService.getDownloadUrl(id);
    window.open(url, "_blank", "noopener,noreferrer");
  },

  /** Fetch resume PDF as blob for viewing in modal (backend streams file, no CORS). */
  getResumePdfBlob: async (id: number): Promise<Blob> => {
    const path = `/accounts/clients/${config.clientId}/user-profile/resumes/${id}/view/`;
    const response = await apiClient.get(path, { responseType: "blob" });
    return response.data;
  },

  /** Fetch resume PDF and return blob URL, with caching (avoids re-fetch when switching tabs). */
  getResumePdfBlobUrl: async (id: number): Promise<string> => {
    const cached = pdfBlobCache.get(id);
    if (cached) return cached;

    const blob = await resumeService.getResumePdfBlob(id);
    const url = URL.createObjectURL(blob);
    evictPdfCacheIfNeeded();
    pdfBlobCache.set(id, url);
    pdfBlobCacheOrder.push(id);
    return url;
  },

  /** Fetch external image via backend proxy to avoid CORS (e.g. Pinterest, etc). */
  fetchImageViaProxy: async (imageUrl: string): Promise<string> => {
    const path = `/accounts/clients/${config.clientId}/user-profile/proxy-image/?url=${encodeURIComponent(imageUrl)}`;
    const response = await apiClient.get(path, { responseType: "blob" });
    const blob = response.data;
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  },
};
