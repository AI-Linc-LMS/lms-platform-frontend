import { TFunction } from 'i18next';

/**
 * Get translated job description based on job ID
 */
export const getTranslatedJobDescription = (jobId: string, t: TFunction): string => {
  const translationKey = `jobs.dynamicContent.descriptions.${jobId}`;
  const translated = t(translationKey);
  
  // If translation key not found, return the translation key itself (fallback)
  return translated !== translationKey ? translated : '';
};

/**
 * Get translated job requirements based on job ID
 */
export const getTranslatedJobRequirements = (jobId: string, t: TFunction): string[] => {
  const translationKey = `jobs.dynamicContent.requirements.${jobId}`;
  const translated = t(translationKey, { returnObjects: true });
  
  // If translation exists and is an array of strings, return it; otherwise return empty array
  return Array.isArray(translated) && translated.every(item => typeof item === 'string') 
    ? translated as string[] 
    : [];
};

/**
 * Get translated job benefits based on job ID
 */
export const getTranslatedJobBenefits = (jobId: string, t: TFunction): string[] => {
  const translationKey = `jobs.dynamicContent.benefits.${jobId}`;
  const translated = t(translationKey, { returnObjects: true });
  
  // If translation exists and is an array of strings, return it; otherwise return empty array
  return Array.isArray(translated) && translated.every(item => typeof item === 'string') 
    ? translated as string[] 
    : [];
};

/**
 * Check if dynamic content translation exists for a job
 */
export const hasTranslatedContent = (jobId: string, t: TFunction): boolean => {
  const descriptionKey = `jobs.dynamicContent.descriptions.${jobId}`;
  const description = t(descriptionKey);
  return description !== descriptionKey;
};