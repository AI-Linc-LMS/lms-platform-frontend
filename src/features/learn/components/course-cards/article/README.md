# Dynamic Article Layout System

This system allows articles to be rendered with completely dynamic layouts and styling that come from the backend, rather than being hardcoded in the frontend.

## Overview

The `ArticleCard` component now supports:
- **Dynamic layouts** from backend configuration
- **Predefined templates** for common layouts
- **Custom styling** through CSS classes and inline styles
- **Responsive designs** with different mobile/desktop configurations
- **Complete customization** of all UI elements

## How It Works

### 1. Backend Response Structure

The backend can send layout configuration in several ways:

#### Option A: Using Predefined Templates
```json
{
  "id": 1,
  "content_title": "Introduction to React",
  "content_type": "article",
  "duration_in_minutes": 15,
  "details": {
    "id": 1,
    "title": "Introduction to React",
    "content": "<h1>Welcome to React</h1><p>This is the article content...</p>",
    "difficulty_level": "Beginner",
    "marks": 10,
    "template": "IMMERSIVE"
  },
  "status": "incomplete"
}
```

#### Option B: Custom Layout Configuration
```json
{
  "id": 1,
  "content_title": "Advanced JavaScript",
  "content_type": "article",
  "duration_in_minutes": 25,
  "details": {
    "id": 1,
    "title": "Advanced JavaScript",
    "content": "<div>Custom HTML content...</div>",
    "difficulty_level": "Advanced",
    "marks": 20,
    "layout_config": {
      "container": {
        "className": "max-w-6xl mx-auto p-8 bg-gradient-to-r from-blue-50 to-indigo-100 rounded-2xl shadow-xl relative"
      },
      "header": {
        "className": "text-center mb-10",
        "showTitle": true,
        "showMetadata": true,
        "showMarks": true,
        "titleClassName": "text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4",
        "metadataClassName": "flex justify-center items-center gap-6 text-lg text-gray-600",
        "marksClassName": "inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full font-bold text-lg shadow-lg"
      },
      "content": {
        "className": "course-description prose prose-xl max-w-none text-gray-800",
        "wrapperClassName": "bg-white rounded-xl shadow-inner p-10 mb-10"
      },
      "actions": {
        "className": "text-center",
        "buttonClassName": "inline-flex items-center gap-3 px-10 py-4 rounded-full text-xl font-bold bg-gradient-to-r from-green-500 to-blue-600 text-white transition transform hover:scale-110 shadow-2xl",
        "buttonText": "🎉 Complete This Amazing Article!",
        "showIcon": true
      }
    }
  },
  "status": "incomplete"
}
```

#### Option C: Template + Customizations
```json
{
  "id": 1,
  "content_title": "Data Structures",
  "template": "DARK",
  "layout_config": {
    "header": {
      "titleClassName": "text-3xl font-black text-purple-400 mb-4"
    },
    "actions": {
      "buttonText": "Master This Topic!"
    }
  }
}
```

## Available Templates

### 1. DEFAULT
- Modern, clean layout
- Standard spacing and typography
- Suitable for most articles

### 2. COMPACT
- Smaller spacing and fonts
- Perfect for mobile or sidebar display
- Condensed information layout

### 3. IMMERSIVE
- Full-width, magazine-style layout
- Large typography and spacing
- Gradient backgrounds and shadows
- Best for featured content

### 4. MINIMAL
- Clean, distraction-free design
- Minimal UI elements
- Focus on content readability
- No marks display, simple metadata

### 5. CARD
- Card-based sectioned layout
- Clear visual separation
- Professional appearance
- Good for structured content

### 6. DARK
- Dark theme with light text
- Gradient accents
- Modern dark UI
- Great for technical content

## Layout Configuration Options

### Container
```typescript
container?: {
  className?: string;        // CSS classes for main container
  style?: React.CSSProperties; // Inline styles
}
```

### Header
```typescript
header?: {
  className?: string;        // CSS classes for header section
  style?: React.CSSProperties; // Inline styles
  showTitle?: boolean;       // Whether to show article title
  showMetadata?: boolean;    // Whether to show time/difficulty
  showMarks?: boolean;       // Whether to show marks badge
  titleClassName?: string;   // CSS classes for title
  metadataClassName?: string; // CSS classes for metadata
  marksClassName?: string;   // CSS classes for marks badge
}
```

