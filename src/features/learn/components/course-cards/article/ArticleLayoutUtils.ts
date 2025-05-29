// ArticleLayoutUtils.ts - Utility functions and templates for dynamic article layouts

export interface ArticleLayoutConfig {
  container?: {
    className?: string;
    style?: React.CSSProperties;
  };
  header?: {
    className?: string;
    style?: React.CSSProperties;
    showTitle?: boolean;
    showMetadata?: boolean;
    showMarks?: boolean;
    titleClassName?: string;
    metadataClassName?: string;
    marksClassName?: string;
  };
  content?: {
    className?: string;
    style?: React.CSSProperties;
    wrapperClassName?: string;
  };
  actions?: {
    className?: string;
    style?: React.CSSProperties;
    buttonClassName?: string;
    buttonText?: string;
    showIcon?: boolean;
  };
}

// Predefined layout templates that can be sent from backend
export const ARTICLE_LAYOUT_TEMPLATES = {
  // Default modern layout
  DEFAULT: {
    container: {
      className: "max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-sm relative pb-10"
    },
    header: {
      className: "flex justify-between items-center mb-6",
      showTitle: true,
      showMetadata: true,
      showMarks: true,
      titleClassName: "text-2xl font-semibold capitalize text-gray-800 mb-2",
      metadataClassName: "flex items-center gap-4 text-sm text-gray-500",
      marksClassName: "text-lg text-semibold text-[#007B9F] bg-[#EFF9FC] px-2 py-1 rounded-md"
    },
    content: {
      className: "course-description prose prose-lg max-w-none",
      wrapperClassName: "my-8"
    },
    actions: {
      className: "flex justify-end mt-8",
      buttonClassName: "flex items-center gap-2 px-6 py-6 rounded-3xl text-base font-medium bg-[#12293A] text-white transition hover:bg-[#1a3a4f]",
      buttonText: "Mark as completed",
      showIcon: true
    }
  } as ArticleLayoutConfig,

  // Compact layout for mobile or sidebar
  COMPACT: {
    container: {
      className: "max-w-2xl mx-auto p-4 bg-white rounded-md shadow-sm relative pb-6"
    },
    header: {
      className: "flex flex-col gap-3 mb-4",
      showTitle: true,
      showMetadata: true,
      showMarks: true,
      titleClassName: "text-lg font-semibold text-gray-800",
      metadataClassName: "flex items-center gap-3 text-xs text-gray-500",
      marksClassName: "text-sm font-medium text-[#007B9F] bg-[#EFF9FC] px-2 py-1 rounded self-start"
    },
    content: {
      className: "course-description text-sm leading-relaxed",
      wrapperClassName: "my-4"
    },
    actions: {
      className: "flex justify-center mt-6",
      buttonClassName: "flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-medium bg-[#12293A] text-white transition",
      buttonText: "Complete",
      showIcon: true
    }
  } as ArticleLayoutConfig,

  // Full-width immersive layout
  IMMERSIVE: {
    container: {
      className: "w-full min-h-screen bg-gradient-to-br from-gray-50 to-white relative",
      style: { padding: "2rem 1rem" }
    },
    header: {
      className: "max-w-6xl mx-auto flex justify-between items-start mb-12",
      showTitle: true,
      showMetadata: true,
      showMarks: true,
      titleClassName: "text-4xl font-bold text-gray-900 mb-4 leading-tight",
      metadataClassName: "flex items-center gap-6 text-base text-gray-600",
      marksClassName: "text-xl font-semibold text-white bg-gradient-to-r from-[#007B9F] to-[#005a7a] px-4 py-2 rounded-lg shadow-lg"
    },
    content: {
      className: "course-description prose prose-xl max-w-none text-gray-800 leading-relaxed",
      wrapperClassName: "max-w-6xl mx-auto bg-white rounded-2xl shadow-xl p-12 mb-12"
    },
    actions: {
      className: "max-w-6xl mx-auto flex justify-center",
      buttonClassName: "flex items-center gap-3 px-8 py-4 rounded-full text-lg font-semibold bg-gradient-to-r from-[#12293A] to-[#1a3a4f] text-white transition transform hover:scale-105 shadow-lg",
      buttonText: "Mark as Completed",
      showIcon: true
    }
  } as ArticleLayoutConfig,

  // Minimal clean layout
  MINIMAL: {
    container: {
      className: "max-w-3xl mx-auto p-8 bg-white relative"
    },
    header: {
      className: "border-b border-gray-200 pb-6 mb-8",
      showTitle: true,
      showMetadata: false,
      showMarks: false,
      titleClassName: "text-3xl font-light text-gray-900 mb-0",
      metadataClassName: "",
      marksClassName: ""
    },
    content: {
      className: "course-description prose prose-lg max-w-none text-gray-700 font-light leading-loose",
      wrapperClassName: "mb-12"
    },
    actions: {
      className: "border-t border-gray-200 pt-6 flex justify-end",
      buttonClassName: "text-[#007B9F] font-medium hover:text-[#005a7a] transition underline",
      buttonText: "Mark Complete",
      showIcon: false
    }
  } as ArticleLayoutConfig,

  // Card-based layout
  CARD: {
    container: {
      className: "max-w-5xl mx-auto p-6 relative"
    },
    header: {
      className: "bg-white rounded-t-xl shadow-sm border border-gray-200 p-6 flex justify-between items-center",
      showTitle: true,
      showMetadata: true,
      showMarks: true,
      titleClassName: "text-2xl font-semibold text-gray-800 mb-2",
      metadataClassName: "flex items-center gap-4 text-sm text-gray-500",
      marksClassName: "bg-[#007B9F] text-white px-3 py-1 rounded-full text-sm font-medium"
    },
    content: {
      className: "course-description prose max-w-none",
      wrapperClassName: "bg-white border-l border-r border-gray-200 p-8"
    },
    actions: {
      className: "bg-gray-50 rounded-b-xl border border-gray-200 border-t-0 p-6 flex justify-end",
      buttonClassName: "flex items-center gap-2 px-6 py-3 rounded-lg text-base font-medium bg-[#12293A] text-white transition hover:bg-[#1a3a4f]",
      buttonText: "Complete Article",
      showIcon: true
    }
  } as ArticleLayoutConfig,

  // Dark theme layout
  DARK: {
    container: {
      className: "max-w-4xl mx-auto p-6 bg-gray-900 rounded-lg shadow-2xl relative pb-10"
    },
    header: {
      className: "flex justify-between items-center mb-6 border-b border-gray-700 pb-4",
      showTitle: true,
      showMetadata: true,
      showMarks: true,
      titleClassName: "text-2xl font-semibold text-white mb-2",
      metadataClassName: "flex items-center gap-4 text-sm text-gray-400",
      marksClassName: "text-lg font-semibold text-[#00a8cc] bg-gray-800 px-3 py-1 rounded-md border border-gray-700"
    },
    content: {
      className: "course-description prose prose-invert prose-lg max-w-none text-gray-300",
      wrapperClassName: "my-8"
    },
    actions: {
      className: "flex justify-end mt-8",
      buttonClassName: "flex items-center gap-2 px-6 py-6 rounded-3xl text-base font-medium bg-gradient-to-r from-[#007B9F] to-[#00a8cc] text-white transition hover:from-[#005a7a] hover:to-[#007B9F]",
      buttonText: "Mark as completed",
      showIcon: true
    }
  } as ArticleLayoutConfig
};

