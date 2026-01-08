/**
 * Clears the saved resume data from localStorage
 * Call this function when the user logs out
 */
export function clearResumeData(): void {
  try {
    localStorage.removeItem("resumeData");
  } catch (error) {
    // Silently handle clear failure
  }
}

/**
 * Checks if there is saved resume data in localStorage
 */
export function hasSavedResumeData(): boolean {
  try {
    return localStorage.getItem("resumeData") !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Gets the saved resume data from localStorage
 */
export function getSavedResumeData(): any | null {
  try {
    const data = localStorage.getItem("resumeData");
    return data ? JSON.parse(data) : null;
  } catch (error) {
    return null;
  }
}

