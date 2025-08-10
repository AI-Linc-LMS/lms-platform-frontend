import React from 'react';

interface RichContentDisplayProps {
  content: string;
  className?: string;
}

const RichContentDisplay: React.FC<RichContentDisplayProps> = ({ content, className = '' }) => {
  return (
    <div
      className={`prose prose-sm max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
      style={{
        wordBreak: 'break-word',
      }}
    />
  );
};

export default RichContentDisplay;
