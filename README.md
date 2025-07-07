# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```

# Video Player Component Documentation

## Overview

The VideoPlayer component is a feature-rich, custom video player implementation that supports both standard HTML5 video and Vimeo videos. It includes advanced features like progress tracking, first-time viewing restrictions, and seamless progress saving that persists across sessions, even after logout and login.

## Key Features

- **Multi-format support**: Works with both standard videos (MP4, WebM) and Vimeo embeds
- **Persistent progress tracking**: Automatically saves and restores viewing progress
- **First-time viewing protection**: Prevents users from skipping ahead on first watch
- **Responsive design**: Adapts to different screen sizes with multiple size options
- **Continue watching prompts**: Offers users the option to resume from where they left off
- **Completion tracking**: Marks videos as complete when a threshold percentage is viewed
- **Accessibility features**: Keyboard controls and visual indicators

## Implementation Files

The VideoPlayer is implemented across several files:

- `src/features/learn/components/video-player/VideoPlayer.tsx` - Main component
- `src/features/learn/components/video-player/components/StandardPlayer.tsx` - HTML5 video player
- `src/features/learn/components/video-player/components/VimeoPlayer.tsx` - Vimeo embed player
- `src/features/learn/components/video-player/types.ts` - TypeScript types
- `src/features/learn/components/video-player/utils/formatters.ts` - Utility functions

## How to Use the VideoPlayer

### Basic Usage

```jsx
import VideoPlayer from 'src/features/learn/components/video-player/VideoPlayer';

function CourseLecture() {
  return (
    <VideoPlayer
      videoUrl="https://example.com/video.mp4"
      title="Introduction to React"
      videoId="lecture-1"
      isFirstWatch={true}
    />
  );
}
```

### Required Props

| Prop | Type | Description |
|------|------|-------------|
| `videoUrl` | string | URL of the video file or Vimeo video |
| `title` | string | Title of the video |
| `videoId` | string | Unique identifier for the video |

### Optional Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isFirstWatch` | boolean | false | Whether this is the user's first time watching |
| `activityCompletionThreshold` | number | 95 | Percentage required to mark as complete |
| `onComplete` | function | - | Callback when video reaches completion threshold |
| `onProgressUpdate` | function | - | Callback that receives progress percentage |
| `onSaveProgress` | function | - | Callback to handle server-side progress saving |

## Progress Tracking System

The VideoPlayer implements a robust progress tracking system that:

1. **Saves progress locally** using localStorage with versioned keys
2. **Can sync with server** through the optional `onSaveProgress` callback
3. **Persists across sessions** including after logout/login
4. **Generates reliable video fingerprints** to ensure correct progress association
5. **Saves progress at optimal times**:
   - Every 5 seconds during playback
   - When component unmounts (page navigation/refresh)
   - When significant progress is made

### Progress Storage Format

Progress is stored in localStorage using the following key format:
```
video_progress_v1_[videoFingerprint]
```

The videoFingerprint combines the provided videoId with URL components to ensure reliable identification across sessions.

## First-Time Viewing Restrictions

For videos marked with `isFirstWatch={true}`, the player:

1. Disables seeking ahead of the furthest watched position
2. Shows visual indicators to communicate the restriction
3. Reverts seek attempts back to the last legitimate position
4. Still allows returning to earlier parts of the video

This ensures that first-time viewers watch content in sequence.

## Integration with Backend

To integrate with a backend for server-side progress saving:

```jsx
function CourseVideo() {
  const saveProgressToServer = async (videoId, progress) => {
    try {
      await fetch('/api/video-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, progress })
      });
    } catch (error) {
      //console.error('Failed to save progress:', error);
    }
  };

  return (
    <VideoPlayer
      videoUrl="https://example.com/video.mp4"
      videoId="course-123-lecture-1"
      title="React Fundamentals"
      onSaveProgress={saveProgressToServer}
    />
  );
}
```

## Performance Considerations

The VideoPlayer is designed to be highly scalable:

- Progress saving is throttled to minimize localStorage writes
- All operations are client-side, with no load on the server unless `onSaveProgress` is implemented
- Storage usage is minimal (a few bytes per video)
- The component efficiently handles hundreds of videos per user

## Browser Compatibility

The VideoPlayer is compatible with all modern browsers:
- Chrome, Firefox, Safari, Edge (latest versions)
- Mobile browsers on iOS and Android

