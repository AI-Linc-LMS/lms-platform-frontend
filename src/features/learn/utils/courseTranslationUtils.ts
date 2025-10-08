import { useTranslation } from 'react-i18next';

// Define course interface
interface Course {
  title?: string;
  description?: string;
  [key: string]: unknown;
}

// Utility function to translate course difficulty levels
export const useTranslatedDifficulty = () => {
  const { t } = useTranslation();
  
  const translateDifficulty = (difficulty: string): string => {
    const difficultyMap: { [key: string]: string } = {
      'Easy': t('courses.difficultyLevels.easy'),
      'Medium': t('courses.difficultyLevels.medium'),
      'Hard': t('courses.difficultyLevels.hard'),
      'Beginner': t('courses.difficultyLevels.beginner'),
      'Intermediate': t('courses.difficultyLevels.intermediate'),
      'Advanced': t('courses.difficultyLevels.advanced'),
      'All Levels': t('courses.difficultyLevels.allLevels'),
      'Entry Level': t('courses.difficultyLevels.entryLevel'),
    };
    
    return difficultyMap[difficulty] || difficulty;
  };
  
  return { translateDifficulty };
};

// Utility function to translate course content based on course title/type
export const useTranslatedCourseContent = () => {
  const { t } = useTranslation();
  
  const getTranslatedDescription = (course: Course): string => {
    const courseTitle = course.title?.toLowerCase() || '';
    
    // Check for specific course types and return translated descriptions
    if (courseTitle.includes('excel')) {
      return t('courses.descriptions.excel');
    } else if (courseTitle.includes('tableau') || courseTitle.includes('tableu')) {
      return t('courses.descriptions.tableau');
    } else if (courseTitle.includes('sql')) {
      return t('courses.descriptions.sql');
    } else if (courseTitle.includes('python')) {
      return t('courses.descriptions.python');
    } else if (courseTitle.includes('data') && courseTitle.includes('science')) {
      return t('courses.descriptions.dataScience');
    } else if (courseTitle.includes('advanced') && courseTitle.includes('machine') && courseTitle.includes('learning')) {
      return t('courses.descriptions.advancedMachineLearning');
    } else if (courseTitle.includes('machine') && courseTitle.includes('learning')) {
      return t('courses.descriptions.machineLearning');
    } else if ((courseTitle.includes('ai') && courseTitle.includes('nlp')) || (courseTitle.includes('neural') && courseTitle.includes('network')) || courseTitle.includes('deep learning')) {
      return t('courses.descriptions.aiNlp');
    } else if (courseTitle.includes('ai') || courseTitle.includes('artificial intelligence')) {
      return t('courses.descriptions.ai');
    } else if (courseTitle.includes('power') && courseTitle.includes('bi')) {
      return t('courses.descriptions.powerBI');
    } else if (courseTitle.includes('react') && !courseTitle.includes('fundamentals')) {
      return t('courses.descriptions.react');
    } else if (courseTitle.includes('javascript')) {
      return t('courses.descriptions.javascript');
    } else if ((courseTitle.includes('no-code') || courseTitle.includes('nocode')) && courseTitle.includes('web') && courseTitle.includes('cursorai')) {
      return t('courses.descriptions.noeCodeWebDev');
    } else if (courseTitle.includes('react') && courseTitle.includes('fundamentals')) {
      return t('courses.descriptions.reactFundamentals');
    } else if ((courseTitle.includes('getting started') || courseTitle.includes('frontend') || courseTitle.includes('front-end')) && !courseTitle.includes('backend')) {
      return t('courses.descriptions.frontendDevelopment');
    } else if (courseTitle.includes('web') && courseTitle.includes('project') && courseTitle.includes('development')) {
      return t('courses.descriptions.webProjectDevelopment');
    } else if ((courseTitle.includes('backend') || courseTitle.includes('back-end')) && courseTitle.includes('mern')) {
      return t('courses.descriptions.backendMern');
    } else if (courseTitle.includes('angular')) {
      return t('courses.descriptions.angular');
    } else if (courseTitle.includes('vue')) {
      return t('courses.descriptions.vue');
    } else if (courseTitle.includes('node') || courseTitle.includes('nodejs')) {
      return t('courses.descriptions.nodejs');
    } else if (courseTitle.includes('django')) {
      return t('courses.descriptions.django');
    } else if (courseTitle.includes('flask')) {
      return t('courses.descriptions.flask');
    } else if ((courseTitle.includes('full') && courseTitle.includes('stack')) || courseTitle.includes('fullstack') || courseTitle.includes('full-stack')) {
      return t('courses.descriptions.fullStack');
    } else if (courseTitle.includes('ml') && (courseTitle.includes('regression') || courseTitle.includes('supervised learning') && courseTitle.includes('regression'))) {
      return t('courses.descriptions.mlRegression');
    } else if (courseTitle.includes('eda') || (courseTitle.includes('exploratory') && courseTitle.includes('data') && courseTitle.includes('analysis'))) {
      return t('courses.descriptions.eda');
    } else if (courseTitle.includes('ml') && (courseTitle.includes('classification') || courseTitle.includes('supervised learning') && courseTitle.includes('classification'))) {
      return t('courses.descriptions.mlClassification');
    }
    
    // Fallback to original description or default
    return course.description || t('courses.descriptions.default');
  };
  
  const getTranslatedLearningObjectives = (course: Course): string[] => {
    const courseTitle = course.title?.toLowerCase() || '';
    
    if (courseTitle.includes('excel')) {
      return [
        t('courses.learningObjectives.excel.objective1'),
        t('courses.learningObjectives.excel.objective2'),
        t('courses.learningObjectives.excel.objective3'),
        t('courses.learningObjectives.excel.objective4'),
        t('courses.learningObjectives.excel.objective5'),
      ];
    } else if (courseTitle.includes('tableau') || courseTitle.includes('tableu')) {
      return [
        t('courses.learningObjectives.tableau.objective1'),
        t('courses.learningObjectives.tableau.objective2'),
        t('courses.learningObjectives.tableau.objective3'),
        t('courses.learningObjectives.tableau.objective4'),
        t('courses.learningObjectives.tableau.objective5'),
      ];
    } else if (courseTitle.includes('sql')) {
      return [
        t('courses.learningObjectives.sql.objective1'),
        t('courses.learningObjectives.sql.objective2'),
        t('courses.learningObjectives.sql.objective3'),
        t('courses.learningObjectives.sql.objective4'),
        t('courses.learningObjectives.sql.objective5'),
      ];
    } else if (courseTitle.includes('python')) {
      return [
        t('courses.learningObjectives.python.objective1'),
        t('courses.learningObjectives.python.objective2'),
        t('courses.learningObjectives.python.objective3'),
        t('courses.learningObjectives.python.objective4'),
        t('courses.learningObjectives.python.objective5'),
      ];
    }
    
    // Default learning objectives
    return [
      t('courses.learningObjectives.default.objective1'),
      t('courses.learningObjectives.default.objective2'),
      t('courses.learningObjectives.default.objective3'),
      t('courses.learningObjectives.default.objective4'),
    ];
  };
  
  const getTranslatedFeatures = (course: Course): string[] => {
    const courseTitle = course.title?.toLowerCase() || '';
    
    if (courseTitle.includes('excel')) {
      return [
        t('courses.features.excel.feature1'),
        t('courses.features.excel.feature2'),
        t('courses.features.excel.feature3'),
        t('courses.features.excel.feature4'),
        t('courses.features.excel.feature5'),
        t('courses.features.excel.feature6'),
      ];
    } else if (courseTitle.includes('tableau') || courseTitle.includes('tableu')) {
      return [
        t('courses.features.tableau.feature1'),
        t('courses.features.tableau.feature2'),
        t('courses.features.tableau.feature3'),
        t('courses.features.tableau.feature4'),
        t('courses.features.tableau.feature5'),
        t('courses.features.tableau.feature6'),
      ];
    } else if (courseTitle.includes('sql')) {
      return [
        t('courses.features.sql.feature1'),
        t('courses.features.sql.feature2'),
        t('courses.features.sql.feature3'),
        t('courses.features.sql.feature4'),
        t('courses.features.sql.feature5'),
        t('courses.features.sql.feature6'),
      ];
    }
    
    // Default features
    return [
      t('courses.features.default.feature1'),
      t('courses.features.default.feature2'),
      t('courses.features.default.feature3'),
      t('courses.features.default.feature4'),
      t('courses.features.default.feature5'),
      t('courses.features.default.feature6'),
    ];
  };
  
  const getTranslatedRequirements = (course: Course): string[] => {
    const courseTitle = course.title?.toLowerCase() || '';
    
    if (courseTitle.includes('excel')) {
      return [
        t('courses.courseRequirements.excel.requirement1'),
        t('courses.courseRequirements.excel.requirement2'),
        t('courses.courseRequirements.excel.requirement3'),
      ];
    } else if (courseTitle.includes('tableau') || courseTitle.includes('tableu')) {
      return [
        t('courses.courseRequirements.tableau.requirement1'),
        t('courses.courseRequirements.tableau.requirement2'),
        t('courses.courseRequirements.tableau.requirement3'),
      ];
    } else if (courseTitle.includes('sql')) {
      return [
        t('courses.courseRequirements.sql.requirement1'),
        t('courses.courseRequirements.sql.requirement2'),
        t('courses.courseRequirements.sql.requirement3'),
      ];
    }
    
    // Default requirements
    return [
      t('courses.courseRequirements.default.requirement1'),
      t('courses.courseRequirements.default.requirement2'),
      t('courses.courseRequirements.default.requirement3'),
    ];
  };
  
  const getTranslatedWhatsIncluded = (): string[] => {
    return [
      t('courses.includesList.item1'),
      t('courses.includesList.item2'),
      t('courses.includesList.item3'),
      t('courses.includesList.item4'),
      t('courses.includesList.item5'),
      t('courses.includesList.item6'),
      t('courses.includesList.item7'),
      t('courses.includesList.item8'),
    ];
  };
  
  const getTranslatedCourseTags = (course: Course): string[] => {
    const courseTitle = course.title?.toLowerCase() || '';
    
    if (courseTitle.includes('excel')) {
      return [
        t('courses.tags.excel.tag1'),
        t('courses.tags.excel.tag2'),
        t('courses.tags.excel.tag3'),
        t('courses.tags.excel.tag4'),
      ];
    } else if (courseTitle.includes('tableau') || courseTitle.includes('tableu')) {
      return [
        t('courses.tags.tableau.tag1'),
        t('courses.tags.tableau.tag2'),
        t('courses.tags.tableau.tag3'),
        t('courses.tags.tableau.tag4'),
      ];
    } else if (courseTitle.includes('sql')) {
      return [
        t('courses.tags.sql.tag1'),
        t('courses.tags.sql.tag2'),
        t('courses.tags.sql.tag3'),
        t('courses.tags.sql.tag4'),
      ];
    }
    
    // Default tags
    return [
      t('courses.tags.default.tag1'),
      t('courses.tags.default.tag2'),
      t('courses.tags.default.tag3'),
      t('courses.tags.default.tag4'),
    ];
  };
  
  return {
    getTranslatedDescription,
    getTranslatedLearningObjectives,
    getTranslatedFeatures,
    getTranslatedRequirements,
    getTranslatedWhatsIncluded,
    getTranslatedCourseTags,
  };
};

