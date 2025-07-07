// Types for transcript parsing
export interface TranscriptCue {
  start: number;
  end: number;
  text: string;
  id?: string;
}

export interface ParsedTranscript {
  cues: TranscriptCue[];
  plainText: string;
  format: 'vtt' | 'srt' | 'unknown';
}

/**
 * Convert time string to seconds
 * Handles formats like "00:01:30.500" or "00:01:30,500"
 */
export const timeToSeconds = (timeStr: string): number => {
  // Remove any extra whitespace
  timeStr = timeStr.trim();
  
  // Replace comma with dot for milliseconds (SRT format)
  timeStr = timeStr.replace(',', '.');
  
  // Split by colon to get hours, minutes, seconds
  const parts = timeStr.split(':');
  
  if (parts.length === 3) {
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseFloat(parts[2]);
    
    return hours * 3600 + minutes * 60 + seconds;
  } else if (parts.length === 2) {
    const minutes = parseInt(parts[0], 10);
    const seconds = parseFloat(parts[1]);
    
    return minutes * 60 + seconds;
  } else {
    return parseFloat(timeStr);
  }
};

/**
 * Parse VTT (WebVTT) format transcript
 */
export const parseVTT = (vttContent: string): ParsedTranscript => {
  const lines = vttContent.split('\n');
  const cues: TranscriptCue[] = [];
  const plainTextLines: string[] = [];
  
  let i = 0;
  
  // Skip the WEBVTT header
  while (i < lines.length && !lines[i].includes('-->')) {
    i++;
  }
  
  while (i < lines.length) {
    const line = lines[i].trim();
    
    // Look for time range line (e.g., "00:00:01.000 --> 00:00:04.000")
    if (line.includes('-->')) {
      const [startTime, endTime] = line.split('-->').map(t => t.trim());
      
      // Get the text content (next non-empty lines until empty line or end)
      const textLines: string[] = [];
      i++;
      
      while (i < lines.length && lines[i].trim() !== '') {
        const textLine = lines[i].trim();
        if (textLine) {
          textLines.push(textLine);
        }
        i++;
      }
      
      if (textLines.length > 0) {
        const text = textLines.join(' ').replace(/<[^>]*>/g, ''); // Remove HTML tags
        
        cues.push({
          start: timeToSeconds(startTime),
          end: timeToSeconds(endTime),
          text: text,
        });
        
        plainTextLines.push(text);
      }
    }
    
    i++;
  }
  
  return {
    cues,
    plainText: plainTextLines.join(' '),
    format: 'vtt',
  };
};

/**
 * Parse SRT format transcript
 */
export const parseSRT = (srtContent: string): ParsedTranscript => {
  const lines = srtContent.split('\n');
  const cues: TranscriptCue[] = [];
  const plainTextLines: string[] = [];
  
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i].trim();
    
    // Look for sequence number (SRT format starts with number)
    if (line && /^\d+$/.test(line)) {
      const sequenceNumber = line;
      i++;
      
      // Next line should be the time range
      if (i < lines.length && lines[i].includes('-->')) {
        const [startTime, endTime] = lines[i].split('-->').map(t => t.trim());
        i++;
        
        // Get the text content (next non-empty lines until empty line or end)
        const textLines: string[] = [];
        
        while (i < lines.length && lines[i].trim() !== '') {
          const textLine = lines[i].trim();
          if (textLine) {
            textLines.push(textLine);
          }
          i++;
        }
        
        if (textLines.length > 0) {
          const text = textLines.join(' ').replace(/<[^>]*>/g, ''); // Remove HTML tags
          
          cues.push({
            start: timeToSeconds(startTime),
            end: timeToSeconds(endTime),
            text: text,
            id: sequenceNumber,
          });
          
          plainTextLines.push(text);
        }
      }
    }
    
    i++;
  }
  
  return {
    cues,
    plainText: plainTextLines.join(' '),
    format: 'srt',
  };
};

/**
 * Auto-detect and parse transcript format
 */
export const parseTranscript = (content: string): ParsedTranscript => {
  if (!content || content.trim().length === 0) {
    return {
      cues: [],
      plainText: '',
      format: 'unknown',
    };
  }
  
  // Clean up the content
  const cleanContent = content.trim();
  
  // Check if it's VTT format
  if (cleanContent.startsWith('WEBVTT') || cleanContent.includes('-->') && cleanContent.includes('.')) {
    return parseVTT(cleanContent);
  }
  
  // Check if it's SRT format (starts with number, has --> with comma for milliseconds)
  if (/^\d+\s*\n/.test(cleanContent) && cleanContent.includes('-->')) {
    return parseSRT(cleanContent);
  }
  
  // If format is unknown, try to extract as plain text
  const lines = cleanContent.split('\n');
  const textLines = lines
    .filter(line => {
      const trimmed = line.trim();
      return trimmed && 
             !trimmed.startsWith('WEBVTT') && 
             !trimmed.includes('-->') && 
             !/^\d+$/.test(trimmed);
    })
    .map(line => line.trim().replace(/<[^>]*>/g, ''));
  
  return {
    cues: [],
    plainText: textLines.join(' '),
    format: 'unknown',
  };
};

/**
 * Search for text in transcript cues
 */
export const searchTranscript = (
  transcript: ParsedTranscript, 
  searchTerm: string
): TranscriptCue[] => {
  if (!searchTerm || searchTerm.trim().length === 0) {
    return [];
  }
  
  const term = searchTerm.toLowerCase();
  
  return transcript.cues.filter(cue => 
    cue.text.toLowerCase().includes(term)
  );
};

/**
 * Get transcript text at specific time
 */
export const getTranscriptAtTime = (
  transcript: ParsedTranscript, 
  timeInSeconds: number
): TranscriptCue | null => {
  return transcript.cues.find(cue => 
    timeInSeconds >= cue.start && timeInSeconds <= cue.end
  ) || null;
};

/**
 * Format seconds to readable time string
 */
export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}; 