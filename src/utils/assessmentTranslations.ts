import { TFunction } from 'i18next';

/**
 * Maps assessment titles and descriptions from backend to translated versions
 * This is needed because the backend sends English titles/descriptions
 * but we want to display them in the user's selected language
 */

export const getTranslatedAssessmentTitle = (
  backendTitle: string,
  t: TFunction
): string => {
  // Normalize the title by removing extra spaces and converting to lowercase for comparison
  const normalizedTitle = backendTitle.toLowerCase().trim();
  
  // Check if this is actually the full description being passed as title
  if ((normalizedTitle.includes('welcome to the kakatiya university entrance assessment') &&
       normalizedTitle.includes('instructions:') &&
       normalizedTitle.includes('good luck!')) ||
      (normalizedTitle.includes('kakatiya university entrance assessment') &&
       normalizedTitle.includes('multiple-choice questions') &&
       normalizedTitle.includes('120 minutes')) ||
      (normalizedTitle.length > 100 && 
       normalizedTitle.includes('assessment') &&
       normalizedTitle.includes('instructions'))) {
    return t('assessments.kakatiyaAssessment.title');
  }
  
  // Map known assessment titles to translation keys
  const titleMappings: { [key: string]: string } = {
    'kakatiya university entrance assessment': 'assessments.kakatiyaAssessment.title',
    // Add more mappings as needed for other assessments
  };

  const translationKey = titleMappings[normalizedTitle];
  
  if (translationKey) {
    return t(translationKey);
  }
  
  // Fallback to original title if no translation found
  return backendTitle;
};

export const getTranslatedAssessmentDescription = (
  backendTitle: string,
  backendDescription: string,
  t: TFunction
): string => {
  // Normalize the title by removing extra spaces and converting to lowercase for comparison
  const normalizedTitle = backendTitle.toLowerCase().trim();
  
  // Also check if the description itself is the concatenated version
  const normalizedDescription = backendDescription.toLowerCase().trim();
  
  // Map known assessment titles to their description translation keys
  const descriptionMappings: { [key: string]: string } = {
    'kakatiya university entrance assessment': 'assessments.kakatiyaAssessment.description',
    // Add more mappings as needed for other assessments
  };

  // Check if this is the full concatenated description
  if ((normalizedDescription.includes('welcome to the kakatiya university entrance assessment') &&
       normalizedDescription.includes('instructions:') &&
       normalizedDescription.includes('good luck!')) ||
      (normalizedDescription.includes('kakatiya university entrance assessment') &&
       normalizedDescription.includes('multiple-choice questions') &&
       normalizedDescription.includes('120 minutes')) ||
      (normalizedDescription.length > 200 && 
       normalizedDescription.includes('assessment') &&
       normalizedDescription.includes('instructions'))) {
    return t('assessments.kakatiyaAssessment.fullDescription');
  }

  const translationKey = descriptionMappings[normalizedTitle];
  
  if (translationKey) {
    return t(translationKey);
  }
  
  // Fallback to original description if no translation found
  return backendDescription;
};