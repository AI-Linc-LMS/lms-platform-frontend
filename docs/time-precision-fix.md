# Time Precision Fix for User Activity Tracking

## Problem Statement

The LMS platform was experiencing issues with exact time recording when sending user activity data to the backend. The main problems identified were:

1. **Precision Loss**: Converting seconds to minutes with `Math.round()` was losing exact time data
2. **Time Inflation Bug**: `Math.round()` was inflating time values (e.g., 34 seconds became 1 minute instead of 0 minutes)
3. **Inconsistent Formatting**: Different parts of the codebase were formatting time data differently
4. **Missing Timestamps**: Some API calls were missing client-side timestamps for verification
5. **Incomplete Session Data**: Current session duration wasn't always included in API payloads
6. **Delayed Data Transmission**: Session-end data was only sent during periodic syncs, causing time loss and inaccurate timing

## Root Cause Analysis

### Issue 1: Time Inflation Bug
**Problem**: Using `Math.round(34 / 60) = 1` was inflating 34 seconds to 1 minute
**Example**: User with 34 seconds of activity was showing as 1 minute in the API
**Expected**: 34 seconds should show as 0 minutes (using `Math.floor()`)

### Issue 2: Time Precision Loss in API Service
**File**: `src/services/activityTrackingApi.ts`
**Problem**: The `sendActivityData` function was only sending time in minutes:
```javascript
// BEFORE (losing precision and inflating time)
const apiData = {
  "time-spend": Math.round(data.totalTimeSpent / 60), // 34 seconds = 1 minute (WRONG)
  // ... other fields
};
```

### Issue 3: Inconsistent Implementation
**Problem**: The `UserActivityContext.tsx` was already implementing precise time tracking, but the API service wasn't using it:
```javascript
// Context was correctly sending:
"time-spend-seconds": totalTimeInSeconds, // Exact seconds
"time-spend": Math.round(totalTimeInSeconds / 60), // Minutes (but with inflation bug)
```

### Issue 4: Delayed Session-End Data Transmission
**Problem**: When a user became inactive (e.g., at exactly 16:55), the session-end data was not sent immediately to the backend. Instead, it was only sent during:
- Periodic syncs (every 3 minutes)
- Page unload events
- Manual sync triggers

**Impact**: This caused time loss and inaccurate session timing, as the exact moment of inactivity wasn't recorded.

## Solutions Implemented

### 1. Fixed Time Rounding Bug

**Changed**: `Math.round()` → `Math.floor()` throughout the codebase
**Reason**: Prevents time inflation where partial minutes are rounded up

```javascript
// BEFORE (inflating time)
"time-spend": Math.round(34 / 60) = 1 minute

// AFTER (accurate time)
"time-spend": Math.floor(34 / 60) = 0 minutes
```

### 2. Updated API Service for Exact Time Recording

**File**: `src/services/activityTrackingApi.ts`

**Changes Made**:
- Added `"time-spend-seconds"` field for exact precision
- Changed `Math.round()` to `Math.floor()` for minutes field
- Added `user_id` and `timestamp` fields for better tracking

```javascript
// AFTER (with exact precision and no inflation)
const apiData = {
  date: new Date(data.timestamp).toISOString().split('T')[0],
  "time-spend-seconds": data.totalTimeSpent, // Exact seconds for precision
  "time-spend": Math.floor(data.totalTimeSpent / 60), // Accurate minutes (no inflation)
  session_id: data.session_id,
  device_info: data.device_info,
  user_id: data.userId, // Include user ID for server-side aggregation
  timestamp: data.timestamp // Include client timestamp for verification
};
```

### 3. Enhanced Utility Functions

**File**: `src/utils/userActivitySync.ts`

**New Function Added**:
```javascript
export const createPreciseActivityPayload = (
  totalTimeSpent: number,
  currentSessionDuration: number,
  sessionId: string,
  deviceInfo: { browser: string; os: string; deviceType: string },
  userId?: string,
  customTimestamp?: number
) => {
  // Validates time values and creates consistent payload
  // Uses Math.floor() to prevent time inflation
  // Includes both seconds and minutes
  // Adds diagnostic information
}
```

### 4. Immediate Session-End Data Transmission

**New Feature**: Added immediate session-end data transmission with exact timing

**Files Updated**:
- `src/utils/userActivitySync.ts` - Added `sendSessionEndData()` and `sendSessionEndDataViaBeacon()`
- `src/contexts/UserActivityContext.tsx` - Updated `endSession()` to send data immediately

