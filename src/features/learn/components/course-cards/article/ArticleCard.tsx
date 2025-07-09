import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCourseContent } from '../../../../../services/enrolled-courses-content/courseContentApis';
import { submitContent } from '../../../../../services/enrolled-courses-content/submitApis';
import FloatingAIButton from "../../floating-ai-button/FloatingAIButton";
import completedIcon from "../../../../../commonComponents/icons/sidebarIcons/completedIcon.png";
import { useNavigate } from 'react-router-dom';
import parse from "html-react-parser";
import {
  ArticleLayoutConfig,
  ARTICLE_LAYOUT_TEMPLATES,
  getLayoutTemplate,
  mergeLayoutConfigs,
  validateLayoutConfig
} from './ArticleLayoutUtils';

interface ArticleCardProps {
  contentId: number;
  courseId: number;
  onMarkComplete: () => void;
}

interface ArticleDetails {
  id: number;
  title: string;
  content: string;
  difficulty_level: string;
  marks?: number;
  layout_config?: ArticleLayoutConfig; // New field for layout configuration
  template?: keyof typeof ARTICLE_LAYOUT_TEMPLATES; // Template name from backend
}

interface ArticleData {
  id: number;
  content_title: string;
  content_type: string;
  duration_in_minutes: number;
  order: number;
  details: ArticleDetails;
  marks?: number;
  status: string;
  layout_config?: ArticleLayoutConfig; // Can also be at the top level
  template?: keyof typeof ARTICLE_LAYOUT_TEMPLATES; // Template name from backend
}

