import axios from 'axios';
import { parseVTT, type ParsedVTT } from '../utils/vttParser';

// Types for Vimeo API responses
interface VimeoTextTrack {
  uri: string;
  active: boolean;
  type: string;
  language: string;
  name: string;
  link: string;
  hls_link: string;
  hls_link_expires_time: string;
}

interface VimeoTranscriptResponse {
  total: number;
  page: number;
  per_page: number;
  paging: {
    next?: string;
    previous?: string;
    first: string;
    last: string;
  };
  data: VimeoTextTrack[];
}

interface TranscriptData {
  success: boolean;
  content?: string;
  error?: string;
  language?: string;
  type?: string;
}

/**
 * Extract video ID from Vimeo URL
 */
export const extractVimeoVideoId = (videoUrl: string): string | null => {
  if (!videoUrl) return null;
  
  // Handle different Vimeo URL formats
  const patterns = [
    /vimeo\.com\/(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/,
    /vimeo\.com\/video\/(\d+)/,
  ];
  
  for (const pattern of patterns) {
    const match = videoUrl.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
};

/**
 * Get transcript text tracks from Vimeo API
 */
export const getVimeoTranscriptTracks = async (videoId: string): Promise<VimeoTranscriptResponse> => {
  const accessToken = import.meta.env.VITE_VIMEO_ACCESS_TOKEN;
  
  if (!accessToken) {
    throw new Error('Vimeo access token is not configured. Please add VITE_VIMEO_ACCESS_TOKEN to your environment variables.');
  }
  
  if (!videoId) {
    throw new Error('Video ID is required');
  }
  
  console.log('Vimeo API Request:', {
    videoId,
    hasToken: !!accessToken,
    tokenLength: accessToken?.length,
    url: `https://api.vimeo.com/videos/${videoId}/texttracks`
  });
  
  try {
    const response = await axios.get(`https://api.vimeo.com/videos/${videoId}/texttracks`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.vimeo.*+json;version=3.4',
      },
    });
    
    return response.data as VimeoTranscriptResponse;
  } catch (error: unknown) {
    console.error('Error fetching Vimeo transcript tracks:', error);
    
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: unknown; status?: number } };
      console.error('Error response:', axiosError.response?.data);
      console.error('Error status:', axiosError.response?.status);
      
      if (axiosError.response?.status === 401) {
        throw new Error('Invalid or expired Vimeo access token. Please check your VITE_VIMEO_ACCESS_TOKEN.');
      }
      
      if (axiosError.response?.status === 403) {
        throw new Error('Access denied. Your Vimeo access token may not have the required permissions.');
      }
      
      if (axiosError.response?.status === 404) {
        throw new Error('Video not found. Please check if the video ID is correct and the video exists.');
      }
    }
    
    throw error;
  }
};

/**
 * Fetch transcript content from Vimeo with improved CORS handling
 */
