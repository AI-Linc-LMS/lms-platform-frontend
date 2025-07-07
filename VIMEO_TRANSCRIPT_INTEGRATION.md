# Vimeo Transcript Integration Guide

This guide explains how to use the new Vimeo transcript functionality that has been implemented in your LMS platform.

## Overview

The Vimeo transcript integration allows you to:
- Fetch transcript files from Vimeo videos
- Display interactive transcripts alongside videos
- Search through transcript content
- Navigate video playback by clicking on transcript segments
- Support both VTT and SRT transcript formats

## Setup

### 1. Environment Configuration

Add your Vimeo access token to your environment variables:

```bash
# .env
VITE_VIMEO_ACCESS_TOKEN=your_vimeo_access_token_here
```

To get a Vimeo access token:
1. Go to [Vimeo Developer Portal](https://developer.vimeo.com/)
2. Create a new app
3. Generate a personal access token with appropriate scopes
4. Add the token to your environment variables

### 2. Required Permissions

Your Vimeo access token needs the following scopes:
- `video_files` - to access video metadata
- `public` - to access public video content

## Components

### `TranscriptViewer`

The main component for displaying transcripts.

```tsx
import { TranscriptViewer } from '../components/TranscriptViewer';

<TranscriptViewer
  videoUrl="https://vimeo.com/123456789"
  currentTime={currentTimeInSeconds}
  onTimeClick={(time) => seekToTime(time)}
  className="custom-styling"
/>
```

**Props:**
- `videoUrl` (string): The Vimeo video URL
- `currentTime` (number, optional): Current playback time in seconds
- `onTimeClick` (function, optional): Callback when user clicks on a transcript segment
- `className` (string, optional): Additional CSS classes

### `useVimeoTranscript` Hook

A custom hook for managing transcript data.

```tsx
import { useVimeoTranscript } from '../hooks/useVimeoTranscript';

const { transcript, loading, error, fetchTranscript, getCurrentCue } = useVimeoTranscript({
  videoUrl: 'https://vimeo.com/123456789',
  autoFetch: true,
});
```

**Options:**
- `videoUrl` (string): The Vimeo video URL
- `autoFetch` (boolean, optional): Whether to automatically fetch the transcript

**Returns:**
- `transcript`: Parsed transcript data
- `loading`: Loading state
- `error`: Error message if any
- `fetchTranscript`: Function to manually fetch transcript
- `getCurrentCue`: Function to get current transcript segment
- `searchTranscript`: Function to search transcript content
- `retry`: Function to retry failed requests

## API Services

### `getVimeoTranscript`

Fetches transcript data from Vimeo API.

```typescript
import { getVimeoTranscript } from '../services/vimeoTranscriptApi';

const result = await getVimeoTranscript('https://vimeo.com/123456789');
if (result.success) {
  console.log(result.content); // Raw transcript content
  console.log(result.language); // Transcript language
  console.log(result.type); // Transcript type (subtitles, captions, etc.)
}
```

### `parseTranscript`

Parses raw transcript content into structured data.

```typescript
import { parseTranscript } from '../utils/transcriptParser';

const parsed = parseTranscript(rawTranscriptContent);
console.log(parsed.cues); // Array of timed transcript segments
console.log(parsed.plainText); // Plain text version
console.log(parsed.format); // Detected format (vtt, srt, unknown)
```

## Integration Examples

### Basic Integration

```tsx
import React, { useState } from 'react';
import { TranscriptViewer } from '../components/TranscriptViewer';

const VideoWithTranscript = ({ videoUrl }) => {
  const [currentTime, setCurrentTime] = useState(0);
  
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        {/* Your video player */}
        <VideoPlayer 
          videoUrl={videoUrl}
          onTimeUpdate={setCurrentTime}
        />
      </div>
      <div>
        <TranscriptViewer
          videoUrl={videoUrl}
          currentTime={currentTime}
          onTimeClick={(time) => seekToTime(time)}
        />
      </div>
    </div>
  );
};
```

### Advanced Integration with Search

```tsx
import React, { useState } from 'react';
import { useVimeoTranscript } from '../hooks/useVimeoTranscript';

const AdvancedTranscriptViewer = ({ videoUrl }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { transcript, loading, error, searchTranscript } = useVimeoTranscript({
    videoUrl,
    autoFetch: true,
  });
  
  const searchResults = searchTranscript(searchTerm);
  
  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Search transcript..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full p-2 border rounded"
      />
      
      {loading && <p>Loading transcript...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      
      {searchResults.length > 0 && (
        <div className="space-y-2">
          {searchResults.map((cue, index) => (
            <div key={index} className="p-2 bg-gray-100 rounded">
              <p className="font-medium">{formatTime(cue.start)}</p>
              <p>{cue.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

## Demo Component

Check out the complete demo implementation in `src/examples/VimeoTranscriptDemo.tsx`:

```tsx
import { VimeoTranscriptExample } from '../examples/VimeoTranscriptDemo';

// Use this component to test the functionality
<VimeoTranscriptExample />
```

## Error Handling

The system handles various error scenarios:

1. **Missing API Token**: Returns error if `VITE_VIMEO_ACCESS_TOKEN` is not configured
2. **Invalid Video URL**: Returns error if video ID cannot be extracted
3. **No Transcript Available**: Returns error if video has no transcript tracks
4. **Network Errors**: Returns error with network failure details
5. **CORS Issues**: May fail due to Vimeo's CORS policies

## Troubleshooting

### Common Issues

1. **"Vimeo access token is not configured"**
   - Make sure `VITE_VIMEO_ACCESS_TOKEN` is set in your `.env` file
   - Restart your development server after adding the token

2. **"No transcripts available for this video"**
   - The video may not have any transcript tracks
   - Check if the video has captions/subtitles enabled on Vimeo

3. **CORS errors**
   - Some Vimeo videos may have CORS restrictions
   - This is a limitation of frontend-only approaches

4. **Invalid video URL**
   - Ensure the URL is a valid Vimeo video URL
   - Supported formats: `https://vimeo.com/123456789`, `https://player.vimeo.com/video/123456789`

### Testing

To test the functionality:

1. Use the demo component: `<VimeoTranscriptExample />`
2. Try with a known video that has transcripts
3. Check browser console for detailed error messages
4. Use browser network tab to debug API calls

## Performance Considerations

- Transcripts are cached after first load
- Large transcript files may take time to process
- Search functionality is optimized for real-time use
- Consider implementing pagination for very long transcripts

## Future Enhancements

Potential improvements you could add:
- Automatic transcript generation for videos without transcripts
- Multiple language support
- Transcript editing capabilities
- Integration with video analytics
- Keyboard shortcuts for transcript navigation
- Export transcript functionality

## Support

For issues or questions about the Vimeo transcript integration:
1. Check the browser console for detailed error messages
2. Verify your Vimeo API token has the correct permissions
3. Test with different video URLs to isolate the issue
4. Review the component props and hook options documentation above 