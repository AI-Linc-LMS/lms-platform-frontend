import type { ResumeData } from "./types";

export function clearResumeData(): void {
  try {
    localStorage.removeItem("resumeData");
  } catch {
  }
}

export function hasSavedResumeData(): boolean {
  try {
    return localStorage.getItem("resumeData") !== null;
  } catch {
    return false;
  }
}

export function getSavedResumeData(): ResumeData | null {
  try {
    const data = localStorage.getItem("resumeData");
    return data ? (JSON.parse(data) as ResumeData) : null;
  } catch {
    return null;
  }
}