const fetchTranscriptContent = async (transcriptUrl: string): Promise<string> => {
  console.log('🔄 Attempting to fetch transcript from:', transcriptUrl);
  
  // Strategy 1: Direct fetch with proper CORS headers
  try {
    console.log('📡 Strategy 1: Direct fetch with CORS headers');
    const response = await axios.get(transcriptUrl, {
      headers: {
        'Accept': 'text/vtt, text/plain, */*',
        'Cache-Control': 'no-cache',
      },
      withCredentials: false,
      timeout: 10000,
    });
    
    console.log('✅ Direct fetch successful, response length:', response.data.length);
    return response.data;
  } catch (directError) {
    console.log('❌ Direct fetch failed:', directError instanceof Error ? directError.message : 'Unknown error');
  }

  // Strategy 2: Fetch without authorization (for public content)
  try {
    console.log('📡 Strategy 2: Public fetch without auth');
    const response = await axios.get(transcriptUrl, {
      headers: {
        'Accept': 'text/vtt, text/plain, */*',
      },
      withCredentials: false,
      timeout: 10000,
    });
    
    console.log('✅ Public fetch successful, response length:', response.data.length);
    return response.data;
  } catch (publicError) {
    console.log('❌ Public fetch failed:', publicError instanceof Error ? publicError.message : 'Unknown error');
  }

  // Strategy 3: Use cors-anywhere proxy (more reliable)
  try {
    console.log('📡 Strategy 3: Using cors-anywhere proxy');
    const proxyUrl = `https://cors-anywhere.herokuapp.com/${transcriptUrl}`;
    const response = await axios.get(proxyUrl, {
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'text/vtt, text/plain, */*',
      },
      timeout: 15000,
    });
    
    console.log('✅ CORS proxy (cors-anywhere) successful, response length:', response.data.length);
    return response.data;
  } catch (corsError) {
    console.log('❌ CORS proxy (cors-anywhere) failed:', corsError instanceof Error ? corsError.message : 'Unknown error');
  }

  // Strategy 4: Use allorigins proxy as fallback
  try {
    console.log('📡 Strategy 4: Using allorigins proxy');
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(transcriptUrl)}`;
    const response = await axios.get(proxyUrl, {
      timeout: 15000,
    });
    
    if (response.data && response.data.contents) {
      console.log('✅ AllOrigins proxy successful, response length:', response.data.contents.length);
      return response.data.contents;
    } else {
      throw new Error('AllOrigins proxy returned invalid response');
    }
  } catch (alloriginsError) {
    console.log('❌ AllOrigins proxy failed:', alloriginsError instanceof Error ? alloriginsError.message : 'Unknown error');
  }

  // Strategy 5: Use a more reliable CORS proxy
  try {
    console.log('📡 Strategy 5: Using corsproxy.io');
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(transcriptUrl)}`;
    const response = await axios.get(proxyUrl, {
      headers: {
        'Accept': 'text/vtt, text/plain, */*',
      },
      timeout: 15000,
    });
    
    console.log('✅ corsproxy.io successful, response length:', response.data.length);
    return response.data;
  } catch (corsproxyError) {
    console.log('❌ corsproxy.io failed:', corsproxyError instanceof Error ? corsproxyError.message : 'Unknown error');
  }

  // Strategy 6: Try a simple fetch without axios (sometimes works better)
  try {
    console.log('📡 Strategy 6: Native fetch without axios');
    const response = await fetch(transcriptUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/vtt, text/plain, */*',
      },
      mode: 'cors',
    });
    
    if (response.ok) {
      const content = await response.text();
      console.log('✅ Native fetch successful, response length:', content.length);
      return content;
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (fetchError) {
    console.log('❌ Native fetch failed:', fetchError instanceof Error ? fetchError.message : 'Unknown error');
  }

  // If all strategies fail, throw a comprehensive error
  throw new Error(`Failed to fetch transcript content from ${transcriptUrl}. All CORS proxy strategies failed. This may be due to:
1. The video's transcript is not publicly accessible
2. Network connectivity issues
3. Vimeo's CORS policy restrictions
4. The transcript URL may have expired

Please check:
- Your internet connection
- That the video has publicly accessible transcripts
- Your Vimeo access token permissions
- Try using a different video URL for testing`);
};

/**
 * Parse VTT content and return structured transcript data
 */
export const parseTranscriptContent = (vttContent: string): ParsedVTT => {
  try {
    console.log('Parsing VTT content, length:', vttContent.length);
    console.log('Content preview:', vttContent.substring(0, 200));
    
    // Check if content looks like VTT
    if (!vttContent.includes('WEBVTT') && !vttContent.includes('-->')) {
      // Try to detect if it's JSON response with VTT content
      try {
        const jsonData = JSON.parse(vttContent);
        if (jsonData.contents && typeof jsonData.contents === 'string') {
          console.log('Found VTT content in JSON wrapper');
          return parseVTT(jsonData.contents);
        }
      } catch {
        // Not JSON, continue with error
      }
      
      throw new Error('Content does not appear to be valid WebVTT format');
    }
    
    const parsed = parseVTT(vttContent);
    console.log('VTT parsing successful, cues found:', parsed.cues.length);
    
    if (parsed.cues.length === 0) {
      throw new Error('No transcript cues found in the VTT content');
    }
    
    return parsed;
  } catch (error) {
    console.error('Error parsing VTT content:', error);
    console.error('Content that failed to parse:', vttContent.substring(0, 500));
    throw new Error(`Failed to parse transcript: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Main function to get transcript for a Vimeo video with VTT parsing
 */
export const getVimeoTranscript = async (videoUrl: string): Promise<{
  content: boolean; success: boolean; transcript?: ParsedVTT; error?: string 
}> => {
  console.log('🎬 Starting transcript fetch for:', videoUrl);
  
  try {
    // Extract video ID from URL
    const videoId = extractVimeoVideoId(videoUrl);
    if (!videoId) {
      console.error('❌ Could not extract video ID from URL');
      return {
        success: false,
        error: 'Invalid Vimeo URL - could not extract video ID',
      };
    }
    
    console.log('🔍 Extracted video ID:', videoId);
    
    // Get available text tracks
    console.log('📡 Fetching available text tracks...');
    const tracksResponse = await getVimeoTranscriptTracks(videoId);
    
    if (!tracksResponse.data || tracksResponse.data.length === 0) {
      console.log('❌ No text tracks found for this video');
      return {
        success: false,
        error: 'No transcripts available for this video',
      };
    }
    
    console.log('✅ Found', tracksResponse.data.length, 'text tracks');
    tracksResponse.data.forEach((track, index) => {
      console.log(`📝 Track ${index + 1}:`, {
        language: track.language,
        type: track.type,
        active: track.active,
        name: track.name,
        hasLink: !!track.link,
        hasHlsLink: !!track.hls_link
      });
    });
    
    // Find the best transcript (prefer English, active tracks)
    const bestTrack = tracksResponse.data.find(track => 
      track.active && track.language === 'en'
    ) || tracksResponse.data.find(track => 
      track.active
    ) || tracksResponse.data[0];
    
    if (!bestTrack) {
      console.error('❌ No suitable transcript track found');
      return {
        success: false,
        error: 'No suitable transcript track found',
      };
    }
    
    console.log('🎯 Selected transcript track:', {
      language: bestTrack.language,
      type: bestTrack.type,
      active: bestTrack.active,
      name: bestTrack.name
    });
    
    // Use hls_link if available and not expired, otherwise use regular link
    const transcriptUrl = bestTrack.hls_link && 
      new Date(bestTrack.hls_link_expires_time) > new Date() 
      ? bestTrack.hls_link 
      : bestTrack.link;
    
    console.log('🔗 Using transcript URL:', transcriptUrl);
    console.log('⏰ HLS link expires:', bestTrack.hls_link_expires_time);
    
    // Fetch the transcript content
    console.log('📥 Fetching transcript content...');
    const transcriptContent = await fetchTranscriptContent(transcriptUrl);
    
    if (!transcriptContent || transcriptContent.length === 0) {
      console.error('❌ Received empty transcript content');
      return {
        success: false,
        error: 'Received empty transcript content',
      };
    }
    
    console.log('✅ Transcript content fetched, length:', transcriptContent.length);
    
    // Parse the VTT content
    console.log('🔄 Parsing VTT content...');
    const parsedTranscript = parseTranscriptContent(transcriptContent);
    
    console.log('🎉 Transcript successfully parsed!');
    console.log('📊 Final stats:', {
      format: parsedTranscript.format,
      cues: parsedTranscript.cues.length,
      plainTextLength: parsedTranscript.plainText.length
    });
    
    return {
      success: true,
      transcript: parsedTranscript,
    };
    
  } catch (error) {
    console.error('💥 Error in getVimeoTranscript:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Unknown error occurred';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Check for specific error types
      if (error.message.includes('CORS')) {
        errorMessage = 'Unable to fetch transcript due to CORS restrictions. The video may not have publicly accessible transcripts.';
      } else if (error.message.includes('access token')) {
        errorMessage = 'Vimeo access token is invalid or missing. Please check your environment configuration.';
      } else if (error.message.includes('404')) {
        errorMessage = 'Video or transcript not found. Please check if the video exists and has transcripts available.';
      } else if (error.message.includes('403')) {
        errorMessage = 'Access denied. Your Vimeo token may not have the required permissions.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please check your internet connection and try again.';
      }
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Get transcript with fallback to different languages
 */
export const getVimeoTranscriptWithFallback = async (
  videoUrl: string,
  preferredLanguages: string[] = ['en', 'en-US', 'en-GB']
): Promise<TranscriptData> => {
  try {
    const videoId = extractVimeoVideoId(videoUrl);
    if (!videoId) {
      return {
        success: false,
        error: 'Invalid Vimeo URL - could not extract video ID',
      };
    }
    
    const tracksResponse = await getVimeoTranscriptTracks(videoId);
    
    if (!tracksResponse.data || tracksResponse.data.length === 0) {
      return {
        success: false,
        error: 'No transcripts available for this video',
      };
    }
    
    // Try to find transcript in preferred languages
    let selectedTrack: VimeoTextTrack | null = null;
    
    for (const lang of preferredLanguages) {
      const foundTrack = tracksResponse.data.find(track => 
        track.active && track.language === lang
      );
      if (foundTrack) {
        selectedTrack = foundTrack;
        break;
      }
    }
    
    // If no preferred language found, use first active track
    if (!selectedTrack) {
      const activeTrack = tracksResponse.data.find(track => track.active);
      selectedTrack = activeTrack || tracksResponse.data[0] || null;
    }
    
    if (!selectedTrack) {
      return {
        success: false,
        error: 'No suitable transcript track found',
      };
    }
    
    const transcriptUrl = selectedTrack.hls_link && 
      new Date(selectedTrack.hls_link_expires_time) > new Date() 
      ? selectedTrack.hls_link 
      : selectedTrack.link;
    
    const transcriptContent = await fetchTranscriptContent(transcriptUrl);
    
    return {
      success: true,
      content: transcriptContent,
      language: selectedTrack.language,
      type: selectedTrack.type,
    };
    
  } catch (error) {
    console.error('Error getting Vimeo transcript with fallback:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}; 