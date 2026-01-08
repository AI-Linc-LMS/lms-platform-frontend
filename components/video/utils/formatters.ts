export function isVimeoUrl(url: string): boolean {
  return url.includes("vimeo.com");
}

export function processVimeoUrl(url: string): string {
  if (!url) return "";
  
  // If already a player URL, ensure it has proper parameters
  if (url.includes("player.vimeo.com")) {
    // Remove any existing loop parameter
    let cleanUrl = url.replace(/[&?]loop=\d+/g, '');
    
    // Check if URL already has api parameter
    const hasApi = cleanUrl.includes('api=1');
    
    if (cleanUrl.includes("?")) {
      // URL has query params
      if (!hasApi) {
        cleanUrl += "&api=1";
      }
      cleanUrl += "&loop=0&autopause=0";
    } else {
      // No query params
      cleanUrl += "?api=1&loop=0&autopause=0";
    }
    
    return cleanUrl;
  }
  
  // Extract Vimeo ID from regular vimeo.com URL
  const vimeoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
  if (vimeoId) {
    const processedUrl = `https://player.vimeo.com/video/${vimeoId}?api=1&loop=0&autopause=0`;
    return processedUrl;
  }
  
  return url;
}