// Company name translations
export const useTranslatedCompanyNames = () => {
  const { t } = useTranslation();
  
  const translateCompanyContext = (context: string): string => {
    const contextMap: { [key: string]: string } = {
      'Created and certified by': t('courses.createdAndCertifiedBy'),
      'Developed by': t('courses.developedBy'),
      'In partnership with': t('courses.inPartnershipWith'),
      'Certified by': t('courses.certifiedBy'),
    };
    
    return contextMap[context] || context;
  };
  
  return { translateCompanyContext };
};

// Job placement translations
export const useTranslatedJobPlacement = () => {
  const { t } = useTranslation();
  
  const getTranslatedJobPlacementText = (totalLearners: number, companies: string[]): string => {
    return t('courses.jobPlacement.text', { 
      count: totalLearners, 
      companies: companies.join(', ') 
    });
  };
  
  return { getTranslatedJobPlacementText };
};

// Course progress translations
export const useTranslatedCourseProgress = () => {
  const { t } = useTranslation();
  
  const getTranslatedProgressElements = () => {
    return {
      dayStreak: t('courses.progress.dayStreak'),
      badges: t('courses.progress.badges'),
      videos: t('courses.progress.videos'),
      completed: t('courses.progress.completed'),
      inProgress: t('courses.progress.inProgress'),
      locked: t('courses.progress.locked'),
    };
  };
  
  const getTranslatedRatingText = (rating: number, totalLearners: number): string => {
    return t('courses.ratingText.text', { 
      rating: rating, 
      count: totalLearners 
    });
  };
  
  return { getTranslatedProgressElements, getTranslatedRatingText };
};

// Community translations
export const useTranslatedCommunity = () => {
  const { t } = useTranslation();
  
  const getCommunityTranslations = () => {
    return {
      createThread: t('community.createThread'),
      createFirstThread: t('community.createFirstThread'),
      thread: t('community.thread'),
      newThread: t('community.newThread'),
    };
  };
  
  return { getCommunityTranslations };
};