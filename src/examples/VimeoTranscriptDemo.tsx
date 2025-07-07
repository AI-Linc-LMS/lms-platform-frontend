import React, { useState, useRef, useEffect } from 'react';
import { useVimeoTranscript } from '../hooks/useVimeoTranscript';
import { debugVimeoAuth, debugVideoTranscript } from '../utils/vimeoDebug';
import { runAllTests, quickTest, testMultipleVideos } from '../utils/vimeoTestUtils';

interface VimeoTranscriptDemoProps {
  videoUrl: string;
}

// Helper function to format time in MM:SS format
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Helper function to process Vimeo URL for embedding
const processVimeoUrl = (url: string): string => {
  const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
  return videoId ? `https://player.vimeo.com/video/${videoId}` : url;
};

const VimeoTranscriptDemo: React.FC<VimeoTranscriptDemoProps> = ({ videoUrl }) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  const { transcript, loading, error, fetchTranscript, getCurrentCue, retry } = useVimeoTranscript({
    videoUrl,
    autoFetch: true,
  });

  // Debug functions
  const handleDebugAuth = async () => {
    console.log('Running Vimeo authentication debug...');
    await debugVimeoAuth();
  };

  const handleDebugVideo = async () => {
    console.log('Running video transcript debug...');
    await debugVideoTranscript(videoUrl);
  };

  const handleQuickTest = async () => {
    console.log('Running quick test for current video...');
    await quickTest(videoUrl);
  };

  const handleRunAllTests = async () => {
    console.log('Running comprehensive tests...');
    setIsRunningTests(true);
    try {
      await runAllTests();
    } finally {
      setIsRunningTests(false);
    }
  };

  const handleTestMultipleVideos = async () => {
    console.log('Testing multiple sample videos...');
    setIsRunningTests(true);
    try {
      await testMultipleVideos();
    } finally {
      setIsRunningTests(false);
    }
  };

  // Function to seek to a specific time in the video
  const seekToTime = (time: number) => {
    setCurrentTime(time);
    if (iframeRef.current) {
      // Send message to Vimeo player to seek to specific time
      iframeRef.current.contentWindow?.postMessage({
        method: 'setCurrentTime',
        value: time
      }, '*');
    }
  };

  // Handle time updates from Vimeo player
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://player.vimeo.com') return;
      
      if (event.data.event === 'timeupdate') {
        setCurrentTime(event.data.data.seconds);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Vimeo Transcript Demo</h1>
        <p className="text-gray-600">
          Interactive transcript viewer for Vimeo videos with search and navigation features.
        </p>
        
        {/* Debug Controls */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Debug Tools</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <button
              onClick={handleDebugAuth}
              className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
            >
              Test Vimeo Auth
            </button>
            <button
              onClick={handleDebugVideo}
              className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm"
            >
              Test Video Transcript
            </button>
            <button
              onClick={handleQuickTest}
              className="px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors text-sm"
            >
              Quick Test
            </button>
            <button
              onClick={handleTestMultipleVideos}
              disabled={isRunningTests}
              className="px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors text-sm disabled:opacity-50"
            >
              {isRunningTests ? 'Testing...' : 'Test Multiple Videos'}
            </button>
            <button
              onClick={handleRunAllTests}
              disabled={isRunningTests}
              className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm disabled:opacity-50"
            >
              {isRunningTests ? 'Running...' : 'Run All Tests'}
            </button>
          </div>
          <div className="mt-3 p-3 bg-blue-50 rounded text-sm">
            <p className="text-blue-800 font-medium mb-1">💡 Troubleshooting Guide:</p>
            <ul className="text-blue-700 space-y-1 text-xs">
              <li>• <strong>Quick Test:</strong> Test the current video URL</li>
              <li>• <strong>Test Multiple Videos:</strong> Test several sample videos to check if the issue is video-specific</li>
              <li>• <strong>Run All Tests:</strong> Comprehensive testing including network connectivity</li>
              <li>• <strong>Check browser console:</strong> All debug output is logged to the console</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-red-800 mb-1">Error Loading Transcript</h3>
              <p className="text-red-700">{error}</p>
              
              {/* Specific guidance for authentication errors */}
              {error.includes('credentials') || error.includes('8003') || error.includes('401') && (
                <div className="mt-3 p-3 bg-red-100 rounded">
                  <p className="font-medium text-red-800 mb-2">Authentication Issue Detected</p>
                  <ol className="list-decimal list-inside text-sm text-red-700 space-y-1">
                    <li>Check if <code className="bg-red-200 px-1 rounded">VITE_VIMEO_ACCESS_TOKEN</code> is set in your .env file</li>
                    <li>Verify your token is valid and not expired</li>
                    <li>Ensure your token has the required scopes: <code className="bg-red-200 px-1 rounded">video_files</code> and <code className="bg-red-200 px-1 rounded">public</code></li>
                    <li>Try the debug tools above to diagnose the issue</li>
                    <li>Generate a new token at <a href="https://developer.vimeo.com/" target="_blank" rel="noopener noreferrer" className="underline">developer.vimeo.com</a></li>
                  </ol>
                </div>
              )}
            </div>
            <button
              onClick={retry}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Video Player */}
        <div className="space-y-4">
          <div className="bg-gray-100 rounded-lg overflow-hidden">
            <iframe
              ref={iframeRef}
              src={processVimeoUrl(videoUrl)}
              className="w-full h-64 md:h-80"
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              title="Vimeo Video Player"
            />
          </div>
          
          {/* Video Info */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Video Information</h3>
            <p className="text-sm text-gray-600 mb-1">
              <span className="font-medium">URL:</span> {videoUrl}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Current Time:</span> {formatTime(currentTime)}
            </p>
          </div>
        </div>

        {/* Transcript Panel */}
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Transcript</h3>
            
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-gray-600">Loading transcript...</span>
              </div>
            )}
            
            {!loading && !error && transcript && (
              <div className="space-y-3">
                {/* Transcript Stats */}
                <div className="text-sm text-gray-600 bg-white p-2 rounded">
                  <span className="font-medium">Segments:</span> {transcript.cues.length} | 
                  <span className="font-medium ml-2">Format:</span> {transcript.format.toUpperCase()}
                </div>
                
                {/* Transcript Content */}
                <div className="max-h-96 overflow-y-auto bg-white rounded border">
                  {transcript.cues.map((cue, index) => {
                    const isActive = getCurrentCue(currentTime)?.start === cue.start;
                    return (
                      <div
                        key={index}
                        className={`p-3 border-b cursor-pointer transition-colors ${
                          isActive 
                            ? 'bg-blue-50 border-blue-200' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => seekToTime(cue.start)}
                      >
                        <div className="flex items-start space-x-3">
                          <span className="text-xs text-gray-500 font-mono mt-1 flex-shrink-0">
                            {formatTime(cue.start)}
                          </span>
                          <p className={`text-sm ${isActive ? 'font-medium text-blue-800' : 'text-gray-700'}`}>
                            {cue.text}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {!loading && !error && !transcript && (
              <div className="text-center py-8 text-gray-500">
                <p>No transcript available</p>
                <button
                  onClick={fetchTranscript}
                  className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Try Loading Transcript
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-2">How to Use</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Click on any transcript segment to jump to that time in the video</li>
          <li>• The current segment is highlighted in blue as the video plays</li>
          <li>• Use the debug tools above if you encounter authentication issues</li>
          <li>• Make sure your Vimeo access token is configured in your .env file</li>
        </ul>
      </div>
    </div>
  );
};

// Example usage component
export const VimeoTranscriptExample: React.FC = () => {
  const [videoUrl, setVideoUrl] = useState('https://vimeo.com/76979871');

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Try Your Own Vimeo Video</h2>
          <div className="flex gap-4">
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="Enter Vimeo video URL"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => setVideoUrl('https://vimeo.com/76979871')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Use Sample
            </button>
          </div>
        </div>
      </div>
      
      <VimeoTranscriptDemo videoUrl={videoUrl} />
    </div>
  );
};

export default VimeoTranscriptDemo; 