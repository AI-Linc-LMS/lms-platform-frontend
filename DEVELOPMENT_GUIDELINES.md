# Development Guidelines

This document outlines the coding standards, patterns, and best practices to be followed by all developers working on this LMS Platform codebase.

## Table of Contents

1. [Project Structure](#project-structure)
2. [Code Style & Conventions](#code-style--conventions)
3. [Component Development](#component-development)
4. [API Services](#api-services)
5. [State Management](#state-management)
6. [Styling Guidelines](#styling-guidelines)
7. [TypeScript Best Practices](#typescript-best-practices)
8. [Error Handling](#error-handling)
9. [Performance Optimization](#performance-optimization)
10. [Accessibility](#accessibility)
11. [Security Considerations](#security-considerations)
12. [Git Workflow](#git-workflow)

---

## Project Structure

### Directory Organization

```
lms-platform-revamped/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication routes (grouped)
│   ├── admin/             # Admin dashboard pages
│   ├── assessments/       # Assessment pages
│   ├── courses/           # Course pages
│   └── ...
├── components/            # React components
│   ├── admin/            # Admin-specific components
│   ├── common/           # Shared/reusable components
│   ├── layout/           # Layout components
│   └── ...
├── lib/                   # Library code
│   ├── services/         # API service files
│   │   └── admin/        # Admin-specific services
│   ├── contexts/         # React contexts
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utility functions
│   └── ...
├── hooks/                # Global custom hooks
└── public/               # Static assets
```

### File Naming Conventions

- **Components**: PascalCase (e.g., `CourseCard.tsx`, `StudentProfileCard.tsx`)
- **Services**: kebab-case (e.g., `admin-assessment.service.ts`, `courses.service.ts`)
- **Hooks**: camelCase with `use` prefix (e.g., `useLeaderboardAndStreak.ts`, `useTimeTracking.ts`)
- **Utils**: kebab-case (e.g., `date-utils.ts`, `validation.ts`)
- **Pages**: Next.js convention - `page.tsx` for routes
- **Types/Interfaces**: PascalCase (e.g., `StudentDetail`, `CreateAssessmentPayload`)

---

## Code Style & Conventions

### General Rules

1. **Use TypeScript** - All new code must be written in TypeScript
2. **Use "use client" directive** - Add `"use client"` at the top of all client components
3. **ESLint** - Follow ESLint rules and fix all warnings before committing
4. **Prettier** - Code should be properly formatted (if configured)
5. **Line Length** - Keep lines under 120 characters when possible
6. **Comments** - Write self-documenting code. Add comments only when necessary for complex logic

### Import Organization

```typescript
// 1. React and Next.js imports
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// 2. Third-party library imports
import { Box, Typography, Button } from "@mui/material";
import axios from "axios";

// 3. Internal service imports
import { adminAssessmentService } from "@/lib/services/admin/admin-assessment.service";

// 4. Component imports
import { CourseCard } from "@/components/admin/course-builder/CourseCard";

// 5. Hook imports
import { useToast } from "@/components/common/Toast";

// 6. Type/Interface imports
import type { Assessment } from "@/lib/services/admin/admin-assessment.service";

// 7. Utility imports
import { config } from "@/lib/config";
```

### Export Patterns

- **Default exports**: Use for page components (`app/**/page.tsx`)
- **Named exports**: Use for all other components, services, and utilities
- **Service objects**: Export a service object with all methods (e.g., `adminAssessmentService`)

```typescript
// ✅ Good - Named export for component
export function CourseCard({ course }: CourseCardProps) {
  // ...
}

// ✅ Good - Service object export
export const adminAssessmentService = {
  getAssessments,
  createAssessment,
  // ...
};

// ✅ Good - Default export for page
export default function AssessmentPage() {
  // ...
}
```

---

## Component Development

### Component Structure

Follow this order in component files:

```typescript
"use client";

// 1. Imports
import { useState } from "react";
import { Box } from "@mui/material";

// 2. Type/Interface definitions
interface ComponentProps {
  // ...
}

// 3. Component implementation
export function Component({ prop1, prop2 }: ComponentProps) {
  // 4. Hooks (useState, useEffect, etc.)
  const [state, setState] = useState();
  
  // 5. Event handlers
  const handleClick = () => {
    // ...
  };
  
  // 6. Render
  return (
    <Box>
      {/* JSX */}
    </Box>
  );
}
```

### Component Guidelines

1. **Single Responsibility** - Each component should have one clear purpose
2. **Props Interface** - Always define a TypeScript interface for component props
3. **Prop Validation** - Use TypeScript for type checking, not runtime validation
4. **Component Size** - Keep components under 300 lines. Split into smaller components if needed
5. **Reusability** - Extract reusable logic into custom hooks or utility functions
6. **Memoization** - Use `React.memo` for expensive components that re-render frequently

### Component Organization

- **Break down large pages** - Split pages into smaller, focused components
- **Co-locate related components** - Keep related components in the same directory
- **Extract reusable components** - Move shared components to `components/common/`

Example structure:
```
components/
  admin/
    assessment/
      AssessmentTable.tsx
      AssessmentPagination.tsx
      DeleteConfirmationModal.tsx
      BasicInfoSection.tsx
      ...
```

### Props Naming

- Use descriptive names: `onSave`, `onCancel`, `onDelete`
- Boolean props: prefix with `is`, `has`, `should` (e.g., `isLoading`, `hasError`)
- Event handlers: prefix with `on` (e.g., `onClick`, `onChange`, `onSubmit`)

---

## API Services

### Service File Structure

All API services should follow this pattern:

```typescript
import apiClient from "../api";
import { config } from "../../config";
import { AxiosError } from "axios";

// 1. Type/Interface definitions
export interface ApiErrorPayload {
  error?: string;
  message?: string;
  detail?: string;
  [key: string]: any;
}

export interface CreateResourcePayload {
  // ...
}

export interface Resource {
  // ...
}

// 2. Individual API functions
export const getResources = async (
  clientId: string | number
): Promise<Resource[]> => {
  try {
    const response = await apiClient.get(
      `/admin-dashboard/api/clients/${clientId}/resources/`
    );
    return response.data;
  } catch (err) {
    const error = err as AxiosError<ApiErrorPayload>;
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.response?.data?.detail ||
      "Failed to fetch resources";
    throw new Error(message);
  }
};

// 3. Service object export
export const resourceService = {
  getResources,
  createResource,
  updateResource,
  deleteResource,
};
```

### Error Handling Pattern

Always handle errors consistently:

```typescript
try {
  const response = await apiClient.get(/* ... */);
  return response.data;
} catch (err) {
  const error = err as AxiosError<ApiErrorPayload>;
  
  // Handle validation errors (400)
  if (error.response?.status === 400 && error.response?.data) {
    const errorData = error.response.data;
    const errorMessages = Object.entries(errorData)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key}: ${value.join(", ")}`;
        }
        return `${key}: ${value}`;
      })
      .join("; ");
    throw new Error(errorMessages || "Validation error");
  }
  
  // Handle other errors
  const message =
    error.response?.data?.error ||
    error.response?.data?.message ||
    error.response?.data?.detail ||
    "Failed to perform operation";
  throw new Error(message);
}
```

### Service Organization

- **Group by domain** - Admin services go in `lib/services/admin/`
- **One service per domain** - Each domain should have its own service file
- **Use service objects** - Export a service object with all related methods

Example:
- `lib/services/admin/admin-assessment.service.ts`
- `lib/services/admin/admin-student.service.ts`
- `lib/services/admin/admin-dashboard.service.ts`

---

## State Management

### useState Guidelines

1. **Initialize properly** - Always provide initial values
2. **Group related state** - Use objects for related state values
3. **Avoid unnecessary state** - Derive values from props or other state when possible

```typescript
// ✅ Good - Grouped related state
const [formData, setFormData] = useState({
  title: "",
  description: "",
  email: "",
});

// ❌ Bad - Too many separate states
const [title, setTitle] = useState("");
const [description, setDescription] = useState("");
const [email, setEmail] = useState("");
```

### useEffect Guidelines

1. **Dependency arrays** - Always include all dependencies
2. **Cleanup functions** - Clean up subscriptions, timers, and event listeners
3. **Avoid duplicate requests** - Use refs or flags to prevent duplicate API calls

```typescript
// ✅ Good - Proper cleanup
useEffect(() => {
  const handleResize = () => {
    // ...
  };
  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);

// ✅ Good - Prevent duplicate requests
const hasLoadedRef = useRef(false);
useEffect(() => {
  if (hasLoadedRef.current) return;
  hasLoadedRef.current = true;
  fetchData();
}, []);
```

### Custom Hooks

- **Extract reusable logic** - Move complex state logic to custom hooks
- **Naming** - Prefix with `use` (e.g., `useLeaderboardAndStreak`, `useTimeTracking`)
- **Location** - Place in `lib/hooks/` or `hooks/` directory

### Context Usage

- **Use for global state** - Client info, theme, authentication
- **Avoid overuse** - Don't use context for component-level state
- **Provider placement** - Place providers in the root layout

---

## Styling Guidelines

### MUI sx Prop

Always use the `sx` prop for styling. Avoid inline styles or styled components.

```typescript
// ✅ Good
<Box
  sx={{
    display: "flex",
    gap: 2,
    p: { xs: 2, sm: 3, md: 4 },
    backgroundColor: "#f9fafb",
  }}
>

// ❌ Bad
<Box style={{ display: "flex", gap: 8, padding: 16 }}>
```

### Responsive Design

Use MUI breakpoints for responsive styling:

```typescript
sx={{
  // Mobile-first approach
  fontSize: { xs: "0.875rem", sm: "1rem", md: "1.125rem" },
  padding: { xs: 2, sm: 3, md: 4 },
  gridTemplateColumns: {
    xs: "1fr",
    sm: "repeat(2, 1fr)",
    md: "repeat(3, 1fr)",
  },
}}
```

Breakpoints:
- `xs`: 0px+
- `sm`: 600px+
- `md`: 900px+
- `lg`: 1200px+
- `xl`: 1536px+

### Layout Patterns

1. **CSS Grid** - Use for complex layouts (preferred over MUI Grid)
2. **Flexbox** - Use for simple one-dimensional layouts
3. **Avoid MUI Grid** - Use CSS Grid with `display: "grid"` instead

```typescript
// ✅ Good - CSS Grid
<Box
  sx={{
    display: "grid",
    gridTemplateColumns: {
      xs: "1fr",
      md: "repeat(2, 1fr)",
    },
    gap: 2,
  }}
>

// ✅ Good - Flexbox
<Box
  sx={{
    display: "flex",
    alignItems: "center",
    gap: 2,
  }}
>
```

### Color Palette

Use consistent colors from the theme or define custom colors:

```typescript
// Common colors used in the codebase
backgroundColor: "#f9fafb",  // Light gray background
borderColor: "#e5e7eb",      // Border gray
textColor: "#1f2937",        // Dark text
textSecondary: "#6b7280",    // Secondary text
```

### Spacing

Use MUI's spacing scale (multiples of 8px):

```typescript
sx={{
  p: 2,    // 16px
  p: 3,    // 24px
  gap: 1,  // 8px
  gap: 2,  // 16px
}}
```

---

## TypeScript Best Practices

### Type Definitions

1. **Define interfaces** - Use interfaces for object shapes
2. **Use type aliases** - For unions, intersections, and complex types
3. **Export types** - Export types that are used across files

```typescript
// ✅ Good - Interface for props
interface ComponentProps {
  title: string;
  onSave: () => void;
  optional?: boolean;
}

// ✅ Good - Type alias for unions
type Status = "pending" | "completed" | "failed";

// ✅ Good - Exported interface
export interface StudentDetail {
  id: number;
  first_name: string;
  // ...
}
```

### Type Safety

1. **Avoid `any`** - Use `unknown` or proper types instead
2. **Type assertions** - Use sparingly and with caution
3. **Optional chaining** - Use for nullable values

```typescript
// ✅ Good
const error = err as AxiosError<ApiErrorPayload>;
const value = data?.property?.nested;

// ❌ Bad
const error = err as any;
const value = data.property.nested; // May throw if undefined
```

### Generic Types

Use generics for reusable components and functions:

```typescript
interface ApiResponse<T> {
  data: T;
  status: number;
}
```

---

## Error Handling

### Toast Notifications

Use the `useToast` hook for user feedback:

```typescript
import { useToast } from "@/components/common/Toast";

const { showToast } = useToast();

// Success
showToast("Operation completed successfully", "success");

// Error
showToast(error.message || "Something went wrong", "error");

// Info
showToast("Processing your request...", "info");
```

### Error Boundaries

Use `ErrorBoundary` for component-level error handling:

```typescript
import { ErrorBoundary } from "@/components/common/ErrorBoundary";

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

### API Error Handling

Always catch and handle API errors:

```typescript
try {
  const data = await service.getData();
  // Handle success
} catch (error: any) {
  const message = error?.message || "Failed to load data";
  showToast(message, "error");
  // Handle error state
}
```

---

## Performance Optimization

### React Optimization

1. **Memoization** - Use `React.memo` for expensive components
2. **useMemo** - For expensive calculations
3. **useCallback** - For stable function references
4. **Lazy loading** - Use dynamic imports for large components

```typescript
// ✅ Good - Memoized component
export const ExpensiveComponent = memo(function ExpensiveComponent({
  data,
}: Props) {
  // ...
});

// ✅ Good - Memoized calculation
const filteredData = useMemo(() => {
  return data.filter(/* ... */);
}, [data]);

// ✅ Good - Stable callback
const handleClick = useCallback(() => {
  // ...
}, [dependencies]);
```

### Data Fetching

1. **Consolidate requests** - Combine multiple API calls when possible
2. **Caching** - Implement caching for frequently accessed data
3. **Debouncing** - Debounce search inputs and auto-save operations

```typescript
// ✅ Good - Debounced auto-save
useEffect(() => {
  const timeoutId = setTimeout(() => {
    saveToLocalStorage(data);
  }, 1000);
  return () => clearTimeout(timeoutId);
}, [data]);
```

### Code Splitting

Use dynamic imports for route-based code splitting:

```typescript
const HeavyComponent = dynamic(() => import("./HeavyComponent"), {
  loading: () => <Loading />,
});
```

---

## Accessibility

### ARIA Labels

Add ARIA labels for interactive elements:

```typescript
<Button
  aria-label="Delete assessment"
  onClick={handleDelete}
>
  <IconWrapper icon="mdi:delete" />
</Button>
```

### Keyboard Navigation

Ensure all interactive elements are keyboard accessible:

```typescript
<Box
  component="button"
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      handleClick();
    }
  }}
  tabIndex={0}
  role="button"
>
```

### Semantic HTML

Use semantic HTML elements:

```typescript
// ✅ Good
<Box component="nav">
<Box component="main">
<Box component="article">

// ❌ Bad
<div> everywhere
```

---

## Security Considerations

### Authentication

1. **Token management** - Tokens are handled automatically by `apiClient`
2. **Protected routes** - Use middleware or route guards
3. **Client-side validation** - Validate inputs, but always verify on the server

### Input Sanitization

1. **Sanitize user input** - Before displaying or storing
2. **XSS prevention** - React automatically escapes, but be careful with `dangerouslySetInnerHTML`
3. **CSRF protection** - Handled by the backend

### Environment Variables

- **Never commit secrets** - Use `.env.local` for sensitive data
- **Prefix with `NEXT_PUBLIC_`** - Only for client-side accessible variables
- **Validate on startup** - Check required environment variables

---

## Git Workflow

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `refactor/description` - Code refactoring
- `docs/description` - Documentation updates

### Commit Messages

Follow conventional commits:

```
feat: add assessment creation page
fix: resolve pagination issue in student table
refactor: extract assessment components
docs: update development guidelines
```

### Code Review Checklist

Before submitting a PR:

- [ ] Code follows style guidelines
- [ ] TypeScript types are properly defined
- [ ] No ESLint errors or warnings
- [ ] Components are properly tested (manually)
- [ ] Error handling is implemented
- [ ] Responsive design is considered
- [ ] Accessibility is considered
- [ ] No console.logs or debug code
- [ ] Documentation is updated if needed

---

## Additional Best Practices

### Local Storage

- **Use for non-sensitive data** - User preferences, UI state
- **Handle errors** - Wrap in try-catch
- **Clear on logout** - Remove user-specific data

```typescript
// ✅ Good
try {
  const saved = localStorage.getItem("key");
  if (saved) {
    return JSON.parse(saved);
  }
} catch (error) {
  // Silently handle error
}
```

### Icons

Use `IconWrapper` for SSR-safe icons:

```typescript
import { IconWrapper } from "@/components/common/IconWrapper";

<IconWrapper icon="mdi:delete" size={24} color="#ef4444" />
```

### Loading States

Always show loading states for async operations:

```typescript
const [loading, setLoading] = useState(false);

if (loading) {
  return <CircularProgress />;
}
```

### Empty States

Provide helpful empty states:

```typescript
if (data.length === 0) {
  return (
    <Box sx={{ textAlign: "center", py: 4 }}>
      <Typography>No data available</Typography>
    </Box>
  );
}
```

### Pagination

Implement consistent pagination:

```typescript
const [page, setPage] = useState(1);
const [limit, setLimit] = useState(10);

const paginatedData = useMemo(() => {
  const startIndex = (page - 1) * limit;
  return data.slice(startIndex, startIndex + limit);
}, [data, page, limit]);
```

---

## Common Patterns

### Form Handling

```typescript
const [formData, setFormData] = useState({
  title: "",
  description: "",
});

const handleChange = (field: string, value: string) => {
  setFormData((prev) => ({ ...prev, [field]: value }));
};

const handleSubmit = async () => {
  try {
    await service.create(formData);
    showToast("Created successfully", "success");
  } catch (error: any) {
    showToast(error.message, "error");
  }
};
```

### Modal/Dialog Pattern

```typescript
const [open, setOpen] = useState(false);

<Dialog open={open} onClose={() => setOpen(false)}>
  <DialogTitle>Title</DialogTitle>
  <DialogContent>
    {/* Content */}
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setOpen(false)}>Cancel</Button>
    <Button onClick={handleSave}>Save</Button>
  </DialogActions>
</Dialog>
```

### Table with Pagination

```typescript
const [page, setPage] = useState(1);
const [limit, setLimit] = useState(10);

<TableContainer>
  <Table>
    {/* Table content */}
  </Table>
</TableContainer>
<Box sx={{ display: "flex", justifyContent: "space-between", p: 2 }}>
  <Typography>
    Showing {startIndex + 1} to {endIndex} of {total}
  </Typography>
  <Pagination
    count={totalPages}
    page={page}
    onChange={(_, value) => setPage(value)}
  />
</Box>
```

---

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Material-UI Documentation](https://mui.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)

---

## Questions?

If you have questions about these guidelines or need clarification, please:
1. Check existing code for examples
2. Ask in team discussions
3. Update this document if you find better patterns

**Last Updated**: 2024

