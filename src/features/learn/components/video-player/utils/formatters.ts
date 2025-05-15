/**
 * Format seconds into mm:ss format
 */
export const formatTime = (timeInSeconds: number): string => {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

/**
 * Process Vimeo URL for embedding
 */
export const processVimeoUrl = (url: string): string => {
  if (!url) return '';

  // Decode HTML entities
  let processedUrl = url.replace(/&amp;/g, '&');

  // If it's a regular Vimeo URL (not a player URL), convert it
  if (processedUrl.includes('vimeo.com') && !processedUrl.includes('player.vimeo.com')) {
    const vimeoRegex = /vimeo.com\/(\d+)/;
    const match = processedUrl.match(vimeoRegex);

    if (match && match[1]) {
      const videoId = match[1];
      processedUrl = `https://player.vimeo.com/video/${videoId}`;
    }
  }

  // Add necessary parameters for embedding if they don't exist
  if (!processedUrl.includes('?')) {
    processedUrl += '?';
  } else if (!processedUrl.endsWith('&') && !processedUrl.endsWith('?')) {
    processedUrl += '&';
  }

  // Add essential parameters for proper embedding
  return processedUrl + 'dnt=1&app_id=122963&title=0&byline=0&portrait=0&playsinline=1&controls=1';
};

/**
 * Check if URL is a Vimeo URL
 */
export const isVimeoUrl = (url: string): boolean => {
  return url.includes('vimeo.com') || url.includes('player.vimeo.com');
}; 