## Technical Implementation Details

### Progress Saving Algorithm

1. The player generates a unique fingerprint for each video that combines:
   - The provided videoId
   - Unique parts of the video URL
   
2. Progress is saved to localStorage:
   - At regular intervals (every 5 seconds)
   - When the component unmounts
   - When the user reaches significant progress points

3. On return to the video:
   - The fingerprint is regenerated and used to find saved progress
   - If progress is found, user is prompted to continue (if significant progress exists)
   - The video is positioned at the saved timestamp

### Error Handling

The implementation includes robust error handling:
- Safe localStorage access with try/catch blocks
- Fallbacks for when fingerprinting fails
- Timeout mechanisms to prevent blocking UI
- Multiple attempts to apply progress if initial attempt fails

## Troubleshooting

### Common Issues

**Progress not saving:**
- Ensure `videoId` prop is unique and consistent for each video
- Check if localStorage is available (private browsing can block it)
- Verify the video URL is accessible

**Progress applies to wrong video:**
- Ensure each video has a unique `videoId`
- Check for duplicated videoId values across different videos

**First-time restrictions not working:**
- Confirm `isFirstWatch` prop is correctly set to `true`

# Frontend Development Best Practices & Git Workflow

## 1. Coding Best Practices

### Project Structure
- Follow consistent folder and file naming conventions (e.g., `camelCase`, `kebab-case`).
- Keep components modular and reusable.
- Group related files together (e.g., component + styles + tests).
- Organize your project into a clear hierarchy:
  - `src/` - Main source folder
    - `components/` - Reusable components that can be shared across different parts of the application.
    - `pages/` - Page components for routing, where each file corresponds to a route in the application.
    - `features/` - Feature-specific components and logic, organized by domain or functionality.
    - `styles/` - Global styles and theme files, including CSS or styled-components.
    - `hooks/` - Custom hooks that encapsulate reusable logic.
    - `utils/` - Utility functions that can be used throughout the application.
    - `assets/` - Images, fonts, and other static assets that are used in the application.
- Example folder structure:
  ```
  src/
  ├── components/
  ├── pages/
  ├── features/
  ├── styles/
  ├── hooks/
  ├── utils/
  └── assets/
  ```

### Code Style
- Use team-preferred linting tools (e.g., ESLint, Prettier).
- Write meaningful variable, function, and component names.
- Avoid commented-out or unused code in commits.
- Keep functions small, testable, and focused.

### React/Next.js Best Practices
- Use functional components and React Hooks.
- Avoid prop drilling – use Context or Redux if needed.
- Use `useEffect` carefully to avoid infinite loops or unnecessary re-renders.
- Use lazy loading (`next/dynamic`) where necessary.

### Performance & Accessibility
- Use semantic HTML elements.
- Ensure color contrast, keyboard navigation, and alt texts for images.
- Optimize images and use `next/image`.
- Use memoization (`React.memo`, `useMemo`, `useCallback`) when necessary.

---

## 2. Git Workflow Guidelines

### Branching Strategy
- Never push directly to `main`.
- Create a new branch from `main`:
  ```bash
  git checkout main
  git pull origin main
  git checkout -b feature/your-feature-name
  ```

#### Branch Naming Conventions
- `feature/feature-name`
- `bugfix/bug-description`
- `hotfix/urgent-fix`
- `refactor/code-improvement`

### Commit Message Guidelines

Use the format:```
<type>: <short description>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Styling only
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Miscellaneous tasks

**Examples:**
```bash
feat: implement course listing page
fix: resolve image alignment issue on mobile
```

### Pushing Code
```bash
git add .
git commit -m "feat: implement signup form"
git push origin feature/signup-form
```

---

## 3. Creating & Merging Pull Requests

- Create PRs to `main` or `develop`.
- Add a descriptive title and description.
- Request a peer review.
- Address review comments.
- Use **Squash & Merge** strategy to maintain clean history.
- Delete feature branch after merge.

---

## 4. General Tips

- Always `git pull` before creating a new branch.
- Regularly sync your branch with `main`.
- Use `.env.example` for shared environment variables.
- Document any new modules/components in `README.md`.

---

## 5. Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [React Docs](https://react.dev/)
- [Next.js Docs](https://nextjs.org/docs)

