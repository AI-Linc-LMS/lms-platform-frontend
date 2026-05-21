/**
 * Strip HTML tags from a string for preview purposes (SSR-safe)
 */
export const stripHtmlTags = (html: string): string => {
  if (!html) return "";
  
  // SSR-safe: Use regex to strip HTML tags if document is not available
  if (typeof window === "undefined" || !document) {
    // Fallback: Remove HTML tags using regex
    return html
      .replace(/<[^>]*>/g, "") // Remove HTML tags
      .replace(/&nbsp;/g, " ") // Replace &nbsp; with space
      .replace(/&amp;/g, "&") // Replace &amp; with &
      .replace(/&lt;/g, "<") // Replace &lt; with <
      .replace(/&gt;/g, ">") // Replace &gt; with >
      .replace(/&quot;/g, '"') // Replace &quot; with "
      .replace(/&#39;/g, "'") // Replace &#39; with '
      .trim();
  }
  
  // Client-side: Use DOM parsing for better accuracy
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  
  // Get text content (strips all HTML tags)
  return tmp.textContent || tmp.innerText || "";
};

/**
 * Get plain text preview from HTML (first N characters)
 */
export const getHtmlPreview = (html: string, maxLength: number = 150): string => {
  const text = stripHtmlTags(html);
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
};

/**
 * Treat single newlines as paragraph breaks so user-entered Enter
 * renders as visible line separation in ReactMarkdown output.
 * Code fences are left untouched.
 */
export const softBreakMarkdown = (md: string): string => {
  if (!md) return md;
  const parts = md.split(/(```[\s\S]*?```)/g);
  return parts
    .map((chunk, i) =>
      i % 2 === 1
        ? chunk
        : chunk.replace(/(?<!\n)\n(?!\n)/g, "\n\n")
    )
    .join("");
};

/**
 * Strip markdown syntax for clean plain-text preview in feed cards.
 */
export const stripMarkdownForPreview = (md: string, maxLength = 160): string => {
  if (!md) return "";
  const text = md
    .replace(/```[\s\S]*?```/g, "[code]")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*\*([^*]+)\*\*\*/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/#{1,6}\s+(.+)/g, "$1")
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/^\s*>\s+/gm, "")
    .replace(/!\[([^\]]*)\]\([^\)]+\)/g, "$1")
    .replace(/\n+/g, " ")
    .trim();
  return text.length > maxLength ? text.slice(0, maxLength).trimEnd() + "…" : text;
};

/**
 * Check if HTML is escaped (contains &lt; or &gt;)
 */
export const isHtmlEscaped = (text: string): boolean => {
  return text.includes("&lt;") || text.includes("&gt;") || text.includes("&amp;");
};

/**
 * Unescape HTML entities (SSR-safe)
 */
export const unescapeHtml = (text: string): string => {
  if (!text) return "";
  
  // SSR-safe: Use string replacement
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&#x60;/g, "`")
    .replace(/&#x3D;/g, "=");
};