// Utility function to merge layout configurations
export const mergeLayoutConfigs = (
  defaultConfig: ArticleLayoutConfig,
  customConfig?: Partial<ArticleLayoutConfig>
): ArticleLayoutConfig => {
  if (!customConfig) return defaultConfig;

  return {
    container: { ...defaultConfig.container, ...customConfig.container },
    header: { ...defaultConfig.header, ...customConfig.header },
    content: { ...defaultConfig.content, ...customConfig.content },
    actions: { ...defaultConfig.actions, ...customConfig.actions }
  };
};

// Utility function to get layout by template name
export const getLayoutTemplate = (templateName: keyof typeof ARTICLE_LAYOUT_TEMPLATES): ArticleLayoutConfig => {
  return ARTICLE_LAYOUT_TEMPLATES[templateName] || ARTICLE_LAYOUT_TEMPLATES.DEFAULT;
};

// Utility function to validate layout configuration
export const validateLayoutConfig = (config: unknown): config is ArticleLayoutConfig => {
  if (!config || typeof config !== 'object') return false;
  
  // Basic validation - can be extended
  const validSections = ['container', 'header', 'content', 'actions'];
  const configKeys = Object.keys(config as Record<string, unknown>);
  
  return configKeys.every(key => validSections.includes(key));
};

