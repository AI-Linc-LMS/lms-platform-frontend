# Backend Requirement: Manage Students API Enhancement

## Endpoint
`GET /admin-dashboard/api/clients/{clientId}/manage-students/`

**Example:** `https://be-app.ailinc.com/admin-dashboard/api/clients/7/manage-students/`

## Current Behavior
When filtering by `course_id` parameter, the API returns a list of students enrolled in that course with general information only. The response includes `total_marks` (cumulative across all courses) but NOT course-specific progress or marks for the filtered course.

## Required Enhancement
When the `course_id` query parameter is provided, each student object in the response should include two additional fields with course-specific data from that filtered course.

### New Fields Required in Response

```typescript
{
  // ... existing fields ...
  "course_progress": number,  // Progress percentage for the filtered course (e.g., 4.08)
  "course_marks": number      // Marks obtained in the filtered course (e.g., 420)
}
```

### Data Source
This data already exists in the detail endpoint response. Extract from student's `enrolled_courses` array:

**From Detail API:** `GET /admin-dashboard/api/clients/{clientId}/manage-student/{studentId}/`
```json
{
  "enrolled_courses": [
    {
      "id": 5,
      "title": "Data Science",
      "progress_percentage": 4.08,
      "marks": 420,
      ...
    }
  ]
}
```

**Mapping for List API when course_id=5:**
- **course_progress** ← `enrolled_courses.find(c => c.id === 5).progress_percentage` (4.08)
- **course_marks** ← `enrolled_courses.find(c => c.id === 5).marks` (420)

### Example

**Request:**
```
GET /admin-dashboard/api/clients/7/manage-students/?course_id=5
```

**ACTUAL Current Response (Problem):**
```json
{
  "students": [
    {
      "id": 618,
      "user_id": 611,
      "name": "Akhila kondu",
      "email": "akhila.kondu@gmail.com",
      "total_marks": 420,                    // ← This is TOTAL marks across ALL courses
      "enrollment_count": 1,
      "most_active_course": "Data Science",
      "total_time_spent": { "value": 3.61, "unit": "hours" },
      "current_streak": 5
      // ❌ Missing: course_progress (4.08% for Data Science)
      // ❌ Missing: course_marks (420 for Data Science only)
    }
  ],
  "filters_applied": {
    "course_id": 5,                          // ← We're filtering by course...
    "search": "",
    "is_active": null,
    "sort_by": "name",
    "sort_order": "asc"
  }
}
```

**REQUIRED Response:**
```json
{
  "students": [
    {
      "id": 618,
      "user_id": 611,
      "name": "Akhila kondu",
      "email": "akhila.kondu@gmail.com",
      "total_marks": 420,
      "enrollment_count": 1,
      "most_active_course": "Data Science",
      "course_progress": 4.08,   // ← NEW: Progress % in filtered course (Data Science)
      "course_marks": 420,       // ← NEW: Marks earned in filtered course (Data Science)
      "total_time_spent": { "value": 3.61, "unit": "hours" },
      "current_streak": 5
    }
  ],
  "filters_applied": {
    "course_id": 5,
    "search": "",
    "is_active": null,
    "sort_by": "name",
    "sort_order": "asc"
  }
}
```

### Visual Example from Student Detail Drawer

When clicking "Actions" → Student Details, we see:

**Academic Summary Section:**
- Marks: 420

**Courses Section:**
- Data Science
  - Progress: 4.08% • Marks: 420
  - Contents: 28/686

This same data should appear in the table when filtering by "Data Science" course.

### Use Case
When admins filter students by a specific course (e.g., "Data Science"), they want to see at a glance:
- **Progress column**: Visual progress bar showing 4.08% completion for Data Science
- **Marks Obtained column**: Marks earned in Data Science (420)

Instead of the generic:
- Enrollments column (total number of courses enrolled)
- Most Active Course column

### Frontend Implementation Status
✅ Frontend UI is ready with conditional column rendering
✅ TypeScript interfaces updated with `course_progress` and `course_marks` optional fields
✅ Progress bar component ready to display percentage visually
✅ Graceful fallback: Shows "Data not available" if fields are missing
✅ Console logging to verify when backend adds these fields

### Backend Implementation Notes
1. When `course_id` is present in query params, join with enrollment/course progress data
2. For each student, find their enrollment record for that specific course
3. Include `progress_percentage` as `course_progress`
4. Include `marks` as `course_marks`
5. If student is not enrolled in that course (shouldn't happen with proper filtering), set to 0 or null

### Priority
**Medium-High** - Significantly enhances admin UX when managing course-specific student performance. The data already exists in the detail endpoint, just needs to be included in the list endpoint when filtering by course.

---

## Summary Table

| Field | Current State | Required When `course_id` Filter Active |
|-------|---------------|------------------------------------------|
| `total_marks` | ✅ Present (all courses combined) | ✅ Keep as-is |
| `enrollment_count` | ✅ Present | ✅ Keep as-is |
| `most_active_course` | ✅ Present | ✅ Keep as-is |
| `course_progress` | ❌ Missing | ✅ **ADD** - Progress % in filtered course |
| `course_marks` | ❌ Missing | ✅ **ADD** - Marks earned in filtered course |

## Testing
After implementation, test with:
```bash
GET https://be-app.ailinc.com/admin-dashboard/api/clients/7/manage-students/?course_id=5
```

Expected: Each student object should include `course_progress` and `course_marks` fields.