### Content
```typescript
content?: {
  className?: string;        // CSS classes for content area
  style?: React.CSSProperties; // Inline styles
  wrapperClassName?: string; // CSS classes for content wrapper
}
```

### Actions
```typescript
actions?: {
  className?: string;        // CSS classes for actions section
  style?: React.CSSProperties; // Inline styles
  buttonClassName?: string;  // CSS classes for complete button
  buttonText?: string;       // Custom button text
  showIcon?: boolean;        // Whether to show completion icon
}
```

## Backend Implementation Examples

### Django/Python Example
```python
def get_article_content(request, article_id):
    article = Article.objects.get(id=article_id)
    
    # Determine layout based on article type or user preferences
    if article.is_featured:
        template = "IMMERSIVE"
    elif article.difficulty == "advanced":
        template = "DARK"
    else:
        template = "DEFAULT"
    
    # Custom layout for special articles
    custom_layout = None
    if article.has_custom_layout:
        custom_layout = {
            "header": {
                "titleClassName": f"text-2xl font-bold text-{article.theme_color}-600"
            }
        }
    
    return JsonResponse({
        "id": article.id,
        "content_title": article.title,
        "content_type": "article",
        "duration_in_minutes": article.estimated_read_time,
        "details": {
            "id": article.id,
            "title": article.title,
            "content": article.html_content,
            "difficulty_level": article.difficulty,
            "marks": article.marks,
            "template": template,
            "layout_config": custom_layout
        },
        "status": get_user_progress(request.user, article)
    })
```

### Node.js/Express Example
```javascript
app.get('/api/articles/:id', async (req, res) => {
  const article = await Article.findById(req.params.id);
  
  // Dynamic template selection
  let template = 'DEFAULT';
  if (article.category === 'featured') template = 'IMMERSIVE';
  if (article.theme === 'dark') template = 'DARK';
  if (article.type === 'quick-read') template = 'COMPACT';
  
  // Custom layout modifications
  const layoutConfig = {
    header: {
      titleClassName: `text-2xl font-bold text-${article.brandColor}-600`,
      showMarks: article.hasAssessment
    },
    actions: {
      buttonText: article.customButtonText || 'Mark as completed'
    }
  };
  
  res.json({
    id: article.id,
    content_title: article.title,
    content_type: 'article',
    duration_in_minutes: article.readTime,
    details: {
      id: article.id,
      title: article.title,
      content: article.htmlContent,
      difficulty_level: article.difficulty,
      marks: article.points,
      template: template,
      layout_config: layoutConfig
    },
    status: await getUserProgress(req.user.id, article.id)
  });
});
```

## Frontend Usage

The frontend automatically handles the layout configuration:

```typescript
// The component automatically detects and applies layouts
<ArticleCard 
  contentId={123}
  courseId={456}
  onMarkComplete={() => //console.log('Completed!')}
/>
```

## Benefits

1. **No Frontend Changes Needed**: Backend can completely change article appearance without frontend deployments
2. **A/B Testing**: Easy to test different layouts for different user groups
3. **Branding**: Different courses/clients can have different article styles
4. **Responsive**: Built-in support for mobile/desktop differences
5. **Accessibility**: Consistent structure with customizable presentation
6. **Performance**: HTML content is still parsed efficiently with `html-react-parser`

## Migration Guide

### From Hardcoded to Dynamic

**Before:**
```jsx
// Fixed layout in JSX
<div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-sm">
  <h1 className="text-2xl font-semibold text-gray-800">
    {article.title}
  </h1>
  <div className="course-description">
    {parseHtml(article.content)}
  </div>
</div>
```

**After:**
```jsx
// Dynamic layout from backend
<ArticleCard 
  contentId={article.id}
  courseId={course.id}
  onMarkComplete={handleComplete}
/>
```

The backend now controls all styling through the API response.

## Security Considerations

- HTML content is sanitized (script tags removed)
- CSS classes are validated
- Inline styles are applied safely through React
- No arbitrary code execution possible

## Performance

- Layout configurations are cached with React Query
- Templates are pre-defined and optimized
- HTML parsing is done efficiently with `html-react-parser`
- No runtime CSS generation 