# API Contract Documentation

This document provides a comprehensive API contract for all endpoints across the AI-Linc backend applications.

**Base URL**: `/` (root)

**Authentication**: Most endpoints require JWT Bearer token authentication unless otherwise specified:

```
Authorization: Bearer <jwt_token>
```

---

## Table of Contents

1. [Accounts API](#accounts-api)
2. [LMS Core API](#lms-core-api)
3. [APIs (Student APIs)](#apis-student-apis)
4. [Activity API](#activity-api)
5. [Admin Dashboard API](#admin-dashboard-api)
6. [Assessment API](#assessment-api)
7. [Payment Gateway API](#payment-gateway-api)
8. [Live Class API](#live-class-api)
9. [Community Forum API](#community-forum-api)
10. [Media Handler API](#media-handler-api)
11. [Mock Interview API](#mock-interview-api)
12. [Jobs API](#jobs-api)

---

## Accounts API

**Base Path**: `/accounts/`

### Authentication & User Management

#### 1. Google Login

- **Endpoint**: `POST /accounts/clients/{client_id}/user/login/google/`
- **Authentication**: Not required
- **Request Body**:

```json
{
  "token": "string" // Google OAuth token
}
```

- **Response** (200 OK):

```json
{
  "access": "string",
  "refresh": "string",
  "user": {
    "id": "integer",
    "email": "string",
    "first_name": "string",
    "last_name": "string"
  }
}
```

#### 2. User Login

- **Endpoint**: `POST /accounts/clients/{client_id}/user/login/`
- **Authentication**: Not required
- **Request Body**:

```json
{
  "email": "string",
  "password": "string"
}
```

- **Response** (200 OK):

```json
{
  "access": "string",
  "refresh": "string",
  "user": {
    "id": "integer",
    "email": "string",
    "first_name": "string",
    "last_name": "string"
  }
}
```

#### 3. User Signup

- **Endpoint**: `POST /accounts/clients/{client_id}/user/signup/`
- **Authentication**: Not required
- **Request Body**:

```json
{
  "first_name": "string",
  "last_name": "string",
  "email": "string",
  "phone": "string",
  "password": "string",
  "confirm_password": "string"
}
```

- **Response** (200 OK):

```json
{
  "detail": "OTP sent to your email"
}
```

#### 4. Verify Email

- **Endpoint**: `POST /accounts/clients/{client_id}/user/verify-email/`
- **Authentication**: Not required
- **Request Body**:

```json
{
  "email": "string",
  "otp": "string"
}
```

- **Response** (201 Created):

```json
{
  "detail": "Account verified and created successfully"
}
```

#### 5. Resend Verification Email

- **Endpoint**: `POST /accounts/clients/{client_id}/user/resend-verification-email/`
- **Authentication**: Not required
- **Request Body**:

```json
{
  "email": "string"
}
```

- **Response** (200 OK):

```json
{
  "detail": "OTP sent to your email"
}
```

#### 6. User Profile

- **Endpoint**: `GET/PUT /accounts/clients/{client_id}/user-profile/`
- **Authentication**: Required
- **Response** (200 OK):

```json
{
  "id": "integer",
  "user_name": "string",
  "profile_pic_url": "string",
  "role": "string"
}
```

#### 7. User Logout

- **Endpoint**: `POST /accounts/clients/{client_id}/user/logout/`
- **Authentication**: Required
- **Request Body**:

```json
{
  "refresh": "string"
}
```

- **Response** (200 OK):

```json
{
  "detail": "Successfully logged out"
}
```

### Client & Features Management

#### 8. List Available Features

- **Endpoint**: `GET /accounts/features/`
- **Authentication**: Not required
- **Response** (200 OK):

```json
[
  {
    "id": "integer",
    "name": "string"
  }
]
```

#### 9. Select Client Features

- **Endpoint**: `POST /accounts/clients/{client_id}/features/select/`
- **Authentication**: Required (Admin)
- **Request Body**:

```json
{
  "feature_ids": ["integer"]
}
```

- **Response** (200 OK):

```json
{
  "detail": "Features updated successfully"
}
```

#### 10. List/Create Clients

- **Endpoint**: `GET/POST /accounts/clients/`
- **Authentication**: Required (Admin)
- **Response** (200 OK):

```json
[
  {
    "id": "integer",
    "name": "string",
    "slug": "string",
    "app_logo_url": "string",
    "app_icon_url": "string",
    "is_active": "boolean",
    "features": [
      {
        "id": "integer",
        "name": "string"
      }
    ],
    "theme_settings": "object",
    "login_img_url": "string",
    "login_logo_url": "string",
    "show_footer": "boolean",
    "pwa_manifest": "object"
  }
]
```

---

## LMS Core API

**Base Path**: `/lms/`

### Course Management

#### 1. List Client Courses

- **Endpoint**: `GET /lms/clients/{client_id}/courses/`
- **Authentication**: Required
- **Response** (200 OK):

```json
[
  {
    "id": "integer",
    "title": "string",
    "description": "string",
    "instructors": [
      {
        "id": "integer",
        "name": "string",
        "bio": "string",
        "profile_pic_url": "string",
        "linkedin": "string"
      }
    ],
    "trusted_by": [
      {
        "id": "integer",
        "name": "string",
        "logo_url": "string"
      }
    ],
    "enrolled_students": {
      "total": "integer",
      "students_profile_pic": ["string"]
    }
  }
]
```

#### 2. Course Detail

- **Endpoint**: `GET /lms/clients/{client_id}/courses/{course_id}/`
- **Authentication**: Required
- **Response** (200 OK):

```json
{
  "id": "integer",
  "title": "string",
  "description": "string",
  "modules": [
    {
      "id": "integer",
      "weekno": "integer",
      "title": "string",
      "completion_percentage": "decimal",
      "submodules": [
        {
          "id": "integer",
          "title": "string",
          "description": "string",
          "order": "integer",
          "video_count": "integer",
          "quiz_count": "integer",
          "article_count": "integer",
          "coding_problem_count": "integer",
          "assignment_count": "integer"
        }
      ]
    }
  ]
}
```

#### 3. Toggle Like/Dislike Course

- **Endpoint**: `POST /lms/clients/{client_id}/courses/{course_id}/toggle-like/`
- **Authentication**: Required
- **Response** (200 OK):

```json
{
  "liked": "boolean",
  "likes_count": "integer"
}
```

#### 4. Course Leaderboard

- **Endpoint**: `GET /lms/clients/{client_id}/courses/{course_id}/leaderboard/`
- **Authentication**: Required
- **Response** (200 OK):

```json
[
  {
    "user": {
      "id": "integer",
      "user_name": "string",
      "profile_pic_url": "string",
      "role": "string"
    },
    "score": "decimal",
    "rank": "integer"
  }
]
```

#### 5. User Course Dashboard

- **Endpoint**: `GET /lms/clients/{client_id}/courses/{course_id}/user-course-dashboard/`
- **Authentication**: Required
- **Response** (200 OK):

```json
{
  "completion_percentage": "decimal",
  "total_modules": "integer",
  "completed_modules": "integer",
  "total_contents": "integer",
  "completed_contents": "integer"
}
```

#### 6. Get SubModule

- **Endpoint**: `GET /lms/clients/{client_id}/courses/{course_id}/sub-module/{submodule_id}/`
- **Authentication**: Required
- **Response** (200 OK):

```json
{
  "id": "integer",
  "title": "string",
  "description": "string",
  "order": "integer",
  "contents": [
    {
      "id": "integer",
      "content_type": "string",
      "content_id": "integer",
      "title": "string",
      "order": "integer",
      "is_completed": "boolean"
    }
  ]
}
```

#### 7. Content Detail

- **Endpoint**: `GET /lms/clients/{client_id}/courses/{course_id}/content/{content_id}/`
- **Authentication**: Required
- **Response** (200 OK):

```json
{
  "id": "integer",
  "content_type": "string",
  "content": {
    // Content varies by type (Article, VideoTutorial, Quiz, Assignment, CodingProblem)
  },
  "is_completed": "boolean",
  "next_content": {
    "id": "integer",
    "content_type": "string"
  },
  "previous_content": {
    "id": "integer",
    "content_type": "string"
  }
}
```

#### 8. Content Past Submissions

- **Endpoint**: `GET /lms/clients/{client_id}/courses/{course_id}/content/{content_id}/past-submissions/`
- **Authentication**: Required
- **Response** (200 OK):

```json
[
  {
    "id": "integer",
    "submitted_at": "datetime",
    "score": "decimal",
    "status": "string"
  }
]
```

#### 9. Add Comment to Content

- **Endpoint**: `POST /lms/clients/{client_id}/courses/{course_id}/content/{content_id}/comment/`
- **Authentication**: Required
- **Request Body**:

```json
{
  "comment": "string"
}
```

- **Response** (201 Created):

```json
{
  "id": "integer",
  "comment": "string",
  "user": {
    "id": "integer",
    "user_name": "string",
    "profile_pic_url": "string"
  },
  "created_at": "datetime"
}
```

#### 10. Enroll User in Course

- **Endpoint**: `POST /lms/clients/{client_id}/courses/{course_id}/enroll/`
- **Authentication**: Required
- **Response** (201 Created):

```json
{
  "detail": "Successfully enrolled in course"
}
```

### Course Operations

#### 11. Duplicate Course

- **Endpoint**: `POST /lms/course-operations/duplicate/`
- **Authentication**: Required (Admin)
- **Request Body**:

```json
{
  "course_id": "integer",
  "client_id": "integer"
}
```

- **Response** (202 Accepted):

```json
{
  "operation_id": "uuid",
  "status": "pending",
  "message": "Course duplication started"
}
```

#### 12. Delete Course

- **Endpoint**: `POST /lms/course-operations/delete/`
- **Authentication**: Required (Admin)
- **Request Body**:

```json
{
  "course_id": "integer",
  "client_id": "integer"
}
```

- **Response** (202 Accepted):

```json
{
  "operation_id": "uuid",
  "status": "pending",
  "message": "Course deletion started"
}
```

#### 13. Bulk Duplicate Courses

- **Endpoint**: `POST /lms/course-operations/bulk-duplicate/`
- **Authentication**: Required (Admin)
- **Request Body**:

```json
{
  "course_ids": ["integer"],
  "client_id": "integer"
}
```

- **Response** (202 Accepted):

```json
{
  "operation_id": "uuid",
  "status": "pending",
  "message": "Bulk course duplication started"
}
```

#### 14. Get Operation Status

- **Endpoint**: `GET /lms/course-operations/{operation_id}/status/`
- **Authentication**: Required
- **Response** (200 OK):

```json
{
  "operation_id": "uuid",
  "status": "string", // pending, processing, completed, failed
  "progress": "decimal",
  "result": "object"
}
```

#### 15. List Course Operations

- **Endpoint**: `GET /lms/course-operations/`
- **Authentication**: Required
- **Query Parameters**:
  - `status` (optional): Filter by status
  - `client_id` (optional): Filter by client
- **Response** (200 OK):

```json
[
  {
    "operation_id": "uuid",
    "operation_type": "string",
    "status": "string",
    "created_at": "datetime"
  }
]
```

---

## APIs (Student APIs)

**Base Path**: `/api/`

### Student Dashboard & Analytics

#### 1. Enrolled Courses

- **Endpoint**: `GET /api/clients/{client_id}/student/enrolled-courses/`
- **Authentication**: Required
- **Response** (200 OK):

```json
[
  {
    "id": "integer",
    "title": "string",
    "description": "string",
    "completion_percentage": "decimal",
    "enrolled_at": "datetime"
  }
]
```

#### 2. Continue Learning Courses

- **Endpoint**: `GET /api/clients/{client_id}/student/continue-learning-courses/`
- **Authentication**: Required
- **Response** (200 OK):

```json
[
  {
    "id": "integer",
    "title": "string",
    "last_accessed_at": "datetime",
    "next_content": {
      "id": "integer",
      "title": "string"
    }
  }
]
```

#### 3. Recommended Courses

- **Endpoint**: `GET /api/clients/{client_id}/student/recommended-courses/`
- **Authentication**: Required
- **Response** (200 OK):

```json
[
  {
    "id": "integer",
    "title": "string",
    "description": "string",
    "reason": "string"
  }
]
```

#### 4. User Activity Heatmap

- **Endpoint**: `GET /api/clients/{client_id}/student/user-activity-heatmap/`
- **Authentication**: Required
- **Query Parameters**:
  - `start_date` (optional): YYYY-MM-DD
  - `end_date` (optional): YYYY-MM-DD
- **Response** (200 OK):

```json
{
  "heatmap_data": [
    {
      "date": "YYYY-MM-DD",
      "count": "integer",
      "level": "integer" // 0-4
    }
  ]
}
```

#### 5. User Daily Time Spent

- **Endpoint**: `GET /api/clients/{client_id}/student/user-daily-time-spent/`
- **Authentication**: Required
- **Query Parameters**:
  - `start_date` (optional): YYYY-MM-DD
  - `end_date` (optional): YYYY-MM-DD
- **Response** (200 OK):

```json
{
  "daily_time": [
    {
      "date": "YYYY-MM-DD",
      "minutes": "integer"
    }
  ],
  "total_minutes": "integer"
}
```

#### 6. Hours Spent Graph

- **Endpoint**: `GET /api/clients/{client_id}/student/hours-spent-graph/`
- **Authentication**: Required
- **Query Parameters**:
  - `period` (optional): "week", "month", "year"
- **Response** (200 OK):

```json
{
  "data": [
    {
      "period": "string",
      "hours": "decimal"
    }
  ]
}
```

#### 7. Daily Progress Leaderboard

- **Endpoint**: `GET /api/clients/{client_id}/student/daily-progress-leaderboard/`
- **Authentication**: Required
- **Query Parameters**:
  - `date` (optional): YYYY-MM-DD
- **Response** (200 OK):

```json
[
  {
    "user": {
      "id": "integer",
      "user_name": "string",
      "profile_pic_url": "string"
    },
    "score": "integer",
    "rank": "integer"
  }
]
```

#### 8. Monthly Streak

- **Endpoint**: `GET /api/clients/{client_id}/student/monthly-streak/`
- **Authentication**: Required
- **Query Parameters**:
  - `month` (optional): YYYY-MM
- **Response** (200 OK):

```json
{
  "current_streak": "integer",
  "longest_streak": "integer",
  "monthly_days": ["integer"] // Array of day numbers with activity
}
```

#### 9. Overall Leaderboard

- **Endpoint**: `GET /api/clients/{client_id}/overall-leaderboard/`
- **Authentication**: Required
- **Query Parameters**:
  - `limit` (optional): integer, default 10
- **Response** (200 OK):

```json
[
  {
    "user": {
      "id": "integer",
      "user_name": "string",
      "profile_pic_url": "string"
    },
    "total_score": "integer",
    "rank": "integer"
  }
]
```

### Workshop & Certificates

#### 10. Workshop Registrations

- **Endpoint**: `GET/POST /api/clients/{client_id}/workshop-registrations/`
- **Authentication**: Required
- **Request Body** (POST):

```json
{
  "workshop_name": "string",
  "workshop_date": "datetime",
  "additional_info": "object"
}
```

- **Response** (200 OK / 201 Created):

```json
{
  "id": "integer",
  "workshop_name": "string",
  "workshop_date": "datetime",
  "status": "string",
  "registered_at": "datetime"
}
```

#### 11. Update Workshop Registration

- **Endpoint**: `PATCH /api/clients/{client_id}/workshop-registrations/{id}/`
- **Authentication**: Required
- **Request Body**:

```json
{
  "status": "string" // e.g., "confirmed", "cancelled"
}
```

- **Response** (200 OK):

```json
{
  "id": "integer",
  "status": "string",
  "updated_at": "datetime"
}
```

#### 12. Workshop Registration Count

- **Endpoint**: `GET /api/clients/{client_id}/workshop-registrations/count/`
- **Authentication**: Required
- **Response** (200 OK):

```json
{
  "total_registrations": "integer",
  "confirmed": "integer",
  "pending": "integer"
}
```

#### 13. Free Cheat Sheet Download

- **Endpoint**: `POST /api/clients/{client_id}/free-cheat-sheet-download/`
- **Authentication**: Required
- **Request Body**:

```json
{
  "cheat_sheet_id": "integer"
}
```

- **Response** (200 OK):

```json
{
  "download_url": "string",
  "expires_at": "datetime"
}
```

#### 14. Get Available Certificates

- **Endpoint**: `GET /api/clients/{client_id}/user-available-certificates/`
- **Authentication**: Required
- **Response** (200 OK):

```json
[
  {
    "id": "integer",
    "course_id": "integer",
    "course_title": "string",
    "certificate_url": "string",
    "issued_at": "datetime"
  }
]
```

### Referral Program

#### 15. List/Create Referral Program

- **Endpoint**: `GET/POST /api/clients/{client_id}/referral-program/`
- **Authentication**: Required
- **Request Body** (POST):

```json
{
  "referral_code": "string",
  "discount_percentage": "decimal"
}
```

- **Response** (200 OK / 201 Created):

```json
{
  "id": "integer",
  "referral_code": "string",
  "discount_percentage": "decimal",
  "usage_count": "integer",
  "created_at": "datetime"
}
```

#### 16. Referral Program Detail

- **Endpoint**: `GET/PUT/DELETE /api/clients/{client_id}/referrals-program/{pk}/`
- **Authentication**: Required
- **Response** (200 OK):

```json
{
  "id": "integer",
  "referral_code": "string",
  "discount_percentage": "decimal",
  "usage_count": "integer"
}
```

### Other

#### 17. Report Issue

- **Endpoint**: `POST /api/clients/{client_id}/report-issue/`
- **Authentication**: Required
- **Request Body**:

```json
{
  "issue_type": "string",
  "description": "string",
  "screenshot_url": "string" // optional
}
```

- **Response** (201 Created):

```json
{
  "id": "integer",
  "status": "string",
  "message": "Issue reported successfully"
}
```

#### 18. Workshop Variables

- **Endpoint**: `GET/POST /api/clients/{client_id}/workshop/variables/`
- **Authentication**: Required
- **Response** (200 OK):

```json
{
  "variables": {
    "key": "value"
  }
}
```

#### 19. Client Info

- **Endpoint**: `GET /api/clients/{client_id}/client-info/`
- **Authentication**: Required
- **Response** (200 OK):

```json
{
  "id": "integer",
  "name": "string",
  "slug": "string",
  "app_logo_url": "string",
  "app_icon_url": "string",
  "theme_settings": "object"
}
```

#### 20. AI Agent

- **Endpoint**: `POST /api/clients/{client_id}/ai-agent/`
- **Authentication**: Required
- **Request Body**:

```json
{
  "message": "string",
  "context": "object" // optional
}
```

- **Response** (200 OK):

```json
{
  "response": "string",
  "suggestions": ["string"]
}
```

---

## Activity API

**Base Path**: `/activity/`

### User Activity Tracking

#### 1. Create User Activity

- **Endpoint**: `POST /activity/clients/{client_id}/courses/{course_id}/content/{content_id}/`
- **Authentication**: Required
- **Request Body**:

```json
{
  "activity_type": "string", // e.g., "view", "complete", "start"
  "metadata": "object" // optional
}
```

- **Response** (201 Created):

```json
{
  "id": "integer",
  "activity_type": "string",
  "created_at": "datetime"
}
```

#### 2. Create Activity Log

- **Endpoint**: `POST /activity/clients/{client_id}/activity-log/`
- **Authentication**: Required
- **Request Body**:

```json
{
  "action": "string",
  "details": "object"
}
```

- **Response** (201 Created):

```json
{
  "id": "integer",
  "action": "string",
  "created_at": "datetime"
}
```

#### 3. Track Time

- **Endpoint**: `POST /activity/clients/{client_id}/track-time/`
- **Authentication**: Required
- **Request Body**:

```json
{
  "content_id": "integer",
  "time_spent_minutes": "integer"
}
```

- **Response** (200 OK):

```json
{
  "total_time_spent": "integer",
  "session_time": "integer"
}
```

### Attendance Management

#### 4. Admin: List/Create Attendance Activities

- **Endpoint**: `GET/POST /activity/clients/{client_id}/admin/attendance-activities/`
- **Authentication**: Required (Admin)
- **Request Body** (POST):

```json
{
  "title": "string",
  "description": "string",
  "scheduled_time": "datetime",
  "duration_minutes": "integer"
}
```

- **Response** (200 OK / 201 Created):

```json
[
  {
    "id": "integer",
    "title": "string",
    "description": "string",
    "scheduled_time": "datetime",
    "duration_minutes": "integer",
    "is_active": "boolean",
    "attendance_count": "integer"
  }
]
```

#### 5. Admin: Attendance Activity Detail

- **Endpoint**: `GET/PUT/DELETE /activity/clients/{client_id}/admin/attendance-activities/{activity_id}/`
- **Authentication**: Required (Admin)
- **Response** (200 OK):

```json
{
  "id": "integer",
  "title": "string",
  "description": "string",
  "scheduled_time": "datetime",
  "duration_minutes": "integer",
  "is_active": "boolean",
  "attendance_count": "integer",
  "attended_students": [
    {
      "id": "integer",
      "user_name": "string",
      "profile_pic_url": "string",
      "marked_at": "datetime"
    }
  ]
}
```

#### 6. Admin: Update Attendance Activity

- **Endpoint**: `PUT /activity/clients/{client_id}/admin/attendance-activities/{activity_id}/update/`
- **Authentication**: Required (Admin)
- **Request Body**:

```json
{
  "title": "string",
  "description": "string",
  "scheduled_time": "datetime",
  "duration_minutes": "integer",
  "is_active": "boolean"
}
```

- **Response** (200 OK):

```json
{
  "id": "integer",
  "title": "string",
  "updated_at": "datetime"
}
```

#### 7. Student: Live Attendance Activities

- **Endpoint**: `GET /activity/clients/{client_id}/student/live-attendance/`
- **Authentication**: Required
- **Response** (200 OK):

```json
[
  {
    "id": "integer",
    "title": "string",
    "description": "string",
    "scheduled_time": "datetime",
    "duration_minutes": "integer",
    "is_active": "boolean",
    "can_mark_attendance": "boolean",
    "has_marked_attendance": "boolean"
  }
]
```

#### 8. Student: Mark Attendance

- **Endpoint**: `POST /activity/clients/{client_id}/student/mark-attendance/{activity_id}/`
- **Authentication**: Required
- **Response** (200 OK):

```json
{
  "id": "integer",
  "activity_id": "integer",
  "marked_at": "datetime",
  "status": "marked"
}
```

---

## Admin Dashboard API

**Base Path**: `/admin-dashboard/api/`

### Course Management

#### 1. List/Create Client Courses

- **Endpoint**: `GET/POST /admin-dashboard/api/clients/{client_id}/courses/`
- **Authentication**: Required (Admin)
- **Request Body** (POST):

```json
{
  "title": "string",
  "description": "string",
  "instructor_ids": ["integer"],
  "is_active": "boolean"
}
```

- **Response** (200 OK / 201 Created):

```json
[
  {
    "id": "integer",
    "title": "string",
    "description": "string",
    "instructors": ["object"],
    "is_active": "boolean"
  }
]
```

#### 2. Client Course Detail

- **Endpoint**: `GET/PUT/DELETE /admin-dashboard/api/clients/{client_id}/courses/{course_id}/`
- **Authentication**: Required (Admin)
- **Response** (200 OK):

```json
{
  "id": "integer",
  "title": "string",
  "description": "string",
  "modules": ["object"],
  "instructors": ["object"]
}
```

#### 3. View Course Details by Course ID

- **Endpoint**: `GET /admin-dashboard/api/clients/{client_id}/courses/{course_id}/view-course-details/`
- **Authentication**: Required (Admin)
- **Response** (200 OK):

```json
{
  "id": "integer",
  "title": "string",
  "full_details": "object"
}
```

### Module Management

#### 4. List/Create Modules

- **Endpoint**: `GET/POST /admin-dashboard/api/clients/{client_id}/courses/{course_id}/modules/`
- **Authentication**: Required (Admin)
- **Request Body** (POST):

```json
{
  "weekno": "integer",
  "title": "string"
}
```

- **Response** (200 OK / 201 Created):

```json
[
  {
    "id": "integer",
    "weekno": "integer",
    "title": "string"
  }
]
```

#### 5. Module Detail

- **Endpoint**: `GET/PUT/DELETE /admin-dashboard/api/clients/{client_id}/courses/{course_id}/modules/{module_id}/`
- **Authentication**: Required (Admin)
- **Response** (200 OK):

```json
{
  "id": "integer",
  "weekno": "integer",
  "title": "string",
  "submodules": ["object"]
}
```

### SubModule Management

#### 6. List/Create SubModules

- **Endpoint**: `GET/POST /admin-dashboard/api/clients/{client_id}/courses/{course_id}/modules/{module_id}/submodules/`
- **Authentication**: Required (Admin)
- **Request Body** (POST):

```json
{
  "title": "string",
  "description": "string",
  "order": "integer"
}
```

- **Response** (200 OK / 201 Created):

```json
[
  {
    "id": "integer",
    "title": "string",
    "description": "string",
    "order": "integer"
  }
]
```

#### 7. SubModule Detail

- **Endpoint**: `GET/PUT/DELETE /admin-dashboard/api/clients/{client_id}/courses/{course_id}/modules/{module_id}/submodules/{submodule_id}/`
- **Authentication**: Required (Admin)
- **Response** (200 OK):

```json
{
  "id": "integer",
  "title": "string",
  "description": "string",
  "order": "integer",
  "contents": ["object"]
}
```

### Content Management

#### 8. List/Create Contents

- **Endpoint**: `GET/POST /admin-dashboard/api/clients/{client_id}/courses/{course_id}/submodules/{submodule_id}/contents/`
- **Authentication**: Required (Admin)
- **Request Body** (POST):

```json
{
  "content_type": "string", // Article, VideoTutorial, Quiz, Assignment, CodingProblem
  "content_id": "integer",
  "order": "integer"
}
```

- **Response** (200 OK / 201 Created):

```json
[
  {
    "id": "integer",
    "content_type": "string",
    "content_id": "integer",
    "order": "integer"
  }
]
```

#### 9. Content Detail

- **Endpoint**: `GET/PUT/DELETE /admin-dashboard/api/clients/{client_id}/courses/{course_id}/submodules/{submodule_id}/contents/{pk}/`
- **Authentication**: Required (Admin)
- **Response** (200 OK):

```json
{
  "id": "integer",
  "content_type": "string",
  "content_id": "integer",
  "order": "integer"
}
```

#### 10. List All Contents

- **Endpoint**: `GET /admin-dashboard/api/clients/{client_id}/contents/`
- **Authentication**: Required (Admin)
- **Query Parameters**:
  - `content_type` (optional): Filter by content type
  - `course_id` (optional): Filter by course
- **Response** (200 OK):

```json
[
  {
    "id": "integer",
    "content_type": "string",
    "content_id": "integer",
    "title": "string"
  }
]
```

#### 11. Content Full Detail

- **Endpoint**: `GET /admin-dashboard/api/clients/{client_id}/contents/{content_id}/`
- **Authentication**: Required (Admin)
- **Response** (200 OK):

```json
{
  "id": "integer",
  "content_type": "string",
  "content": "object", // Full content details based on type
  "submodule": "object",
  "course": "object"
}
```

#### 12. Verify Content

- **Endpoint**: `POST /admin-dashboard/api/clients/{client_id}/contents/{content_id}/verify/`
- **Authentication**: Required (Admin)
- **Response** (200 OK):

```json
{
  "id": "integer",
  "is_verified": "boolean",
  "verified_at": "datetime"
}
```

#### 13. Content Type Count

- **Endpoint**: `GET /admin-dashboard/api/clients/{client_id}/contents/type-count/`
- **Authentication**: Required (Admin)
- **Response** (200 OK):

```json
{
  "Article": "integer",
  "VideoTutorial": "integer",
  "Quiz": "integer",
  "Assignment": "integer",
  "CodingProblem": "integer"
}
```

### MCQ Management

#### 14. List/Create MCQs

- **Endpoint**: `GET/POST /admin-dashboard/api/clients/{client_id}/mcqs/`
- **Authentication**: Required (Admin)
- **Request Body** (POST):

```json
{
  "question": "string",
  "options": ["string"],
  "correct_answer": "integer",
  "explanation": "string"
}
```

- **Response** (200 OK / 201 Created):

```json
[
  {
    "id": "integer",
    "question": "string",
    "options": ["string"],
    "correct_answer": "integer",
    "explanation": "string"
  }
]
```

#### 15. MCQ Detail

- **Endpoint**: `GET/PUT/DELETE /admin-dashboard/api/clients/{client_id}/mcqs/{pk}/`
- **Authentication**: Required (Admin)
- **Response** (200 OK):

```json
{
  "id": "integer",
  "question": "string",
  "options": ["string"],
  "correct_answer": "integer",
  "explanation": "string"
}
```

### Article Management

#### 16. List/Create Articles

- **Endpoint**: `GET/POST /admin-dashboard/api/clients/{client_id}/articles/`
- **Authentication**: Required (Admin)
- **Request Body** (POST):

```json
{
  "title": "string",
  "content": "string",
  "reading_time_minutes": "integer"
}
```

- **Response** (200 OK / 201 Created):

```json
[
  {
    "id": "integer",
    "title": "string",
    "content": "string",
    "reading_time_minutes": "integer"
  }
]
```

#### 17. Article Detail

- **Endpoint**: `GET/PUT/DELETE /admin-dashboard/api/clients/{client_id}/articles/{pk}/`
- **Authentication**: Required (Admin)
- **Response** (200 OK):

```json
{
  "id": "integer",
  "title": "string",
  "content": "string",
  "reading_time_minutes": "integer"
}
```

### Video Tutorial Management

#### 18. List/Create Video Tutorials

- **Endpoint**: `GET/POST /admin-dashboard/api/clients/{client_id}/video-tutorials/`
- **Authentication**: Required (Admin)
- **Request Body** (POST):

```json
{
  "title": "string",
  "video_url": "string",
  "duration_minutes": "integer",
  "description": "string"
}
```

- **Response** (200 OK / 201 Created):

```json
[
  {
    "id": "integer",
    "title": "string",
    "video_url": "string",
    "duration_minutes": "integer",
    "description": "string"
  }
]
```

#### 19. Video Tutorial Detail

- **Endpoint**: `GET/PUT/DELETE /admin-dashboard/api/clients/{client_id}/video-tutorials/{pk}/`
- **Authentication**: Required (Admin)
- **Response** (200 OK):

```json
{
  "id": "integer",
  "title": "string",
  "video_url": "string",
  "duration_minutes": "integer",
  "description": "string"
}
```

### Assignment Management

#### 20. List/Create Assignments

- **Endpoint**: `GET/POST /admin-dashboard/api/clients/{client_id}/assignments/`
- **Authentication**: Required (Admin)
- **Request Body** (POST):

```json
{
  "title": "string",
  "description": "string",
  "instructions": "string",
  "due_date": "datetime",
  "max_marks": "decimal"
}
```

- **Response** (200 OK / 201 Created):

```json
[
  {
    "id": "integer",
    "title": "string",
    "description": "string",
    "instructions": "string",
    "due_date": "datetime",
    "max_marks": "decimal"
  }
]
```

#### 21. Assignment Detail

- **Endpoint**: `GET/PUT/DELETE /admin-dashboard/api/clients/{client_id}/assignments/{pk}/`
- **Authentication**: Required (Admin)
- **Response** (200 OK):

```json
{
  "id": "integer",
  "title": "string",
  "description": "string",
  "instructions": "string",
  "due_date": "datetime",
  "max_marks": "decimal"
}
```

### Coding Problem Management

#### 22. List/Create Coding Problems

- **Endpoint**: `GET/POST /admin-dashboard/api/clients/{client_id}/coding-problems/`
- **Authentication**: Required (Admin)
- **Request Body** (POST):

```json
{
  "title": "string",
  "description": "string",
  "difficulty": "string",
  "test_cases": ["object"],
  "starter_code": "string"
}
```

- **Response** (200 OK / 201 Created):

```json
[
  {
    "id": "integer",
    "title": "string",
    "description": "string",
    "difficulty": "string",
    "test_cases": ["object"],
    "starter_code": "string"
  }
]
```

#### 23. Coding Problem Detail

- **Endpoint**: `GET/PUT/DELETE /admin-dashboard/api/clients/{client_id}/coding-problems/{pk}/`
- **Authentication**: Required (Admin)
- **Response** (200 OK):

```json
{
  "id": "integer",
  "title": "string",
  "description": "string",
  "difficulty": "string",
  "test_cases": ["object"],
  "starter_code": "string"
}
```

### Quiz Management

#### 24. List/Create Quizzes

- **Endpoint**: `GET/POST /admin-dashboard/api/clients/{client_id}/quizzes/`
- **Authentication**: Required (Admin)
- **Request Body** (POST):

```json
{
  "title": "string",
  "description": "string",
  "time_limit_minutes": "integer",
  "mcq_ids": ["integer"]
}
```

- **Response** (200 OK / 201 Created):

```json
[
  {
    "id": "integer",
    "title": "string",
    "description": "string",
    "time_limit_minutes": "integer",
    "mcqs": ["object"]
  }
]
```

#### 25. Quiz Detail

- **Endpoint**: `GET/PUT/DELETE /admin-dashboard/api/clients/{client_id}/quizzes/{pk}/`
- **Authentication**: Required (Admin)
- **Response** (200 OK):

```json
{
  "id": "integer",
  "title": "string",
  "description": "string",
  "time_limit_minutes": "integer",
  "mcqs": ["object"]
}
```

### Assessment Management

#### 26. List/Create Assessments

- **Endpoint**: `GET/POST /admin-dashboard/api/clients/{client_id}/assessments/`
- **Authentication**: Required (Admin)
- **Request Body** (POST):

```json
{
  "title": "string",
  "description": "string",
  "is_active": "boolean",
  "is_paid": "boolean",
  "amount": "decimal"
}
```

- **Response** (200 OK / 201 Created):

```json
[
  {
    "id": "integer",
    "title": "string",
    "description": "string",
    "slug": "string",
    "is_active": "boolean",
    "is_paid": "boolean",
    "amount": "decimal"
  }
]
```

#### 27. List Assessment Submissions

- **Endpoint**: `GET /admin-dashboard/api/clients/{client_id}/assessment-submissions/`
- **Authentication**: Required (Admin)
- **Query Parameters**:
  - `assessment_id` (optional): Filter by assessment
  - `status` (optional): Filter by status
- **Response** (200 OK):

```json
[
  {
    "id": "integer",
    "user": "object",
    "assessment": "object",
    "score": "decimal",
    "status": "string",
    "submitted_at": "datetime"
  }
]
```

### AI & Automation

#### 28. Generate MCQ Questions

- **Endpoint**: `POST /admin-dashboard/api/clients/{client_id}/generate-mcq-questions/`
- **Authentication**: Required (Admin)
- **Request Body**:

```json
{
  "topic": "string",
  "difficulty": "string",
  "count": "integer"
}
```

- **Response** (200 OK):

```json
{
  "mcqs": [
    {
      "question": "string",
      "options": ["string"],
      "correct_answer": "integer",
      "explanation": "string"
    }
  ]
}
```

#### 29. Format Email Body (AI)

- **Endpoint**: `POST /admin-dashboard/api/clients/{client_id}/ai/format-email-body/`
- **Authentication**: Required (Admin)
- **Request Body**:

```json
{
  "email_content": "string",
  "format_style": "string"
}
```

- **Response** (200 OK):

```json
{
  "formatted_content": "string"
}
```

### Email Jobs

#### 30. List/Create Email Jobs

- **Endpoint**: `GET/POST /admin-dashboard/api/clients/{client_id}/email-jobs/`
- **Authentication**: Required (Admin)
- **Request Body** (POST):

```json
{
  "subject": "string",
  "body": "string",
  "recipients": ["string"],
  "scheduled_time": "datetime"
}
```

- **Response** (200 OK / 201 Created):

```json
[
  {
    "task_id": "uuid",
    "subject": "string",
    "status": "string",
    "created_at": "datetime"
  }
]
```

#### 31. Email Job Detail

- **Endpoint**: `GET /admin-dashboard/api/clients/{client_id}/email-jobs/{task_id}/`
- **Authentication**: Required (Admin)
- **Response** (200 OK):

```json
{
  "task_id": "uuid",
  "subject": "string",
  "body": "string",
  "status": "string",
  "recipients_count": "integer",
  "sent_count": "integer",
  "failed_count": "integer",
  "created_at": "datetime",
  "completed_at": "datetime"
}
```

#### 32. Resend Email Job

- **Endpoint**: `POST /admin-dashboard/api/clients/{client_id}/email-resend-jobs/{task_id}/`
- **Authentication**: Required (Admin)
- **Response** (200 OK):

```json
{
  "task_id": "uuid",
  "status": "pending",
  "message": "Email job queued for resending"
}
```

### Analytics & Dashboard

#### 33. Core Admin Dashboard

- **Endpoint**: `GET /admin-dashboard/api/clients/{client_id}/core-admin-dashboard/`
- **Authentication**: Required (Admin)
- **Response** (200 OK):

```json
{
  "total_students": "integer",
  "total_courses": "integer",
  "total_enrollments": "integer",
  "active_students": "integer",
  "recent_activities": ["object"]
}
```

#### 34. Student List

- **Endpoint**: `GET /admin-dashboard/api/clients/{client_id}/manage-students/`
- **Authentication**: Required (Admin)
- **Query Parameters**:
  - `search` (optional): Search by name/email
  - `role` (optional): Filter by role
- **Response** (200 OK):

```json
[
  {
    "id": "integer",
    "user_name": "string",
    "email": "string",
    "profile_pic_url": "string",
    "role": "string",
    "enrolled_courses_count": "integer"
  }
]
```

#### 35. Manage Student

- **Endpoint**: `GET/PUT/DELETE /admin-dashboard/api/clients/{client_id}/manage-student/{student_id}/`
- **Authentication**: Required (Admin)
- **Request Body** (PUT):

```json
{
  "role": "string",
  "is_active": "boolean"
}
```

- **Response** (200 OK):

```json
{
  "id": "integer",
  "user_name": "string",
  "email": "string",
  "role": "string",
  "is_active": "boolean"
}
```

#### 36. Student Activity Analytics

- **Endpoint**: `GET /admin-dashboard/api/clients/{client_id}/student-activity-analytics/`
- **Authentication**: Required (Admin)
- **Query Parameters**:
  - `student_id` (optional): Filter by student
  - `start_date` (optional): YYYY-MM-DD
  - `end_date` (optional): YYYY-MM-DD
- **Response** (200 OK):

```json
{
  "total_activities": "integer",
  "total_time_spent": "integer",
  "completion_rate": "decimal",
  "daily_breakdown": ["object"]
}
```

#### 37. Attendance Analytics

- **Endpoint**: `GET /admin-dashboard/api/clients/{client_id}/attendance-analytics/`
- **Authentication**: Required (Admin)
- **Query Parameters**:
  - `start_date` (optional): YYYY-MM-DD
  - `end_date` (optional): YYYY-MM-DD
- **Response** (200 OK):

```json
{
  "total_activities": "integer",
  "total_attendance": "integer",
  "attendance_rate": "decimal",
  "daily_breakdown": ["object"]
}
```

#### 38. Course Completion Stats

- **Endpoint**: `GET /admin-dashboard/api/clients/{client_id}/course-completion-stats/`
- **Authentication**: Required (Admin)
- **Query Parameters**:
  - `course_id` (optional): Filter by course
- **Response** (200 OK):

```json
{
  "total_courses": "integer",
  "completed_courses": "integer",
  "in_progress_courses": "integer",
  "completion_rate": "decimal",
  "course_breakdown": ["object"]
}
```

---

## Assessment API

**Base Path**: `/assessment/api/`

### Assessment Management

#### 1. Active Assessments

- **Endpoint**: `GET /assessment/api/client/{client_id}/active-assessments/`
- **Authentication**: Required
- **Response** (200 OK):

```json
[
  {
    "id": "integer",
    "title": "string",
    "description": "string",
    "slug": "string",
    "is_paid": "boolean",
    "amount": "decimal",
    "has_attempted": "boolean"
  }
]
```

#### 2. Assessment Detail by Slug

- **Endpoint**: `GET /assessment/api/client/{client_id}/assessment-details/{assessment_id}/`
- **Authentication**: Required
- **Response** (200 OK):

```json
{
  "id": "integer",
  "title": "string",
  "description": "string",
  "slug": "string",
  "is_paid": "boolean",
  "amount": "decimal",
  "sections": ["object"]
}
```

#### 3. Start Assessment

- **Endpoint**: `GET /assessment/api/client/{client_id}/start-assessment/{assessment_id}/`
- **Authentication**: Required
- **Response** (200 OK):

```json
{
  "assessment": {
    "id": "integer",
    "title": "string",
    "slug": "string",
    "sections": [
      {
        "section_type": "string",
        "questions": ["object"]
      }
    ]
  },
  "submission": {
    "id": "integer",
    "status": "string",
    "started_at": "datetime"
  }
}
```

#### 4. Save Assessment Submission

- **Endpoint**: `POST/PUT /assessment/api/client/{client_id}/assessment-submission/{assessment_id}/`
- **Authentication**: Required
- **Request Body**:

```json
{
  "response_sheet": {
    "section_id": {
      "question_id": "answer"
    },
    "metadata": {}
  }
}
```

- **Response** (200 OK):

```json
{
  "response_sheet": "object",
  "status": "in_progress"
}
```

#### 5. Final Submit Assessment

- **Endpoint**: `POST /assessment/api/client/{client_id}/assessment-submission/{assessment_id}/final/`
- **Authentication**: Required
- **Response** (200 OK):

```json
{
  "id": "integer",
  "score": "decimal",
  "offered_scholarship_percentage": "decimal",
  "status": "submitted",
  "submitted_at": "datetime"
}
```

#### 6. Redeem Scholarship

- **Endpoint**: `POST /assessment/api/client/{client_id}/redeem-scholarship/{assessment_id}/`
- **Authentication**: Required
- **Request Body**:

```json
{
  "referral_code": "string" // optional
}
```

- **Response** (200 OK):

```json
{
  "scholarship_percentage": "decimal",
  "referral_code": "string",
  "message": "Scholarship redeemed successfully"
}
```

#### 7. Scholarship Assessment Status

- **Endpoint**: `GET /assessment/api/client/{client_id}/scholarship-assessment-status/{assessment_id}/`
- **Authentication**: Required
- **Response** (200 OK):

```json
{
  "has_submitted": "boolean",
  "score": "decimal",
  "offered_scholarship_percentage": "decimal",
  "is_redeemed": "boolean",
  "referral_code": "string"
}
```

#### 8. Program Payment Status

- **Endpoint**: `GET /assessment/api/client/{client_id}/payment-status/{program_id}/`
- **Authentication**: Required
- **Response** (200 OK):

```json
{
  "program_id": "string",
  "is_paid": "boolean",
  "transaction_id": "string",
  "paid_at": "datetime"
}
```

#### 9. Attempted Assessments

- **Endpoint**: `GET /assessment/api/client/{client_id}/attempted-assessments/`
- **Authentication**: Required
- **Response** (200 OK):

```json
[
  {
    "id": "integer",
    "assessment": {
      "id": "integer",
      "title": "string",
      "slug": "string"
    },
    "score": "decimal",
    "status": "string",
    "submitted_at": "datetime"
  }
]
```

---

## Payment Gateway API

**Base Path**: `/payment-gateway/api/`

### Payment Management

#### 1. Create Order

- **Endpoint**: `POST /payment-gateway/api/clients/{client_id}/create-order/`
- **Authentication**: Required
- **Request Body**:

```json
{
  "amount": "decimal",
  "currency": "string", // default: "INR"
  "type_id": "string", // assessment slug, course id, etc.
  "payment_type": "string", // ASSESSMENT, COURSE, etc.
  "notes": "object" // optional
}
```

- **Response** (201 Created):

```json
{
  "order_id": "string",
  "amount": "decimal",
  "currency": "string",
  "key": "string", // Razorpay key
  "name": "string",
  "description": "string",
  "prefill": {
    "name": "string",
    "email": "string",
    "contact": "string"
  }
}
```

#### 2. Verify Payment

- **Endpoint**: `POST /payment-gateway/api/clients/{client_id}/verify-payment/`
- **Authentication**: Required
- **Request Body**:

```json
{
  "razorpay_order_id": "string",
  "razorpay_payment_id": "string",
  "razorpay_signature": "string"
}
```

- **Response** (200 OK):

```json
{
  "transaction_id": "string",
  "status": "VERIFIED",
  "amount": "decimal",
  "payment_id": "string",
  "order_id": "string",
  "message": "Payment verified successfully"
}
```

---

## Live Class API

**Base Path**: `/live-class/api/`

### Live Class Management

#### 1. List Live Classes

- **Endpoint**: `GET /live-class/api/clients/{client_id}/sessions/`
- **Authentication**: Required
- **Query Parameters**:
  - `status` (optional): Filter by status
  - `upcoming` (optional): boolean
- **Response** (200 OK):

```json
[
  {
    "id": "integer",
    "title": "string",
    "description": "string",
    "scheduled_time": "datetime",
    "duration_minutes": "integer",
    "meeting_link": "string",
    "status": "string",
    "instructor": "object"
  }
]
```

#### 2. Create Live Class

- **Endpoint**: `POST /live-class/api/clients/{client_id}/sessions/create/`
- **Authentication**: Required (Admin/Instructor)
- **Request Body**:

```json
{
  "title": "string",
  "description": "string",
  "scheduled_time": "datetime",
  "duration_minutes": "integer",
  "meeting_link": "string",
  "instructor_id": "integer"
}
```

- **Response** (201 Created):

```json
{
  "id": "integer",
  "title": "string",
  "scheduled_time": "datetime",
  "meeting_link": "string",
  "status": "scheduled"
}
```

#### 3. Update Live Class

- **Endpoint**: `PUT /live-class/api/clients/{client_id}/sessions/{class_id}/update/`
- **Authentication**: Required (Admin/Instructor)
- **Request Body**:

```json
{
  "title": "string",
  "description": "string",
  "scheduled_time": "datetime",
  "duration_minutes": "integer",
  "meeting_link": "string",
  "status": "string"
}
```

- **Response** (200 OK):

```json
{
  "id": "integer",
  "title": "string",
  "updated_at": "datetime"
}
```

---

## Community Forum API

**Base Path**: `/community-forum/api/`

### Thread Management

#### 1. List/Create Threads

- **Endpoint**: `GET/POST /community-forum/api/clients/{client_id}/threads/`
- **Authentication**: Required
- **Request Body** (POST):

```json
{
  "title": "string",
  "body": "string",
  "tag_ids": ["integer"]
}
```

- **Response** (200 OK / 201 Created):

```json
[
  {
    "id": "integer",
    "title": "string",
    "body": "string",
    "author": {
      "id": "integer",
      "user_name": "string",
      "name": "string",
      "profile_pic_url": "string",
      "role": "string"
    },
    "tags": [
      {
        "id": "integer",
        "name": "string"
      }
    ],
    "upvotes": "integer",
    "downvotes": "integer",
    "bookmarks_count": "integer",
    "comments_count": "integer",
    "created_at": "datetime",
    "updated_at": "datetime"
  }
]
```

#### 2. Thread Detail

- **Endpoint**: `GET/PUT/DELETE /community-forum/api/clients/{client_id}/threads/{thread_id}/`
- **Authentication**: Required
- **Response** (200 OK):

```json
{
  "id": "integer",
  "title": "string",
  "body": "string",
  "author": "object",
  "tags": ["object"],
  "upvotes": "integer",
  "downvotes": "integer",
  "bookmarks_count": "integer",
  "comments_count": "integer",
  "comments": [
    {
      "id": "integer",
      "body": "string",
      "author": "object",
      "upvotes": "integer",
      "downvotes": "integer",
      "replies": ["object"],
      "created_at": "datetime"
    }
  ],
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Comment Management

#### 3. List/Create Comments

- **Endpoint**: `GET/POST /community-forum/api/clients/{client_id}/threads/{thread_id}/comments/`
- **Authentication**: Required
- **Request Body** (POST):

```json
{
  "body": "string",
  "parent_id": "integer" // optional, for replies
}
```

- **Response** (200 OK / 201 Created):

```json
[
  {
    "id": "integer",
    "body": "string",
    "author": "object",
    "parent": "integer",
    "upvotes": "integer",
    "downvotes": "integer",
    "replies": ["object"],
    "created_at": "datetime",
    "updated_at": "datetime"
  }
]
```

#### 4. Comment Detail

- **Endpoint**: `GET/PUT/DELETE /community-forum/api/clients/{client_id}/threads/{thread_id}/comments/{comment_id}/`
- **Authentication**: Required
- **Response** (200 OK):

```json
{
  "id": "integer",
  "body": "string",
  "author": "object",
  "parent": "integer",
  "upvotes": "integer",
  "downvotes": "integer",
  "replies": ["object"],
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Voting & Bookmarks

#### 5. Vote on Thread

- **Endpoint**: `POST /community-forum/api/clients/{client_id}/threads/{thread_id}/vote/`
- **Authentication**: Required
- **Request Body**:

```json
{
  "vote_type": "string" // "upvote" or "downvote"
}
```

- **Response** (200 OK):

```json
{
  "id": "integer",
  "vote_type": "string",
  "message": "Vote recorded"
}
```

#### 6. Vote on Comment

- **Endpoint**: `POST /community-forum/api/clients/{client_id}/threads/{thread_id}/comments/{comment_id}/vote/`
- **Authentication**: Required
- **Request Body**:

```json
{
  "vote_type": "string" // "upvote" or "downvote"
}
```

- **Response** (200 OK):

```json
{
  "id": "integer",
  "vote_type": "string",
  "message": "Vote recorded"
}
```

#### 7. Bookmark Thread

- **Endpoint**: `POST /community-forum/api/clients/{client_id}/threads/{thread_id}/bookmark/`
- **Authentication**: Required
- **Response** (200 OK):

```json
{
  "id": "integer",
  "message": "Thread bookmarked"
}
```

### Tags

#### 8. List Tags

- **Endpoint**: `GET /community-forum/api/clients/{client_id}/tags/`
- **Authentication**: Required
- **Response** (200 OK):

```json
[
  {
    "id": "integer",
    "name": "string"
  }
]
```

---

## Media Handler API

**Base Path**: `/images/`

### Image Management

#### 1. Serve Image

- **Endpoint**: `GET /images/{folder_name}/{image_name}`
- **Authentication**: Not required (or configurable)
- **Response**: Image file (200 OK)

#### 2. List Images in Folder

- **Endpoint**: `GET /images/folder/{folder_name}/`
- **Authentication**: Required (Admin)
- **Response** (200 OK):

```json
{
  "folder_name": "string",
  "images": [
    {
      "name": "string",
      "url": "string",
      "size": "integer",
      "created_at": "datetime"
    }
  ]
}
```

#### 3. List All Folders

- **Endpoint**: `GET /images/folders/`
- **Authentication**: Required (Admin)
- **Response** (200 OK):

```json
{
  "folders": [
    {
      "name": "string",
      "image_count": "integer"
    }
  ]
}
```

---

## Mock Interview API

**Base Path**: `/mock-interview/api/`

### Mock Interview Management

#### 1. List/Create Mock Interviews

- **Endpoint**: `GET/POST /mock-interview/api/clients/{client_id}/mock-interviews/`
- **Authentication**: Required
- **Request Body** (POST):

```json
{
  "job_role": "string",
  "experience_level": "string",
  "interview_type": "string"
}
```

- **Response** (200 OK / 201 Created):

```json
[
  {
    "id": "integer",
    "job_role": "string",
    "experience_level": "string",
    "interview_type": "string",
    "status": "string",
    "created_at": "datetime"
  }
]
```

#### 2. Get Mock Interview Detail

- **Endpoint**: `GET /mock-interview/api/clients/{client_id}/mock-interviews/{interview_id}/`
- **Authentication**: Required
- **Response** (200 OK):

```json
{
  "id": "integer",
  "job_role": "string",
  "experience_level": "string",
  "interview_type": "string",
  "status": "string",
  "questions": ["object"],
  "created_at": "datetime"
}
```

#### 3. Start Mock Interview

- **Endpoint**: `POST /mock-interview/api/clients/{client_id}/mock-interviews/{interview_id}/start/`
- **Authentication**: Required
- **Response** (200 OK):

```json
{
  "id": "integer",
  "status": "in_progress",
  "started_at": "datetime",
  "questions": [
    {
      "id": "integer",
      "question": "string",
      "type": "string"
    }
  ]
}
```

#### 4. Submit Mock Interview

- **Endpoint**: `POST /mock-interview/api/clients/{client_id}/mock-interviews/{interview_id}/submit/`
- **Authentication**: Required
- **Request Body**:

```json
{
  "responses": [
    {
      "question_id": "integer",
      "answer": "string",
      "audio_url": "string" // optional
    }
  ]
}
```

- **Response** (200 OK):

```json
{
  "id": "integer",
  "status": "completed",
  "score": "decimal",
  "feedback": "string",
  "submitted_at": "datetime"
}
```

---

## Jobs API

**Base Path**: `/jobs/`

### Job Listings

#### 1. Get Jobs

- **Endpoint**: `GET /jobs/api/getjobs/`
- **Authentication**: Required
- **Query Parameters**:
  - `location` (optional): Filter by location
  - `job_type` (optional): Filter by job type
  - `search` (optional): Search term
- **Response** (200 OK):

```json
[
  {
    "id": "integer",
    "title": "string",
    "company": "string",
    "location": "string",
    "job_type": "string",
    "description": "string",
    "requirements": ["string"],
    "posted_at": "datetime",
    "application_url": "string"
  }
]
```

---

## Common Error Responses

### 400 Bad Request

```json
{
  "detail": "Error message describing what went wrong",
  "field_name": ["Error message for specific field"]
}
```

### 401 Unauthorized

```json
{
  "detail": "Authentication credentials were not provided."
}
```

### 403 Forbidden

```json
{
  "detail": "You do not have permission to perform this action."
}
```

### 404 Not Found

```json
{
  "detail": "Not found."
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal server error message"
}
```

---

## Authentication

Most endpoints require JWT Bearer token authentication. To obtain a token:

1. **Login**: `POST /accounts/clients/{client_id}/user/login/`
2. **Use the access token** in subsequent requests:
   ```
   Authorization: Bearer <access_token>
   ```
3. **Refresh token** when access token expires:
   ```
   POST /accounts/token/refresh/
   Body: { "refresh": "<refresh_token>" }
   ```

---

## Notes

- All datetime fields are in ISO 8601 format: `YYYY-MM-DDTHH:MM:SSZ`
- All decimal fields support up to 2 decimal places unless otherwise specified
- Pagination may be implemented for list endpoints (check response headers for pagination info)
- Rate limiting may be applied to certain endpoints
- File uploads use multipart/form-data encoding
- Query parameters are case-sensitive

---

## Version History

- **v1.0** - Initial API contract documentation
- Generated: 2024