**Key Features**:
- **Exact Timing**: Data is sent at the exact moment a session ends (e.g., 16:55:00)
- **Session-End Markers**: API payload includes `event_type: "session-end"` to identify session boundaries
- **Immediate Transmission**: Uses `fetch()` for immediate sending, `beacon()` for page unload scenarios
- **No Time Loss**: Session duration is calculated and sent before any delays occur

**New Session-End API Payload**:
```javascript
{
  date: "2024-01-15",
  "time-spend-seconds": 1234,
  "time-spend": 20,
  session_id: "session-uuid",
  device_info: {...},
  user_id: "user123",
  timestamp: 1705123456789, // Exact end time
  
  // Session-specific information
  session_start_time: 1705122222789,
  session_end_time: 1705123456789,
  session_duration_seconds: 1234,
  event_type: "session-end",
  
  // Additional context
  client_timezone: "America/New_York",
  session_end_reason: "user_inactive"
}
```

### 5. Fixed All Instances of Time Rounding

**Files Updated**:
- `src/services/activityTrackingApi.ts` (2 instances)
- `src/utils/userActivitySync.ts` (2 instances)
- `src/contexts/UserActivityContext.tsx` (3 instances)
- `src/components/FloatingActivityTimer.tsx` (1 instance)

## API Payload Format

### New Standardized Format
```json
{
  "date": "2024-01-15",
  "time-spend-seconds": 34,
  "time-spend": 0,
  "current_session_duration": 120,
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "device_info": {
    "browser": "Chrome",
    "os": "Windows",
    "deviceType": "desktop"
  },
  "user_id": "user123",
  "timestamp": 1705123456789
}
```

### Session-End Payload Format
```json
{
  "date": "2024-01-15",
  "time-spend-seconds": 1234,
  "time-spend": 20,
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "device_info": {
    "browser": "Chrome",
    "os": "Windows",
    "deviceType": "desktop"
  },
  "user_id": "user123",
  "timestamp": 1705123456789,
  "session_start_time": 1705122222789,
  "session_end_time": 1705123456789,
  "session_duration_seconds": 1234,
  "event_type": "session-end",
  "client_timezone": "America/New_York",
  "session_end_reason": "user_inactive"
}
```

### Time Conversion Examples
| Seconds | Old (Math.round) | New (Math.floor) | Correct? |
|---------|------------------|------------------|----------|
| 34      | 1 minute         | 0 minutes        | ✅ Yes   |
| 59      | 1 minute         | 0 minutes        | ✅ Yes   |
| 60      | 1 minute         | 1 minute         | ✅ Yes   |
| 89      | 1 minute         | 1 minute         | ✅ Yes   |
| 90      | 2 minutes        | 1 minute         | ✅ Yes   |

### Field Descriptions
- `time-spend-seconds`: Exact time in seconds (primary field for precision)
- `time-spend`: Time in minutes using `Math.floor()` (no inflation)
- `current_session_duration`: Current active session duration for diagnostics
- `timestamp`: Client-side timestamp for verification and debugging
- `session_start_time`: When the session started (for session-end events)
- `session_end_time`: When the session ended (for session-end events)
- `session_duration_seconds`: Duration of the specific session that ended
- `event_type`: Type of event ("session-end", "session-end-beacon", etc.)
- `session_end_reason`: Why the session ended ("user_inactive", "page_unload", etc.)

## Benefits of the Fix

1. **Exact Time Precision**: No more rounding errors - time is tracked to the exact second
2. **No Time Inflation**: 34 seconds correctly shows as 0 minutes, not 1 minute
3. **Immediate Data Transmission**: Session-end data is sent at the exact moment of inactivity
4. **Session Boundary Tracking**: Clear markers for when sessions start and end
5. **Backward Compatibility**: Existing systems that expect minutes will continue to work
6. **Better Debugging**: Client timestamps help identify timing discrepancies
7. **Consistent Implementation**: All parts of the system now use the same time format
8. **Enhanced Diagnostics**: Current session duration provides additional context
9. **No Time Loss**: Data is captured and sent immediately, preventing any loss due to delays

## Session-End Event Flow

### Normal Session End (User becomes inactive)
1. User becomes inactive (tab blur, visibility change, etc.)
2. `endSession()` is called immediately
3. Session duration is calculated with exact timing
4. `sendSessionEndData()` is called with exact timestamps
5. Data is sent to backend via `fetch()` API
6. Session state is updated locally
7. Data is backed up to localStorage

