import React, { useState, useEffect, useMemo } from 'react';
import { getVimeoTranscript } from '../services/vimeoTranscriptApi';
import { parseTranscript, searchTranscript, formatTime, ParsedTranscript } from '../utils/transcriptParser';

interface TranscriptViewerProps {
  videoUrl: string;
  currentTime?: number;
  onTimeClick?: (time: number) => void;
  className?: string;
}

export const TranscriptViewer: React.FC<TranscriptViewerProps> = ({
  videoUrl,
  currentTime = 0,
  onTimeClick,
  className = '',
}) => {
  const [transcript, setTranscript] = useState<ParsedTranscript | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Fetch transcript when videoUrl changes
  useEffect(() => {
    const fetchTranscript = async () => {
      if (!videoUrl) return;

      setLoading(true);
      setError(null);

      try {
        const result = await getVimeoTranscript(videoUrl);
        if (result.success && result.content) {
          const parsed = parseTranscript(result.content);
          setTranscript(parsed);
        } else {
          setError(result.error || 'Failed to fetch transcript');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTranscript();
  }, [videoUrl]);

  // Search results
  const searchResults = useMemo(() => {
    if (!transcript || !searchTerm.trim()) return [];
    return searchTranscript(transcript, searchTerm);
  }, [transcript, searchTerm]);

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowSearchResults(value.length > 0);
  };

  // Handle time click
  const handleTimeClick = (time: number) => {
    if (onTimeClick) {
      onTimeClick(time);
    }
  };

  // Find current cue based on currentTime
  const currentCue = useMemo(() => {
    if (!transcript || !transcript.cues.length) return null;
    return transcript.cues.find(cue => 
      currentTime >= cue.start && currentTime <= cue.end
    );
  }, [transcript, currentTime]);

  if (loading) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading transcript...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <svg className="h-5 w-5 text-red-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="text-red-700">{error}</span>
        </div>
      </div>
    );
  }

  if (!transcript) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
        <p className="text-gray-600 text-center">No transcript available</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Transcript</h3>
        
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search transcript..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        
        {/* Search Results Count */}
        {showSearchResults && (
          <div className="mt-2 text-sm text-gray-600">
            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
          </div>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {showSearchResults && searchResults.length > 0 ? (
          // Show search results
          <div className="p-4 space-y-3">
            {searchResults.map((cue, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  currentCue && currentCue.start === cue.start
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
                onClick={() => handleTimeClick(cue.start)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-blue-600">
                    {formatTime(cue.start)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatTime(cue.end - cue.start)} duration
                  </span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {cue.text.replace(
                    new RegExp(`(${searchTerm})`, 'gi'),
                    '<mark class="bg-yellow-200 px-1 rounded">$1</mark>'
                  )}
                </p>
              </div>
            ))}
          </div>
        ) : transcript.cues.length > 0 ? (
          // Show all cues
          <div className="p-4 space-y-2">
            {transcript.cues.map((cue, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  currentCue && currentCue.start === cue.start
                    ? 'bg-blue-50 border-blue-200 border'
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
                onClick={() => handleTimeClick(cue.start)}
              >
                <div className="flex items-start space-x-3">
                  <span className="text-sm font-medium text-blue-600 mt-0.5 min-w-0 flex-shrink-0">
                    {formatTime(cue.start)}
                  </span>
                  <p className="text-sm text-gray-700 leading-relaxed flex-1">
                    {cue.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Show plain text if no cues available
          <div className="p-4">
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {transcript.plainText}
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer with format info */}
      <div className="p-3 border-t bg-gray-50 text-xs text-gray-500">
        Format: {transcript.format.toUpperCase()} | 
        {transcript.cues.length > 0 ? (
          <span> {transcript.cues.length} timed segments</span>
        ) : (
          <span> Plain text only</span>
        )}
      </div>
    </div>
  );
}; 