const ArticleCard: React.FC<ArticleCardProps> = ({ contentId, courseId, onMarkComplete }) => {
  const navigate = useNavigate();

  const { data: articleData, isLoading, error } = useQuery<ArticleData>({
    queryKey: ['article', contentId],
    queryFn: () => getCourseContent(1, courseId, contentId),
  });

  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (articleData && typeof articleData.status === 'string') {
      setIsCompleted(articleData.status === 'complete');
    }

    if (articleData?.duration_in_minutes) {
      setTimeLeft(articleData.duration_in_minutes * 60); // Convert minutes to seconds
    }
  }, [articleData]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => (prevTime !== null ? prevTime - 1 : null));
    }, 1000);

    return () => clearInterval(timer); // Cleanup on unmount
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleMarkComplete = async () => {
    try {
      await submitContent(1, courseId, contentId, 'Article', {});
      setIsCompleted(!isCompleted);
      onMarkComplete();
      navigate(0);
    } catch {
      //console.log(err);
      // handle error
    }
  };

  // Enhanced function to safely parse HTML content with better error handling
  const parseHtmlContent = (htmlContent: string) => {
    if (!htmlContent) {
      return null;
    }

    try {
      // Create a wrapper around the content to avoid React rendering issues
      const wrapWithDiv = (content: string) => `<div>${content}</div>`;

      let processedContent = htmlContent;

      // Check if we have HTML content
      if (htmlContent.includes('<') && htmlContent.includes('>')) {
        // Remove any style tags but keep other content
        processedContent = htmlContent.replace(/<style[\s\S]*?<\/style>/gi, '');

        // Remove script tags for security
        processedContent = processedContent.replace(/<script[\s\S]*?<\/script>/gi, '');

        // Extract content from body tag if present
        const bodyMatch = processedContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        if (bodyMatch && bodyMatch[1]) {
          processedContent = bodyMatch[1].trim();
        }

        // Extract content from html tag if present
        const htmlMatch = processedContent.match(/<html[^>]*>([\s\S]*?)<\/html>/i);
        if (htmlMatch && htmlMatch[1]) {
          processedContent = htmlMatch[1].trim();
        }
      }

      // For debugging
      //console.log('Processed article content:', processedContent.substring(0, 100) + '...');

      return parse(wrapWithDiv(processedContent));
    } catch {
      //console.error('Error parsing HTML content:', error);
      return (
        <div className="p-3 bg-red-100 border border-red-300 rounded text-red-700">
          Error rendering content. Please try refreshing the page.
        </div>
      );
    }
  };

  // Enhanced layout configuration function with template support
  const getLayoutConfig = (): ArticleLayoutConfig => {
    if (!articleData) return ARTICLE_LAYOUT_TEMPLATES.DEFAULT;

    // Priority: 
    // 1. details.layout_config (specific layout config)
    // 2. details.template (template name)
    // 3. articleData.layout_config (top-level layout config)
    // 4. articleData.template (top-level template name)
    // 5. DEFAULT template

    let baseConfig: ArticleLayoutConfig;
    let customConfig: Partial<ArticleLayoutConfig> | undefined;

    // Check for template first
    const templateName = articleData.details?.template || articleData.template;
    if (templateName && templateName in ARTICLE_LAYOUT_TEMPLATES) {
      //console.log(`Using template: ${templateName}`);
      baseConfig = getLayoutTemplate(templateName);
    } else {
      baseConfig = ARTICLE_LAYOUT_TEMPLATES.DEFAULT;
    }

    // Check for custom layout config
    const backendConfig = articleData.details?.layout_config || articleData.layout_config;
    if (backendConfig && validateLayoutConfig(backendConfig)) {
      //console.log('Using custom layout config from backend');
      customConfig = backendConfig;
    }

    // Merge configurations
    return mergeLayoutConfigs(baseConfig, customConfig);
  };

  // Render loading state with configurable layout
  const renderLoadingState = () => {
    const layoutConfig = getLayoutConfig();

    return (
      <div className={`${layoutConfig.container?.className || ''} animate-pulse`} style={layoutConfig.container?.style}>
        <div className={layoutConfig.header?.className || ''}>
          <div>
            <div className="h-7 w-64 bg-gray-200 rounded mb-2"></div>
            <div className="flex items-center gap-4">
              <div className="h-4 w-20 bg-gray-200 rounded"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
              <div className="h-4 w-20 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div className="h-8 w-24 bg-gray-200 rounded"></div>
        </div>
        <div className="h-40 w-full bg-gray-100 rounded mb-4"></div>
        <div className={layoutConfig.actions?.className || ''}>
          <div className="h-12 w-56 bg-gray-200 rounded-2xl"></div>
        </div>
      </div>
    );
  };

  // Render header section dynamically
  const renderHeader = (layoutConfig: ArticleLayoutConfig) => {
    const headerConfig = layoutConfig.header;
    if (!headerConfig) return null;

    const marks = articleData!.details.marks ?? articleData!.marks ?? 0;

    return (
      <div className={headerConfig.className || ''} style={headerConfig.style}>
        <div>
          {headerConfig.showTitle && (
            <h1 className={headerConfig.titleClassName || ''}>
              {articleData!.content_title}
            </h1>
          )}
          {headerConfig.showMetadata && (
            <div className={headerConfig.metadataClassName || ''}>
              <span>⏱ {timeLeft !== null ? formatTime(timeLeft) : '0:00'}</span>
              <span>•</span>
              <span>📚 {articleData!.details.difficulty_level}</span>
            </div>
          )}
        </div>
        {headerConfig.showMarks && (
          <div className="flex flex-col items-end">
            <span className={headerConfig.marksClassName || ''}>{marks} Marks</span>
          </div>
        )}
      </div>
    );
  };

  // Render content section dynamically
  const renderContent = (layoutConfig: ArticleLayoutConfig) => {
    const contentConfig = layoutConfig.content;
    if (!contentConfig) return null;

    const contentElement = articleData!.details.content ?
      parseHtmlContent(articleData!.details.content) :
      <p className="text-gray-500 italic">No content available</p>;

    return (
      <div className={contentConfig.wrapperClassName || ''}>
        <div className={contentConfig.className || ''} style={contentConfig.style}>
          {contentElement}
        </div>
      </div>
    );
  };

  // Render actions section dynamically
  const renderActions = (layoutConfig: ArticleLayoutConfig) => {
    const actionsConfig = layoutConfig.actions;
    if (!actionsConfig || isCompleted) return null;

    return (
      <div className={actionsConfig.className || ''} style={actionsConfig.style}>
        <button
          onClick={handleMarkComplete}
          className={actionsConfig.buttonClassName || ''}
          style={{ minWidth: 220, justifyContent: 'center' }}
        >
          <span>{actionsConfig.buttonText || 'Mark as completed'}</span>
          {actionsConfig.showIcon && (
            <span className="flex items-center justify-center w-6 h-6 rounded-full">
              <img
                src={completedIcon}
                alt="check"
                className="w-6 h-6"
              />
            </span>
          )}
        </button>
      </div>
    );
  };

  if (isLoading || error) {
    return renderLoadingState();
  }

  if (!articleData) {
    return <div className="flex justify-center items-center h-64">Article not found</div>;
  }

  const layoutConfig = getLayoutConfig();

  return (
    <div className={layoutConfig.container?.className || ''} style={layoutConfig.container?.style}>
      {renderHeader(layoutConfig)}
      {renderContent(layoutConfig)}

      {/* Floating Ask AI Button - always rendered */}
      <FloatingAIButton
        onClick={() => {}}
      />

      {renderActions(layoutConfig)}
    </div>
  );
};

export default ArticleCard;