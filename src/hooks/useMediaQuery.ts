import { useState, useEffect } from 'react';

/**
 * Hook that returns whether a media query matches the current viewport
 * @param query Media query string (e.g., '(max-width: 768px)')
 * @returns boolean indicating if the media query matches
 */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Create a media query list using the provided query
    const media = window.matchMedia(query);
    
    // Set the initial value
    setMatches(media.matches);
    
    // Define a listener to update the state when the match changes
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };
    
    // Add the listener to the media query list
    media.addEventListener('change', listener);
    
    // Clean up the listener when the component unmounts
    return () => {
      media.removeEventListener('change', listener);
    };
  }, [query]);

  return matches;
};

export default useMediaQuery; 