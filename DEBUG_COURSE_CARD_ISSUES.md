# Debugging Admin Course Card Rating & Difficulty Issues

## Current Status
The admin course card has been updated with editable rating and difficulty features, but changes may not be reflecting properly. Here's a debugging guide:

## Debugging Steps

### 1. Check Browser Console
Open browser developer tools and look for console logs when editing:
- "Saving rating change: {from: X, to: Y}"
- "Saving difficulty change: {from: X, to: Y}"
- "Updating course with data: {...}"
- "Course updated successfully: {...}"

### 2. Network Tab Monitoring
1. Open Network tab in browser dev tools
2. Try editing rating or difficulty
3. Look for PATCH requests to `/admin-dashboard/api/clients/{clientId}/courses/{courseId}/`
4. Check request payload contains `rating` or `difficulty_level` fields
5. Check response returns updated course data

### 3. Backend API Verification
Ensure the backend API:
- Accepts `rating` field (number 0-5)
- Accepts `difficulty_level` field (string: "Easy", "Medium", "Hard")
- Returns updated course object with these fields
- Saves changes to database

### 4. Frontend State Check
Using React Developer Tools:
1. Find AdminCourseCard component
2. Check state values:
   - `tempRating` should update when typing
   - `tempDifficulty` should update when selecting
   - `isEditingRating` / `isEditingDifficulty` should toggle

### 5. Query Cache Inspection
Check if React Query is properly refetching:
- Look for "courses" query in React Query DevTools
- Verify data is updated after mutation
- Check if `queryClient.refetchQueries` is being called

## Common Issues & Fixes

### Issue 1: Changes Not Persisting
**Symptoms:** UI reverts to old values after editing
**Causes:**
- Backend not saving changes
- Backend not returning updated data
- Query cache not updating

**Fix:** Check backend API logs and database

### Issue 2: Frontend Not Updating
**Symptoms:** Backend saves but UI doesn't update
**Causes:**
- Query invalidation not working
- Component not re-rendering
- Wrong query key

**Fix:** Ensure query invalidation uses correct key: `["courses"]`

### Issue 3: Validation Errors
**Symptoms:** Error toasts appear when saving valid values
**Causes:**
- NaN values from empty inputs
- Floating point comparison issues
- Incorrect validation logic

**Fix:** Check input parsing and validation logic

### Issue 4: API Request Format
**Symptoms:** Backend receives malformed data
**Causes:**
- Rating not included in request
- Difficulty_level field missing
- Spread operator override

**Fix:** Verify mutation data structure:
```javascript
{
  title: "...",
  description: "...", 
  slug: "...",
  rating: 4.5,           // If rating changed
  difficulty_level: "Medium"  // If difficulty changed
}
```

## Test Scenarios

### Rating Tests
1. Edit rating to 3.5 → Should save and display 3.5
2. Edit rating to 0 → Should save and display 0
3. Edit rating to 5 → Should save and display 5
4. Edit rating to 6 → Should show validation error
5. Clear rating input → Should handle gracefully

### Difficulty Tests
1. Change Easy → Medium → Should save and display "Medium"
2. Change Medium → Hard → Should save and display "Hard"
3. Change Hard → Easy → Should save and display "Easy"

### Frontend Reflection Tests
1. Edit in admin → Check frontend course card shows updated values
2. Refresh page → Values should persist
3. Navigate away and back → Values should persist

## Expected Behavior

### Admin Course Card
- Click rating "4.8/5" → Shows number input
- Type new rating → Input accepts 0-5 with decimals
- Press Enter or click away → Saves and shows updated rating
- Click difficulty "Medium" → Shows dropdown
- Select new difficulty → Saves immediately and shows new value

### Frontend Course Card v2
- Should automatically reflect admin changes
- Rating stars should match admin-set rating
- Difficulty pill should match admin-set difficulty

## Technical Implementation Details

### API Payload
```json
{
  "rating": 4.2,
  "difficulty_level": "Hard"
}
```

### Database Fields
- `rating`: DECIMAL(2,1) or FLOAT
- `difficulty_level`: VARCHAR or ENUM("Easy", "Medium", "Hard")

### React Query
- Query Key: `["courses"]`
- Invalidation: Both invalidate and refetch for immediate updates
- Optimistic updates: Not implemented (could be added for better UX)

## Troubleshooting Commands

### Check Course Data Structure
```javascript
// In browser console
console.log('Current course:', course);
console.log('Course rating:', course.rating);
console.log('Course difficulty:', course.difficulty_level);
```

### Monitor Mutations
```javascript
// In browser console on AdminCourseCard
console.log('Mutation state:', updateCourseMutation);
```

### Verify API Response
```javascript
// Check network response
fetch('/admin-dashboard/api/clients/1/courses/')
  .then(res => res.json())
  .then(data => console.log('Courses:', data));
```