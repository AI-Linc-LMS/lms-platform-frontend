import { useState, useEffect, useCallback } from 'react';
import { getVimeoTranscript } from '../services/vimeoTranscriptApi';
import { type ParsedVTT, type VTTCue, getCurrentCue, searchTranscript } from '../utils/vttParser';

interface UseVimeoTranscriptOptions {
  videoUrl: string;
  autoFetch?: boolean;
}

interface UseVimeoTranscriptReturn {
  transcript: ParsedVTT | null;
  loading: boolean;
  error: string | null;
  fetchTranscript: () => Promise<void>;
  getCurrentCue: (time: number) => VTTCue | null;
  searchTranscript: (searchTerm: string) => VTTCue[];
  retry: () => void;
}

export const useVimeoTranscript = ({
  videoUrl,
  autoFetch = true,
}: UseVimeoTranscriptOptions): UseVimeoTranscriptReturn => {
  const [transcript, setTranscript] = useState<ParsedVTT | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTranscript = useCallback(async () => {
    if (!videoUrl) return;

    setLoading(true);
    setError(null);

    try {
      console.log('Fetching transcript for:', videoUrl);
      const result = await getVimeoTranscript(videoUrl);
      
      if (result.success && result.transcript) {
        console.log('Transcript fetched successfully:', result.transcript.cues.length, 'cues');
        setTranscript(result.transcript);
      } else {
        console.error('Failed to fetch transcript:', result.error);
        setError(result.error || 'Failed to fetch transcript');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error in fetchTranscript:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [videoUrl]);

  const getCurrentCueForTime = useCallback((time: number): VTTCue | null => {
    if (!transcript || !transcript.cues.length) return null;
    
    return getCurrentCue(transcript.cues, time);
  }, [transcript]);

  const searchTranscriptText = useCallback((searchTerm: string): VTTCue[] => {
    if (!transcript || !searchTerm.trim()) return [];
    
    return searchTranscript(transcript.cues, searchTerm);
  }, [transcript]);

  const retry = useCallback(() => {
    fetchTranscript();
  }, [fetchTranscript]);

  // Auto-fetch when videoUrl changes
  useEffect(() => {
    if (autoFetch && videoUrl) {
      fetchTranscript();
    }
  }, [videoUrl, autoFetch, fetchTranscript]);

  // Reset state when videoUrl changes
  useEffect(() => {
    setTranscript(null);
    setError(null);
  }, [videoUrl]);

  return {
    transcript,
    loading,
    error,
    fetchTranscript,
    getCurrentCue: getCurrentCueForTime,
    searchTranscript: searchTranscriptText,
    retry,
  };
}; 