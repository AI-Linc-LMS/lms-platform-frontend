# Course Components Documentation

This directory contains a collection of reusable React components for displaying courses in various layouts.

## Available Components

### CourseCard

A flexible card component that displays course information with two variants:

- **Basic**: Shows title, subtitle, description, and stats
- **Detailed**: Shows title, subtitle, level tag, progress bar, and stats

```tsx
import { CourseCard } from '../features/learn';

<CourseCard course={myCourse} variant="detailed" />
```

### CustomCourseLayout

A component that organizes courses into specific layouts:

- **custom-grid**: Arranges courses in a grid with specified rows and columns
- **custom-row**: Arranges courses in a horizontal row

```tsx
import { CustomCourseLayout } from '../features/learn';

<CustomCourseLayout 
  courses={detailedCourses} 
  layout="custom-grid"
  variant="detailed"
  columns={2}
  rowsPerPage={2}
/>
```

### CoursesPagination

A component that displays courses with pagination controls:

```tsx
import { CoursesPagination } from '../features/learn';

<CoursesPagination 
  courses={allCourses} 
  itemsPerPage={4}
  variant="detailed"
  columns={2}
/>
```

### CoursesDetails

A high-level component that combines multiple layout options:

```tsx
import { CoursesDetails } from '../features/learn';

<CoursesDetails 
  basicCourses={recommendedCourses}
  detailedCourses={inProgressCourses} 
/>
```

### CoursesPage

A complete page that demonstrates how to organize courses in the 2x2 grid layout as shown in the design:

```tsx
import { CoursesPage } from '../features/learn';

<CoursesPage />
```

## Usage Example

To implement the 2x2 grid layout shown in the design:

```tsx
import React from 'react';
import { CustomCourseLayout, detailedCourses } from '../features/learn';

const MyCoursesSection = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">In Progress</h2>
      <CustomCourseLayout 
        courses={detailedCourses.slice(0, 4)} 
        layout="custom-grid"
        variant="detailed"
        columns={2}
        rowsPerPage={2}
      />
    </div>
  );
};

export default MyCoursesSection;
```

## Data Structure

The course components use the following data structure:

```tsx
interface Course {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  stats: CourseStat[];
  trustedBy?: string[];
  level?: string;
  progress?: CourseProgress;
  onExplore: () => void;
}
```

See `types/course.types.ts` for complete type definitions. 