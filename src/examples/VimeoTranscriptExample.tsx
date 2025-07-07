import React, { useState } from 'react';
import VimeoTranscriptDemo from './VimeoTranscriptDemo';

const VimeoTranscriptExample: React.FC = () => {
  const [videoUrl, setVideoUrl] = useState('https://vimeo.com/76979871');
  const [currentUrl, setCurrentUrl] = useState('https://vimeo.com/76979871');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentUrl(videoUrl);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Vimeo Transcript Integration Example</h1>
          
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  Vimeo Video URL
                </label>
                <input
                  type="url"
                  id="videoUrl"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://vimeo.com/..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  Load Video
                </button>
              </div>
            </div>
          </form>

          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>Sample URLs to try:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>https://vimeo.com/76979871 (Default - Big Buck Bunny)</li>
              <li>https://vimeo.com/59777392 (Another sample video)</li>
            </ul>
            <p className="mt-4">
              <strong>Note:</strong> You need a valid Vimeo access token in your <code className="bg-gray-100 px-1 rounded">VITE_VIMEO_ACCESS_TOKEN</code> environment variable.
            </p>
          </div>
        </div>

        <VimeoTranscriptDemo videoUrl={currentUrl} />
      </div>
    </div>
  );
};

export default VimeoTranscriptExample; 