// Example of how backend can send different layouts:
export const BACKEND_LAYOUT_EXAMPLES = {
  // Example 1: Using a predefined template
  usingTemplate: {
    template: "IMMERSIVE", // Backend sends template name
    customizations: {
      header: {
        titleClassName: "text-5xl font-black text-purple-900"
      }
    }
  },

  // Example 2: Complete custom layout
  customLayout: {
    layout_config: {
      container: {
        className: "max-w-6xl mx-auto p-8 bg-gradient-to-r from-blue-50 to-indigo-100 rounded-2xl shadow-xl relative"
      },
      header: {
        className: "text-center mb-10",
        showTitle: true,
        showMetadata: true,
        showMarks: true,
        titleClassName: "text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4",
        metadataClassName: "flex justify-center items-center gap-6 text-lg text-gray-600",
        marksClassName: "inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full font-bold text-lg shadow-lg"
      },
      content: {
        className: "course-description prose prose-xl max-w-none text-gray-800",
        wrapperClassName: "bg-white rounded-xl shadow-inner p-10 mb-10"
      },
      actions: {
        className: "text-center",
        buttonClassName: "inline-flex items-center gap-3 px-10 py-4 rounded-full text-xl font-bold bg-gradient-to-r from-green-500 to-blue-600 text-white transition transform hover:scale-110 shadow-2xl",
        buttonText: "🎉 Complete This Amazing Article!",
        showIcon: true
      }
    }
  },

  // Example 3: Responsive layout with different mobile/desktop configs
  responsiveLayout: {
    layout_config: {
      container: {
        className: "max-w-4xl mx-auto p-4 md:p-6 bg-white rounded-lg shadow-sm relative pb-10"
      },
      header: {
        className: "flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6",
        showTitle: true,
        showMetadata: true,
        showMarks: true,
        titleClassName: "text-xl md:text-2xl font-semibold text-gray-800",
        metadataClassName: "flex items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-500",
        marksClassName: "text-sm md:text-lg font-semibold text-[#007B9F] bg-[#EFF9FC] px-2 py-1 rounded-md self-start"
      },
      content: {
        className: "course-description prose prose-sm md:prose-lg max-w-none",
        wrapperClassName: "my-6 md:my-8"
      },
      actions: {
        className: "flex justify-center md:justify-end mt-6 md:mt-8",
        buttonClassName: "flex items-center gap-2 px-4 py-3 md:px-6 md:py-6 rounded-2xl md:rounded-3xl text-sm md:text-base font-medium bg-[#12293A] text-white transition",
        buttonText: "Mark as completed",
        showIcon: true
      }
    }
  }
};

// Type for backend response that includes layout
export interface ArticleWithLayout {
  id: number;
  content_title: string;
  content_type: string;
  duration_in_minutes: number;
  order: number;
  details: {
    id: number;
    title: string;
    content: string;
    difficulty_level: string;
    marks?: number;
    layout_config?: ArticleLayoutConfig;
  };
  marks?: number;
  status: string;
  layout_config?: ArticleLayoutConfig;
  template?: keyof typeof ARTICLE_LAYOUT_TEMPLATES; // Alternative: just send template name
} 