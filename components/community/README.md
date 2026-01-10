# Community Forum

A Stack Overflow-style community forum for learners to ask questions, share knowledge, and engage in discussions.

## Features

✅ **Thread Management**
- Create new discussion threads with title, body, and tags
- View all threads with sorting (Recent/Popular) and filtering
- Search threads by title or content
- Filter threads by tags
- Vote on threads (upvote/downvote)
- Bookmark threads

✅ **Comment System**
- Add comments/answers to threads
- Reply to comments (nested up to 3 levels)
- Vote on comments (upvote/downvote)
- View comment thread with full nesting

✅ **User Interface**
- Clean, modern UI inspired by Stack Overflow
- Real-time vote counts
- Author badges and profiles
- Tag-based organization
- Responsive design

## File Structure

```
components/community/
├── VoteButtons.tsx           # Reusable upvote/downvote component
├── ThreadCard.tsx            # Thread list item component
├── CreateThreadDialog.tsx    # Dialog for creating new threads
├── CommentItem.tsx           # Comment/reply component with nesting
└── README.md                 # This file

app/community/
├── page.tsx                  # Thread list page
└── [threadId]/
    └── page.tsx             # Thread detail page with comments

lib/services/
└── community.service.ts      # API service for community endpoints

lib/utils/
└── date-utils.ts            # Date formatting utilities
```

## Usage

### Basic Thread List

```tsx
import { CommunityPage } from "@/app/community/page";

// Navigate to /community to see all threads
```

### Thread Detail with Comments

```tsx
// Navigate to /community/[threadId] to see thread details
// Example: /community/123
```

### Creating a New Thread

```tsx
import { CreateThreadDialog } from "@/components/community/CreateThreadDialog";

<CreateThreadDialog
  open={open}
  onClose={() => setOpen(false)}
  onSubmit={async (data) => {
    await communityService.createThread(data);
  }}
  availableTags={tags}
/>
```

### Vote Buttons

```tsx
import { VoteButtons } from "@/components/community/VoteButtons";

<VoteButtons
  upvotes={10}
  downvotes={2}
  onVote={async (type) => {
    await communityService.voteThread(threadId, type);
  }}
  size="medium"
  orientation="vertical"
/>
```

## API Integration

The community forum uses the following API endpoints:

### Thread Endpoints

- `GET /community-forum/api/clients/{clientId}/threads/` - List all threads
- `POST /community-forum/api/clients/{clientId}/threads/` - Create thread
- `GET /community-forum/api/clients/{clientId}/threads/{threadId}/` - Get thread detail
- `PUT /community-forum/api/clients/{clientId}/threads/{threadId}/` - Update thread
- `DELETE /community-forum/api/clients/{clientId}/threads/{threadId}/` - Delete thread

### Comment Endpoints

- `GET /community-forum/api/clients/{clientId}/threads/{threadId}/comments/` - List comments
- `POST /community-forum/api/clients/{clientId}/threads/{threadId}/comments/` - Create comment
- `PUT /community-forum/api/clients/{clientId}/threads/{threadId}/comments/{commentId}/` - Update comment
- `DELETE /community-forum/api/clients/{clientId}/threads/{threadId}/comments/{commentId}/` - Delete comment

### Voting Endpoints

- `POST /community-forum/api/clients/{clientId}/threads/{threadId}/vote/` - Vote on thread
- `POST /community-forum/api/clients/{clientId}/threads/{threadId}/comments/{commentId}/vote/` - Vote on comment

### Bookmark Endpoints

- `POST /community-forum/api/clients/{clientId}/threads/{threadId}/bookmark/` - Bookmark thread

### Tag Endpoints

- `GET /community-forum/api/clients/{clientId}/tags/` - List all tags

## Components

### VoteButtons

Reusable component for upvote/downvote functionality.

**Props:**
- `upvotes: number` - Current upvote count
- `downvotes: number` - Current downvote count
- `onVote: (type: "upvote" | "downvote") => Promise<void>` - Vote handler
- `size?: "small" | "medium"` - Button size
- `orientation?: "vertical" | "horizontal"` - Layout orientation

### ThreadCard

Displays a thread summary in the list view.

**Props:**
- `thread: Thread` - Thread data
- `onVote: (threadId: number, type: "upvote" | "downvote") => Promise<void>` - Vote handler
- `onBookmark?: (threadId: number) => Promise<void>` - Bookmark handler

### CreateThreadDialog

Dialog for creating new threads.

**Props:**
- `open: boolean` - Dialog open state
- `onClose: () => void` - Close handler
- `onSubmit: (data: CreateThreadRequest) => Promise<void>` - Submit handler
- `availableTags: Tag[]` - List of available tags

### CommentItem

Displays a comment with nested replies.

**Props:**
- `comment: Comment` - Comment data
- `threadId: number` - Parent thread ID
- `onVote: (commentId: number, type: "upvote" | "downvote") => Promise<void>` - Vote handler
- `onReply: (commentId: number, body: string) => Promise<void>` - Reply handler
- `depth?: number` - Nesting depth (default: 0)

## Features in Detail

### Voting System

- Users can upvote or downvote threads and comments
- Vote counts are displayed prominently
- Score calculation: `upvotes - downvotes`
- Visual feedback with color coding (green for positive, red for negative)

### Nested Comments

- Comments can be nested up to 3 levels deep
- Each level is visually indented
- Reply button available on comments (except at max depth)
- Collapsible reply forms

### Search & Filtering

- Search by thread title or body content
- Filter by tags
- Sort by Recent (newest first) or Popular (highest score first)
- Multiple tag filters can be combined

### Bookmarking

- Save threads for later reference
- Bookmark count displayed on each thread
- One-click bookmark functionality

## Styling

The community forum uses a clean, professional design inspired by Stack Overflow:

- **Colors:**
  - Primary: Blue (#2563eb)
  - Success/Upvote: Green (#10b981)
  - Error/Downvote: Red (#ef4444)
  - Tags: Light Blue (#dbeafe)
  - Borders: Gray (#e5e7eb)

- **Typography:**
  - Thread titles: Bold, large font
  - Body text: Regular weight, good line height for readability
  - Meta info: Small, secondary color

- **Layout:**
  - Vote buttons prominently on the left
  - Content takes main space
  - Tags displayed as chips
  - Author info at bottom

## Future Enhancements

Potential features to add:

- [ ] User reputation system
- [ ] Best answer selection
- [ ] Edit history
- [ ] Thread categories
- [ ] Markdown support for formatting
- [ ] Code syntax highlighting
- [ ] File attachments
- [ ] Real-time updates (WebSocket)
- [ ] Moderation tools
- [ ] Report inappropriate content
- [ ] Follow threads
- [ ] Email notifications

## Best Practices

1. **Vote Responsibly**: Use upvotes for helpful content, downvotes for unhelpful/incorrect content
2. **Search First**: Before creating a thread, search if the question already exists
3. **Use Tags**: Always add relevant tags to help others find your thread
4. **Be Respectful**: Maintain a professional and respectful tone
5. **Provide Context**: Include enough detail in your questions
6. **Format Well**: Use proper formatting for code and long text

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Responsive design

## License

Part of the LMS Platform - Internal Use Only

