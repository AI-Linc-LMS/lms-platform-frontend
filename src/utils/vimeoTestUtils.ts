import { getVimeoTranscript } from '../services/vimeoTranscriptApi';

/**
 * Test videos with known transcript availability
 */
export const testVideos = [
  {
    url: 'https://vimeo.com/76979871',
    description: 'Sample video 1 - often has transcripts',
    expected: true,
  },
  {
    url: 'https://vimeo.com/148751763',
    description: 'Sample video 2 - TED talk style',
    expected: true,
  },
  {
    url: 'https://vimeo.com/90509568',
    description: 'Sample video 3 - creative commons',
    expected: true,
  },
];

interface TestResult {
  url: string;
  description: string;
  expected: boolean;
  status: 'success' | 'failed' | 'error';
  cues?: number;
  format?: string;
  error?: string;
}

/**
 * Test transcript availability for multiple videos
 */
export const testMultipleVideos = async (): Promise<TestResult[]> => {
  console.log('🧪 Testing transcript availability for multiple videos...');
  
  const results: TestResult[] = [];
  
  for (const video of testVideos) {
    console.log(`\n📹 Testing: ${video.description}`);
    console.log(`🔗 URL: ${video.url}`);
    
    try {
      const result = await getVimeoTranscript(video.url);
      
      if (result.success && result.transcript) {
        console.log('✅ SUCCESS:', {
          cues: result.transcript.cues.length,
          format: result.transcript.format,
          plainTextLength: result.transcript.plainText.length,
        });
        
        results.push({
          ...video,
          status: 'success',
          cues: result.transcript.cues.length,
          format: result.transcript.format,
        });
      } else {
        console.log('❌ FAILED:', result.error);
        results.push({
          ...video,
          status: 'failed',
          error: result.error,
        });
      }
    } catch (error) {
      console.log('💥 ERROR:', error instanceof Error ? error.message : 'Unknown error');
      results.push({
        ...video,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    
    // Add a small delay between requests to be respectful
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 TEST RESULTS SUMMARY:');
  console.log('========================');
  
  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.description}`);
    console.log(`   Status: ${result.status.toUpperCase()}`);
    
    if (result.status === 'success' && result.cues && result.format) {
      console.log(`   Cues: ${result.cues}`);
      console.log(`   Format: ${result.format}`);
    } else if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  const successCount = results.filter(r => r.status === 'success').length;
  const failureCount = results.length - successCount;
  
  console.log(`\n📈 Overall Results: ${successCount}/${results.length} successful`);
  
  if (failureCount > 0) {
    console.log('\n💡 Troubleshooting Tips:');
    console.log('- Check your VITE_VIMEO_ACCESS_TOKEN in .env file');
    console.log('- Verify your token has the required scopes');
    console.log('- Try testing with a different network connection');
    console.log('- Some videos may not have publicly accessible transcripts');
  }
  
  return results;
};

/**
 * Quick test for a single video
 */
export const quickTest = async (videoUrl: string) => {
  console.log('🚀 Quick test for:', videoUrl);
  
  try {
    const result = await getVimeoTranscript(videoUrl);
    
    if (result.success && result.transcript) {
      console.log('✅ SUCCESS! Transcript loaded successfully');
      console.log('📊 Stats:', {
        cues: result.transcript.cues.length,
        format: result.transcript.format,
        sampleText: result.transcript.cues[0]?.text?.substring(0, 100) + '...',
      });
      
      return {
        success: true,
        transcript: result.transcript,
      };
    } else {
      console.log('❌ FAILED:', result.error);
      return {
        success: false,
        error: result.error,
      };
    }
  } catch (error) {
    console.log('💥 ERROR:', error instanceof Error ? error.message : 'Unknown error');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

interface NetworkTestResult {
  url: string;
  status: 'accessible' | 'not accessible';
  error?: string;
}

/**
 * Test network connectivity and basic API access
 */
export const testNetworkConnectivity = async (): Promise<NetworkTestResult[]> => {
  console.log('🌐 Testing network connectivity...');
  
  const testUrls = [
    'https://api.vimeo.com',
    'https://cors-anywhere.herokuapp.com',
    'https://api.allorigins.win',
    'https://corsproxy.io',
  ];
  
  const results: NetworkTestResult[] = [];
  
  for (const url of testUrls) {
    try {
      await fetch(url, {
        method: 'HEAD',
        mode: 'no-cors',
      });
      
      console.log(`✅ ${url} - Accessible`);
      results.push({ url, status: 'accessible' });
    } catch (error) {
      console.log(`❌ ${url} - Not accessible:`, error instanceof Error ? error.message : 'Unknown error');
      results.push({ 
        url, 
        status: 'not accessible',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  
  return results;
};

/**
 * Run all tests
 */
export const runAllTests = async () => {
  console.log('🧪 Running comprehensive Vimeo transcript tests...');
  
  console.log('\n1. Testing network connectivity...');
  const networkResults = await testNetworkConnectivity();
  
  console.log('\n2. Testing multiple videos...');
  const videoResults = await testMultipleVideos();
  
  return {
    network: networkResults,
    videos: videoResults,
  };
}; 