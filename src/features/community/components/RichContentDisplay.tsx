import React, { useEffect, useRef } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism.css';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-yaml';

interface RichContentDisplayProps {
  content: string;
  className?: string;
  darkMode?: boolean;
}

const RichContentDisplay: React.FC<RichContentDisplayProps> = ({ 
  content, 
  className = '', 
  darkMode = false 
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      // Enhance plain <pre><code> blocks with a nicer UI wrapper (header + copy)
      const codeNodes = contentRef.current.querySelectorAll('pre > code');
      codeNodes.forEach((code) => {
        const pre = code.parentElement as HTMLElement | null;
        if (!pre) return;

        // Skip if already wrapped
        const alreadyWrapped = pre.parentElement?.classList.contains('code-block-wrapper');
        if (alreadyWrapped) return;

        // Assign language if missing
        const className = code.className || '';
        const match = className.match(/language-([a-z0-9+#-]+)/i);
        const language = match ? match[1] : 'text';
        if (!match) {
          code.className = `${className} language-text`.trim();
          pre.className = `${pre.className} language-text`.trim();
        }

        // Create wrapper with header
        const wrapper = document.createElement('div');
        wrapper.className = 'code-block-wrapper';
        wrapper.setAttribute('data-wrapped', 'true');
        wrapper.setAttribute('style', `margin: 16px 0; border-radius: 8px; overflow: hidden; ${darkMode ? 'background: #1e1e1e;' : 'background: #f8f9fa;'} border: 1px solid ${darkMode ? '#404040' : '#e9ecef'};`);

        const header = document.createElement('div');
        header.className = 'code-header';
        header.setAttribute('style', `padding: 8px 16px; ${darkMode ? 'background: #2d2d2d; color: #cccccc;' : 'background: #f1f3f4; color: #5f6368;'} border-bottom: 1px solid ${darkMode ? '#404040' : '#e9ecef'}; font-size: 12px; font-weight: 500; display: flex; justify-content: space-between; align-items: center;`);
        const title = document.createElement('span');
        title.textContent = language === 'text' ? 'Plain Text' : language;
        const button = document.createElement('button');
        const codeBlockId = `code-block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        pre.id = codeBlockId;
        button.textContent = 'Copy';
        button.setAttribute('onclick', `copyCodeToClipboard('${codeBlockId}')`);
        button.setAttribute('style', 'background: none; border: none; color: inherit; cursor: pointer; font-size: 11px; opacity: 0.7;');
        header.appendChild(title);
        header.appendChild(button);

        // Ensure pre/code have expected classes and styles
        pre.className = `${pre.className} code-content ${match ? `language-${language}` : 'language-text'}`.trim();
        pre.setAttribute('style', `padding: 16px; margin: 0; overflow-x: auto; ${darkMode ? 'background: #1e1e1e; color: #d4d4d4;' : 'background: #ffffff; color: #333333;'} font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', monospace; font-size: 14px; line-height: 1.5; white-space: pre; tab-size: 2;`);

        // Build wrapper
        const originalPre = pre.cloneNode(true);
        wrapper.appendChild(header);
        wrapper.appendChild(originalPre);
        // Replace old pre with wrapper
        pre.replaceWith(wrapper);
      });

      // Add copy functionality to code blocks
      (window as unknown as { copyCodeToClipboard: (id: string) => void }).copyCodeToClipboard = (codeBlockId: string) => {
        const codeElement = document.getElementById(codeBlockId);
        if (codeElement) {
          const textContent = codeElement.textContent || '';
          navigator.clipboard.writeText(textContent).then(() => {
            // Show temporary success message
            const button = codeElement.parentElement?.querySelector('button');
            if (button) {
              const originalText = button.textContent;
              button.textContent = 'Copied!';
              setTimeout(() => {
                button.textContent = originalText;
              }, 2000);
            }
          });
        }
      };

      // Apply syntax highlighting to all code blocks
      const codeBlocks = contentRef.current.querySelectorAll('pre code');
      codeBlocks.forEach((block) => {
        const el = block as Element;
        if (![...el.classList].some((c) => c.startsWith('language-'))) {
          el.classList.add('language-text');
        }
        Prism.highlightElement(el);
      });
    }

    return () => {
      delete (window as unknown as { copyCodeToClipboard?: (id: string) => void }).copyCodeToClipboard;
    };
  }, [content, darkMode]);

  return (
    <div
      ref={contentRef}
      className={`prose prose-sm max-w-none ${darkMode ? 'prose-invert' : ''} ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
      style={{
        wordBreak: 'break-word',
      }}
    />
  );
};

export default RichContentDisplay;
