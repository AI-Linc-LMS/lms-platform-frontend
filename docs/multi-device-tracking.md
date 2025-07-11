# Multi-Device and Multi-Browser User Activity Tracking

This document explains how our application handles user activity tracking across multiple devices and browsers using a **session-only approach** that ensures accurate cumulative time tracking.

## Core Implementation

We've implemented a robust system to track user activity across different devices and browsers, ensuring accurate time tracking without double-counting or data loss. The key innovation is that **each device only sends its own session time**, allowing the backend to handle proper aggregation.

### 1. Session-Only Data Transmission

Instead of sending cumulative time from each device, we now send only the current session's time:

- Each device tracks its own session time independently
- When a session ends, only that session's duration is sent to the backend
- The backend aggregates all session times per user to calculate total time
- This prevents the edge case where multiple devices would reset their cumulative time to 0

```typescript
// NEW APPROACH: Session-only data (simplified)
const sessionData = {
  "time-spend-seconds": sessionDuration, // Only current session time
  "session_id": "unique-session-id",
  "user_id": "user123",
  "session_only": true // Flag indicating session-only data
};
```

### 2. Session Identification

Every device/browser creates a unique session ID when a user logs in:

- We use the `uuid` package to generate a unique identifier
- The session ID is stored in the browser's localStorage
- All activity data sent to the backend includes this session ID
- The session ID persists until the browser's localStorage is cleared

```typescript
// src/utils/deviceIdentifier.ts
export const getSessionId = (): string => {
  let sessionId = localStorage.getItem('SESSION_ID_KEY');
  
  if (!sessionId) {
    sessionId = uuidv4();
    localStorage.setItem('SESSION_ID_KEY', sessionId);
  }
  
  return sessionId;
};
```

### 3. Device Fingerprinting

We collect non-invasive device information to help identify the source of each activity log:

- Browser type (Chrome, Firefox, Safari, etc.)
- Operating system (Windows, macOS, iOS, Android, etc.)
- Device type (desktop, mobile, tablet)

```typescript
// src/utils/deviceIdentifier.ts
export const getDeviceInfo = (): { 
  browser: string;
  os: string;
  deviceType: string;
} => {
  // Device detection logic using navigator.userAgent
  // ...
}
```

### 4. Backend Aggregation Strategy

The backend API now handles cumulative time calculation:

- **Session Data Collection**: Each device sends only its session time
- **User-Based Aggregation**: All sessions are grouped by user ID
- **Time Calculation**: Backend sums all session times for each user per day
- **Duplicate Prevention**: Session IDs prevent double-counting of the same session

## API Payload Format

### Simplified Session-Only Payload
```json
{
  "time-spend-seconds": 1800,
  "session_id": "session-a83b4aaf-f13c-44bd-8b99-f1eb6843b4fc",
  "user_id": "7d771f46-1dc3-412e-b866-22d0936e59f8",
  "session_only": true
}
```

### Legacy Payload (for backward compatibility)
```json
{
  "time-spend-seconds": 1800,
  "session_id": "session-a83b4aaf-f13c-44bd-8b99-f1eb6843b4fc", 
  "user_id": "7d771f46-1dc3-412e-b866-22d0936e59f8",
  "session_only": false
}
```

## How It Works in Practice

Here's what happens when a user uses multiple devices:

1. **User logs in on laptop**: 
   - A session ID is generated for the laptop
   - Activity is tracked with this session ID
   - When the session ends, only the laptop's session time is sent

2. **User then logs in on mobile**:
   - A different session ID is generated for the mobile device
   - Activity is tracked independently from the laptop
   - When the mobile session ends, only the mobile's session time is sent

3. **Backend aggregation**:
   - The backend receives session data from both devices
   - It aggregates all session times for the user
   - Total time = laptop session + mobile session (no double-counting)

4. **Handling the edge case**:
   - **Problem solved**: Each device only sends its own session time
   - **No more reset issues**: Devices don't need to track cumulative time
   - **Accurate totals**: Backend handles all time aggregation
   - **Multi-device support**: Works seamlessly across unlimited devices

## Event Types

The system now supports different event types:

- **session-end**: Sent when a session ends normally (user becomes inactive)
- **session-end-beacon**: Sent when a session ends due to page unload
- **session-update**: Sent during periodic updates while session is active
- **legacy-cumulative**: For backward compatibility with old data format

## Advantages of Session-Only Approach

### 1. Solves Multi-Device Edge Case
- **Before**: Each device tracked cumulative time, causing issues when users switched devices
- **After**: Each device only tracks its own session, backend handles aggregation

### 2. Eliminates Reset Conflicts
- **Before**: Multiple devices could reset their cumulative time to 0 simultaneously
- **After**: No cumulative time tracking on frontend, no reset conflicts

### 3. Improved Accuracy
- **Before**: Risk of double-counting or losing time during device switches
- **After**: Each session is counted exactly once, no matter how many devices

### 4. Better Scalability
- **Before**: Complex frontend logic to handle multiple devices
- **After**: Simple session tracking, complex aggregation handled by backend

### 5. Easier Debugging
- **Before**: Hard to track where time discrepancies came from
- **After**: Clear audit trail of individual sessions per device

## Implementation Details

### Frontend Changes
- Updated `sendSessionEndData()` to send only session time
- Updated `sendPeriodicSessionUpdate()` for session-only updates
- Modified periodic sync to send session updates instead of cumulative time
- Added backward compatibility for legacy cumulative data

### Backend Requirements
The backend should:
1. Accept session-only data with `session_only: true` flag
2. Aggregate all sessions per user per day
3. Handle different event types appropriately
4. Maintain session deduplication using session IDs

### Migration Strategy
- New session-only data is sent with `session_only: true` flag
- Legacy cumulative data is still supported for backward compatibility
- Gradual migration as users' browsers update to new version
- Backend can differentiate between old and new data formats

## Pros and Cons of Our Architecture

### Pros

1. **Accurate Multi-Device Tracking**: Sessions are tracked independently on each device, with backend handling proper aggregation.

2. **Eliminates Edge Cases**: No more issues with cumulative time resets or device switching.

3. **Resilient to Network Issues**: The system gracefully handles offline scenarios by storing session data locally.

4. **Privacy-Friendly Fingerprinting**: Our device identification collects only non-invasive, non-personally identifiable information.

5. **Scalable Architecture**: Backend aggregation scales better than frontend cumulative tracking.

6. **Clear Audit Trail**: Each session is tracked individually, making debugging easier.

### Cons

1. **Backend Complexity**: Requires more sophisticated backend logic for time aggregation.

2. **Migration Period**: During transition, backend must handle both old and new data formats.

3. **Dependency on Backend**: Frontend can no longer display accurate total time without backend API call.

## Testing the New Implementation

### 1. Multi-Device Test
1. Log in on Device A, use for 10 minutes
2. Log in on Device B, use for 5 minutes  
3. Check that backend shows 15 minutes total (not 10 + 5 + any duplicates)

### 2. Session Switching Test
1. Log in on Device A, use for 5 minutes
2. Switch to Device B, use for 3 minutes
3. Return to Device A, use for 2 minutes
4. Check that backend shows 10 minutes total (5 + 3 + 2)

### 3. Network Failure Test
1. Start session on Device A
2. Disconnect network mid-session
3. Reconnect network
4. Check that session time is properly recorded

### 4. Page Unload Test
1. Start session on Device A
2. Close browser tab abruptly
3. Check that session-end data was sent via beacon API 