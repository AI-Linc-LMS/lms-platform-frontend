import axios from 'axios';
import { getVimeoTranscript } from '../services/vimeoTranscriptApi';

/**
 * Debug utility to test Vimeo API authentication
 */
export const debugVimeoAuth = async (): Promise<void> => {
  const accessToken = import.meta.env.VITE_VIMEO_ACCESS_TOKEN;
  
  console.log('=== Vimeo Authentication Debug ===');
  console.log('Environment:', import.meta.env.MODE);
  console.log('Has access token:', !!accessToken);
  console.log('Token length:', accessToken?.length || 0);
  console.log('Token preview:', accessToken ? `${accessToken.substring(0, 8)}...` : 'Not found');
  
  if (!accessToken) {
    console.error('❌ VITE_VIMEO_ACCESS_TOKEN is not set in environment variables');
    console.log('📝 To fix this:');
    console.log('1. Add VITE_VIMEO_ACCESS_TOKEN=your_token_here to your .env file');
    console.log('2. Restart your development server');
    console.log('3. Get a token from: https://developer.vimeo.com/');
    return;
  }
  
  try {
    console.log('🔍 Testing Vimeo API connection...');
    
    // Test basic API access
    const response = await axios.get('https://api.vimeo.com/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.vimeo.*+json;version=3.4',
      },
    });
    
    console.log('✅ Vimeo API authentication successful');
    console.log('User:', response.data.name);
    console.log('Account type:', response.data.account);
    
    // Test video access with a sample video
    const sampleVideoId = '1048123643'; // Sample video ID
    try {
      const videoResponse = await axios.get(`https://api.vimeo.com/videos/${sampleVideoId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.vimeo.*+json;version=3.4',
        },
      });
      
      console.log('✅ Video access successful');
      console.log('Video title:', videoResponse.data.name);
      
      // Test transcript access
      try {
        const transcriptResponse = await axios.get(`https://api.vimeo.com/videos/${sampleVideoId}/texttracks`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/vnd.vimeo.*+json;version=3.4',
          },
        });
        
        console.log('✅ Transcript API access successful');
        console.log('Available transcripts:', transcriptResponse.data.total);
        
        if (transcriptResponse.data.data?.length > 0) {
          console.log('Transcript languages:', transcriptResponse.data.data.map((t: { language: string }) => t.language));
        }
        
      } catch (transcriptError: unknown) {
        console.error('❌ Transcript API access failed:', transcriptError);
        if (transcriptError && typeof transcriptError === 'object' && 'response' in transcriptError) {
          const axiosError = transcriptError as { response?: { status?: number; data?: unknown } };
          console.error('Status:', axiosError.response?.status);
          console.error('Response:', axiosError.response?.data);
        }
      }
      
    } catch (videoError: unknown) {
      console.error('❌ Video access failed:', videoError);
      if (videoError && typeof videoError === 'object' && 'response' in videoError) {
        const axiosError = videoError as { response?: { status?: number; data?: unknown } };
        console.error('Status:', axiosError.response?.status);
        console.error('Response:', axiosError.response?.data);
      }
    }
    
  } catch (error: unknown) {
    console.error('❌ Vimeo API authentication failed:', error);
    
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number; data?: unknown } };
      console.error('Status:', axiosError.response?.status);
      console.error('Response:', axiosError.response?.data);
      
      if (axiosError.response?.status === 401) {
        console.log('🔧 Possible fixes:');
        console.log('1. Check if your access token is valid');
        console.log('2. Make sure the token has not expired');
        console.log('3. Verify the token has the correct scopes');
        console.log('4. Try generating a new token from Vimeo Developer Portal');
      }
    }
  }
  
  console.log('=== End Debug ===');
};

/**
 * Test specific video transcript access with full VTT parsing
 */
export const debugVideoTranscript = async (videoUrl: string): Promise<void> => {
  console.log('=== Video Transcript Debug ===');
  console.log('Video URL:', videoUrl);
  
  const accessToken = import.meta.env.VITE_VIMEO_ACCESS_TOKEN;
  
  if (!accessToken) {
    console.error('❌ VITE_VIMEO_ACCESS_TOKEN is not set');
    return;
  }
  
  // Extract video ID
  const videoIdMatch = videoUrl.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (!videoIdMatch) {
    console.error('❌ Could not extract video ID from URL:', videoUrl);
    return;
  }
  
  const videoId = videoIdMatch[1];
  console.log('🔍 Testing video transcript access for ID:', videoId);
  
  try {
    // Test the full transcript fetching and parsing pipeline
    console.log('📥 Testing full transcript pipeline...');
    const result = await getVimeoTranscript(videoUrl);
    
    if (result.success && result.transcript) {
      console.log('✅ Full transcript pipeline successful!');
      console.log('📊 Transcript stats:');
      console.log('  - Format:', result.transcript.format);
      console.log('  - Total cues:', result.transcript.cues.length);
      console.log('  - Plain text length:', result.transcript.plainText.length);
      
      if (result.transcript.cues.length > 0) {
        console.log('📝 First few cues:');
        result.transcript.cues.slice(0, 3).forEach((cue, index) => {
          console.log(`  ${index + 1}. [${cue.start}s-${cue.end}s] ${cue.text.substring(0, 100)}...`);
        });
      }
      
      // Test search functionality
      if (result.transcript.plainText.includes('the')) {
        console.log('🔍 Testing search functionality...');
        const searchResults = result.transcript.cues.filter(cue => 
          cue.text.toLowerCase().includes('the')
        );
        console.log(`Found ${searchResults.length} cues containing "the"`);
      }
      
    } else {
      console.error('❌ Full transcript pipeline failed:', result.error);
    }
    
  } catch (error: unknown) {
    console.error('❌ Transcript pipeline error:', error);
  }
  
  // Also test the raw API access
  try {
    console.log('🔍 Testing raw API access...');
    const response = await axios.get(`https://api.vimeo.com/videos/${videoId}/texttracks`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.vimeo.*+json;version=3.4',
      },
    });
    
    console.log('✅ Raw API response:', response.data);
    
    if (response.data.data?.length > 0) {
      console.log('📝 Available transcripts:');
      response.data.data.forEach((track: { language: string; type: string; active: boolean; name: string; link: string }, index: number) => {
        console.log(`  ${index + 1}. Language: ${track.language}, Type: ${track.type}, Active: ${track.active}, Name: ${track.name}`);
        console.log(`     Link: ${track.link}`);
      });
    } else {
      console.log('❌ No transcripts available for this video');
    }
    
  } catch (error: unknown) {
    console.error('❌ Raw API access failed:', error);
    
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number; data?: unknown } };
      console.error('Status:', axiosError.response?.status);
      console.error('Response:', axiosError.response?.data);
    }
  }
  
  console.log('=== End Video Transcript Debug ===');
}; 