### Critical Session End (Page unload)
1. Page unload event is triggered
2. Session data is calculated before any delays
3. `sendSessionEndDataViaBeacon()` is called for guaranteed delivery
4. Beacon API ensures data reaches the server even during page unload
5. Session state is updated and backed up

### Example Timeline
```
16:54:30 - User starts session
16:55:00 - User switches tab (becomes inactive)
16:55:00 - endSession() called immediately
16:55:00 - Session-end data sent to backend with exact timing
16:55:00 - Backend receives: session_end_time: 1705123500000
```

## Testing the Fix

### 1. Check Console Logs
Look for these log messages to verify the fix is working:
```
Activity data ready to send: {...}
Formatted data: {time-spend-seconds: 34, time-spend: 0, ...}
Sending immediate session-end data: {...}
Session-end data sent successfully: {...}
```

### 2. Network Tab Verification
In browser DevTools > Network tab, check the API calls to `/activity-log/`:
- Verify `time-spend-seconds` field is present
- Confirm `time-spend` field uses `Math.floor()` (34 seconds = 0 minutes)
- Check that `timestamp` field is included
- Look for session-end events with `event_type: "session-end"`
- Verify `session_start_time` and `session_end_time` are present in session-end events

### 3. Test Cases to Verify
- **34 seconds**: Should show `time-spend: 0` (not 1)
- **59 seconds**: Should show `time-spend: 0` (not 1)
- **60 seconds**: Should show `time-spend: 1`
- **89 seconds**: Should show `time-spend: 1` (not 2)
- **Session End Timing**: Switch tabs and verify immediate API call with exact timing
- **Page Unload**: Close tab and verify beacon API call in Network tab

### 4. Backend Verification
On the backend, you should now receive:
- Exact time data in the `time-spend-seconds` field
- Accurate minutes in the `time-spend` field (no inflation)
- Client timestamps for verification
- User IDs for proper aggregation
- Session-end events with detailed timing information
- Immediate data transmission (no 3-minute delays)

## Migration Notes

### For Backend Developers
- The API now receives both `time-spend-seconds` and `time-spend` fields
- Use `time-spend-seconds` for precise calculations
- The `time-spend` field now uses `Math.floor()` instead of `Math.round()`
- This means partial minutes are no longer inflated
- The `timestamp` field can be used to detect clock skew issues
- New session-end events include detailed session timing information
- Look for `event_type: "session-end"` to identify session boundaries
- Use `session_start_time` and `session_end_time` for precise session analysis

### For Frontend Developers
- Use `createPreciseActivityPayload()` for new implementations
- The original `createActivityPayload()` is maintained for compatibility
- All time calculations should use the utility functions in `userActivitySync.ts`
- Always use `Math.floor()` when converting seconds to minutes for display
- Session-end data is now sent immediately - no need for manual triggers
- Use `sendSessionEndData()` for immediate session-end transmission
- Use `sendSessionEndDataViaBeacon()` for critical exit scenarios

## Future Improvements

1. **Server-Side Validation**: Implement validation of client timestamps vs server time
2. **Time Drift Detection**: Monitor for significant differences between client and server times
3. **Enhanced Diagnostics**: Add more detailed session tracking information
4. **Performance Monitoring**: Track API response times and success rates
5. **Session Analytics**: Use session-end data for detailed user behavior analysis
6. **Real-time Dashboards**: Display live session activity using immediate data transmission

## Troubleshooting

### If Time Still Appears Inaccurate
1. Check browser console for any error messages
2. Verify environment variables (`VITE_API_URL`, `VITE_CLIENT_ID`) are set
3. Check Network tab to see if API calls are being made with correct data
4. Verify the backend is processing the `time-spend-seconds` field
5. Test with known time values (e.g., exactly 34 seconds should show 0 minutes)
6. Check for session-end events in the Network tab when switching tabs

### If Session-End Data is Not Being Sent
1. Verify that session-end API calls appear in Network tab when switching tabs
2. Check console logs for "Sending immediate session-end data" messages
3. Ensure the session duration is greater than 0 (very short sessions are filtered out)
4. Test page unload scenarios to verify beacon API calls
5. Check for any JavaScript errors that might prevent the API calls

### Common Issues
- **Clock Skew**: If client and server times differ significantly, use the `timestamp` field to detect this
- **Session Boundaries**: Ensure current session time is included in total calculations
- **Offline Sync**: Verify offline data includes the same precision as online data
- **Immediate Transmission**: Confirm that session-end data is sent immediately, not during periodic syncs
- **Beacon API**: Verify that beacon calls work during page unload scenarios 