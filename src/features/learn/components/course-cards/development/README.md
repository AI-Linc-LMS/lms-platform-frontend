# Development Environment for LMS Platform

## Overview
This directory contains two implementations of the code editor for the Development tab in the LMS platform:

1. `DevelopmentCard.tsx` - Using Monaco Editor
2. `CodeMirrorDevelopmentCard.tsx` - Using CodeMirror (recommended)

Both implementations provide similar functionality, but the CodeMirror version offers better performance and simplicity.

## Features

- Tabbed editor for HTML, CSS, and JavaScript
- Live preview in an embedded iframe
- Preview in a new tab option
- Light/Dark theme toggle
- Code hints for assignments
- Error handling
- Keyboard shortcuts (Ctrl+S to submit, Ctrl+P to preview)
- Responsive design

## Usage

The CourseTopicDetailPage component uses the CodeMirrorDevelopmentCard by default. If you prefer to use the Monaco Editor implementation, you can import and use DevelopmentCard instead.

## Dependencies

### Monaco Editor Implementation
- @monaco-editor/react

### CodeMirror Implementation
- @uiw/react-codemirror
- @codemirror/lang-html
- @codemirror/lang-css
- @codemirror/lang-javascript
- @codemirror/theme-one-dark

## Troubleshooting

If you encounter issues with the editor:

1. Make sure all dependencies are installed
2. Check for console errors in the browser
3. Try clearing the browser cache
4. If using the monaco editor and experiencing performance issues, try switching to the CodeMirror implementation

## Contributing

When making changes to the editor, make sure to test across different browsers and screen sizes. 