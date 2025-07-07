/**
 * VTT Parser - Parses WebVTT transcript files to structured data
 */

export interface VTTCue {
  id?: string;
  start: number;
  end: number;
  text: string;
  settings?: string;
}

export interface ParsedVTT {
  cues: VTTCue[];
  format: string;
  plainText: string;
}

/**
 * Parse time string (HH:MM:SS.mmm or MM:SS.mmm) to seconds
 */
export const parseTimeToSeconds = (timeString: string): number => {
  const parts = timeString.split(':');
  let seconds = 0;
  
  if (parts.length === 3) {
    // HH:MM:SS.mmm format
    seconds += parseInt(parts[0]) * 3600; // hours
    seconds += parseInt(parts[1]) * 60;   // minutes
    seconds += parseFloat(parts[2]);      // seconds
  } else if (parts.length === 2) {
    // MM:SS.mmm format
    seconds += parseInt(parts[0]) * 60;   // minutes
    seconds += parseFloat(parts[1]);      // seconds
  } else {
    // SS.mmm format
    seconds += parseFloat(parts[0]);      // seconds
  }
  
  return seconds;
};

/**
 * Format seconds to time string (MM:SS)
 */
export const formatSecondsToTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Clean VTT text by removing HTML tags and formatting
 */
export const cleanVTTText = (text: string): string => {
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&lt;/g, '<')   // Decode HTML entities
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')    // Normalize whitespace
    .trim();
};

/**
 * Parse WebVTT content to structured data
 */
export const parseVTT = (vttContent: string): ParsedVTT => {
  const lines = vttContent.split('\n').map(line => line.trim());
  const cues: VTTCue[] = [];
  let currentCue: Partial<VTTCue> = {};
  let isReadingCue = false;
  let cueTextLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip empty lines and WEBVTT header
    if (!line || line.startsWith('WEBVTT') || line.startsWith('NOTE')) {
      continue;
    }
    
    // Check if this is a timestamp line (contains -->)
    if (line.includes('-->')) {
      // Save previous cue if exists
      if (isReadingCue && currentCue.start !== undefined) {
        cues.push({
          id: currentCue.id,
          start: currentCue.start,
          end: currentCue.end || 0,
          text: cleanVTTText(cueTextLines.join(' ')),
          settings: currentCue.settings
        });
      }
      
      // Parse new cue timing
      const [startTime, endAndSettings] = line.split('-->').map(s => s.trim());
      const [endTime, ...settings] = endAndSettings.split(' ');
      
      currentCue = {
        start: parseTimeToSeconds(startTime),
        end: parseTimeToSeconds(endTime),
        settings: settings.join(' ') || undefined
      };
      
      cueTextLines = [];
      isReadingCue = true;
    } else if (isReadingCue) {
      // This is cue text
      if (line) {
        cueTextLines.push(line);
      }
    } else {
      // This might be a cue ID (line before timestamp)
      if (line && !line.includes('-->')) {
        currentCue.id = line;
      }
    }
  }
  
  // Add the last cue
  if (isReadingCue && currentCue.start !== undefined) {
    cues.push({
      id: currentCue.id,
      start: currentCue.start,
      end: currentCue.end || 0,
      text: cleanVTTText(cueTextLines.join(' ')),
      settings: currentCue.settings
    });
  }
  
  // Generate plain text
  const plainText = cues.map(cue => cue.text).join(' ');
  
  return {
    cues,
    format: 'vtt',
    plainText
  };
};

/**
 * Search through transcript cues
 */
export const searchTranscript = (cues: VTTCue[], query: string): VTTCue[] => {
  const searchTerm = query.toLowerCase();
  return cues.filter(cue => 
    cue.text.toLowerCase().includes(searchTerm)
  );
};

/**
 * Get current cue based on time
 */
export const getCurrentCue = (cues: VTTCue[], currentTime: number): VTTCue | null => {
  return cues.find(cue => 
    currentTime >= cue.start && currentTime <= cue.end
  ) || null;
};

/**
 * Convert VTT to HTML for display
 */
export const vttToHTML = (cues: VTTCue[], currentTime: number = 0): string => {
  const currentCue = getCurrentCue(cues, currentTime);
  
  return cues.map(cue => {
    const isActive = currentCue?.start === cue.start;
    const timeStr = formatSecondsToTime(cue.start);
    
    return `
      <div class="transcript-cue ${isActive ? 'active' : ''}" data-start="${cue.start}" data-end="${cue.end}">
        <span class="timestamp">${timeStr}</span>
        <span class="text">${cue.text}</span>
      </div>
    `;
  }).join('');
}; 