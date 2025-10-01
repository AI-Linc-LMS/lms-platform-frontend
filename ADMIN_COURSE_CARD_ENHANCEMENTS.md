# Admin Course Card Enhancements

## Overview
Enhanced the admin course card to make rating editable and add a dropdown option for difficulty level selection that matches the frontend UI.

## Changes Made

### 1. Course Interface Updates
- **Added `rating?: number` field** to Course interfaces in:
  - `/src/features/admin/course-builder/components/AdminCourseCard.tsx`
  - `/src/features/admin/course-builder/pages/CourseBuilder.tsx`
  - `/src/services/admin/courseApis.ts` (CourseData interface)

### 2. AdminCourseCard Component Enhancements

#### New State Variables
- `isEditingRating`: Boolean to track rating edit mode
- `isEditingDifficulty`: Boolean to track difficulty edit mode  
- `tempRating`: Temporary rating value during editing
- `tempDifficulty`: Temporary difficulty value during editing

#### New Refs
- `ratingInputRef`: Reference for rating input field
- `difficultySelectRef`: Reference for difficulty dropdown

#### Editable Rating Feature
- **Click to Edit**: Click on the rating display to enter edit mode
- **Input Field**: Number input with min=0, max=5, step=0.1
- **Validation**: Ensures rating is between 0 and 5
- **Visual Feedback**: Shows pencil icon on hover
- **Keyboard Support**: Enter to save, Escape to cancel
- **Auto-save**: Saves when input loses focus

#### Editable Difficulty Feature
- **Click to Edit**: Click on difficulty pill to open dropdown
- **Dropdown Options**: Easy, Medium, Hard (matching frontend)
- **Same UI Style**: Maintains the pill design during editing
- **Visual Feedback**: Shows pencil icon on hover
- **Keyboard Support**: Enter to save, Escape to cancel
- **Auto-save**: Saves when dropdown loses focus

### 3. API Integration
- Updated `updateCourse` mutation to handle `rating` and `difficulty_level` fields
- Added proper error handling with temp value reset on failure
- Maintains existing slug generation logic for title changes

## Usage Instructions

### For Admins

#### Editing Rating:
1. Navigate to the course builder page
2. Find the course card you want to edit
3. Click on the rating display (e.g., "4.8/5") in the top-right area
4. Enter new rating value (0-5, decimals allowed)
5. Press Enter or click outside to save
6. Press Escape to cancel changes

#### Editing Difficulty:
1. Navigate to the course builder page
2. Find the course card you want to edit
3. Click on the difficulty pill (e.g., "Medium") in the course info section
4. Select new difficulty from dropdown (Easy/Medium/Hard)
5. The change saves automatically when you select an option
6. Press Escape to cancel changes

### Visual Indicators
- **Hover Effects**: Pencil emoji (✏️) appears on hover for editable fields
- **Edit Mode**: 
  - Rating: Shows number input with blue border
  - Difficulty: Shows dropdown with blue background
- **Loading States**: Fields are disabled during mutation
- **Error Handling**: Toast notifications for validation errors

## Technical Implementation Details

### Mutation Structure
```typescript
updateCourseMutation.mutate({ 
  rating: newRating,           // 0-5 number
  difficulty_level: newLevel   // "Easy" | "Medium" | "Hard"
});
```

### Validation Rules
- **Rating**: Must be between 0 and 5 (inclusive)
- **Difficulty**: Must be one of "Easy", "Medium", "Hard"
- **Error Handling**: Shows toast notification and resets to original value

### State Management
- Uses React Query for server state management
- Optimistic updates with error rollback
- Cache invalidation after successful updates
- Temporary state for editing values

## Benefits

1. **Improved UX**: Admins can quickly edit course metadata without navigating to separate pages
2. **Consistent UI**: Matches the existing design patterns and frontend appearance
3. **Real-time Updates**: Changes are immediately reflected after successful API calls
4. **Error Resilience**: Proper validation and error handling with user feedback
5. **Keyboard Accessibility**: Full keyboard navigation support

## Files Modified

1. `/src/features/admin/course-builder/components/AdminCourseCard.tsx` - Main component updates
2. `/src/features/admin/course-builder/pages/CourseBuilder.tsx` - Interface consistency
3. `/src/services/admin/courseApis.ts` - API interface updates

## Future Enhancements

- Add rating slider/star selection UI for better UX
- Add bulk edit functionality for multiple courses
- Add more fields for inline editing (price, language, etc.)
- Add undo/redo functionality
- Add audit logging for changes