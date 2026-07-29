# Mock Interview Admin Dashboard – Documentation

Comprehensive admin dashboard APIs for monitoring and analyzing student mock interview performance. All endpoints are served under `admin-dashboard/api/` and require admin, superadmin, or course_manager role.

---

## Overview

The Mock Interview Admin Dashboard provides administrators with:
- **Analytics & KPIs**: Overview statistics, score trends, completion rates
- **Interview Management**: List, filter, search, and view detailed interview data
- **Student Reports**: Individual and aggregate student performance analytics
- **Topic Analytics**: Topic and subtopic-level performance breakdowns
- **Data Export**: CSV export functionality for reporting

All endpoints follow the standard admin dashboard pattern:
- Base path: `/admin-dashboard/api/clients/<client_id>/mock-interviews/`
- Authentication: Requires authenticated user with role `admin`, `superadmin`, or `course_manager`
- Course Manager Support: Course managers can only see data for students enrolled in their managed courses

---

## API Endpoints

### Dashboard Overview

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin-dashboard/api/clients/<client_id>/mock-interviews/dashboard/` | Comprehensive analytics dashboard with KPIs, trends, and top performers |

**Query Parameters:**
- `days` (int, optional): Number of days to look back for trends (default: 30)

**Response Structure:**
```json
{
  "overview": {
    "total_interviews": 150,
    "total_unique_students": 45,
    "active_students_in_period": 32,
    "completion_rate": 85.5,
    "status_breakdown": {
      "scheduled": 10,
      "in_progress": 5,
      "completed": 120,
      "cancelled": 15
    }
  },
  "score_statistics": {
    "average_score": 75.5,
    "highest_score": 98.0,
    "lowest_score": 45.0,
    "median_score": 76.0,
    "total_scored_interviews": 120
  },
  "time_statistics": {
    "average_time_minutes": 22.5,
    "total_time_spent_minutes": 2700.0,
    "interviews_with_time_data": 120
  },
  "difficulty_distribution": {
    "Easy": {
      "total": 50,
      "completed": 45,
      "average_score": 82.0
    },
    "Medium": {
      "total": 70,
      "completed": 60,
      "average_score": 75.0
    },
    "Hard": {
      "total": 30,
      "completed": 15,
      "average_score": 68.0
    }
  },
  "topic_breakdown": [
    {
      "topic": "Python",
      "total_interviews": 45,
      "completed_interviews": 40,
      "unique_students": 20,
      "average_score": 78.5
    }
  ],
  "daily_trend": [
    {
      "date": "2024-01-15",
      "created": 5,
      "completed": 4
    }
  ],
  "top_performers": [
    {
      "student_id": 123,
      "student_name": "John Doe",
      "student_email": "john@example.com",
      "interviews_completed": 8,
      "average_score": 92.5,
      "highest_score": 98.0
    }
  ],
  "recent_interviews": [...]
}
```

---

### List All Interviews

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin-dashboard/api/clients/<client_id>/mock-interviews/` | List all mock interviews with filtering, search, sorting, and pagination |

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status: `scheduled`, `in_progress`, `completed`, `cancelled` |
| `difficulty` | string | Filter by difficulty: `Easy`, `Medium`, `Hard` |
| `topic` | string | Filter by topic (partial match, case-insensitive) |
| `student_id` | int | Filter by student profile ID |
| `search` | string | Search by student name, email, title, topic, or subtopic |
| `date_from` | date | Filter interviews created on or after this date (YYYY-MM-DD) |
| `date_to` | date | Filter interviews created on or before this date (YYYY-MM-DD) |
| `sort_by` | string | Sort field: `created_at` (default), `duration`, `student_name`, `difficulty`, `status`, `scheduled_date_time` |
| `sort_order` | string | Sort direction: `asc` or `desc` (default: `desc`) |
| `page` | int | Page number (default: 1) |
| `limit` | int | Items per page (default: 20) |

**Example Request:**
```
GET /admin-dashboard/api/clients/1/mock-interviews/?status=completed&difficulty=Medium&sort_by=created_at&sort_order=desc&page=1&limit=20
```

**Response Structure:**
```json
{
  "interviews": [
    {
      "id": 123,
      "title": "Python - Data Structures Interview",
      "topic": "Python",
      "subtopic": "Data Structures",
      "difficulty": "Medium",
      "status": "completed",
      "duration_minutes": 25,
      "scheduled_date_time": "2024-01-15T10:00:00Z",
      "started_at": "2024-01-15T10:00:00Z",
      "submitted_at": "2024-01-15T10:22:30Z",
      "created_at": "2024-01-14T15:30:00Z",
      "student_name": "John Doe",
      "student_email": "john@example.com",
      "student_id": 456,
      "overall_score": 85.5
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_interviews": 100,
    "limit": 20,
    "has_next": true,
    "has_previous": false
  },
  "filters_applied": {
    "status": "completed",
    "difficulty": "Medium",
    "topic": null,
    "student_id": null,
    "search": null,
    "date_from": null,
    "date_to": null,
    "sort_by": "created_at",
    "sort_order": "desc"
  }
}
```

---

### Interview Detail

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin-dashboard/api/clients/<client_id>/mock-interviews/<interview_id>/` | Get full details of a single mock interview including transcript, questions, grading scheme, and evaluation scores |

**Response Structure:**
```json
{
  "id": 123,
  "title": "Python - Data Structures Interview",
  "topic": "Python",
  "subtopic": "Data Structures",
  "difficulty": "Medium",
  "status": "completed",
  "duration_minutes": 25,
  "scheduled_date_time": "2024-01-15T10:00:00Z",
  "started_at": "2024-01-15T10:00:00Z",
  "submitted_at": "2024-01-15T10:22:30Z",
  "created_at": "2024-01-14T15:30:00Z",
  "updated_at": "2024-01-15T10:22:30Z",
  "student_name": "John Doe",
  "student_email": "john@example.com",
  "student_id": 456,
  "questions_for_interview": [
    {
      "question": "Explain the difference between a list and a tuple in Python.",
      "question_number": 1
    }
  ],
  "grading_scheme": {
    "criteria": {
      "technical_accuracy": 30,
      "communication": 20,
      "problem_solving": 25,
      "code_quality": 25
    }
  },
  "evaluation_score": {
    "overall_score": 85.5,
    "technical_accuracy": 28,
    "communication": 18,
    "problem_solving": 22,
    "code_quality": 23,
    "feedback": "Good understanding of concepts..."
  },
  "interview_transcript": {
    "responses": [
      {
        "question_number": 1,
        "response": "A list is mutable while a tuple is immutable..."
      }
    ]
  },
  "time_taken_minutes": 22.5
}
```

---

### Student List

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin-dashboard/api/clients/<client_id>/mock-interviews/students/` | List all students with their mock interview summary statistics |

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Search by student name or email |
| `sort_by` | string | Sort field: `total_interviews` (default), `average_score`, `completion_rate`, `student_name`, `completed_interviews`, `total_time_spent_minutes` |
| `sort_order` | string | Sort direction: `asc` or `desc` (default: `desc`) |
| `page` | int | Page number (default: 1) |
| `limit` | int | Items per page (default: 20) |
| `min_interviews` | int | Minimum number of interviews required (default: 1) |

**Response Structure:**
```json
{
  "students": [
    {
      "student_id": 456,
      "student_name": "John Doe",
      "student_email": "john@example.com",
      "total_interviews": 8,
      "completed_interviews": 7,
      "in_progress_interviews": 0,
      "scheduled_interviews": 1,
      "cancelled_interviews": 0,
      "average_score": 85.5,
      "highest_score": 95.0,
      "lowest_score": 72.0,
      "total_time_spent_minutes": 157.5,
      "average_time_per_interview_minutes": 22.5,
      "topics_attempted": ["Python", "JavaScript", "Data Structures"],
      "difficulty_distribution": {
        "Easy": 2,
        "Medium": 4,
        "Hard": 2
      },
      "last_interview_date": "2024-01-15T10:22:30Z",
      "completion_rate": 87.5
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 3,
    "total_students": 45,
    "limit": 20,
    "has_next": true,
    "has_previous": false
  }
}
```

---

### Student Detail Report

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin-dashboard/api/clients/<client_id>/mock-interviews/students/<student_id>/` | Detailed performance report for a specific student |

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `include_interviews` | boolean | Include full list of interviews in response (default: `true`) |

**Response Structure:**
```json
{
  "student": {
    "id": 456,
    "name": "John Doe",
    "email": "john@example.com",
    "phone_number": "+1234567890",
    "profile_pic_url": "https://example.com/profile.jpg"
  },
  "summary": {
    "total_interviews": 8,
    "completed_interviews": 7,
    "in_progress_interviews": 0,
    "scheduled_interviews": 1,
    "cancelled_interviews": 0,
    "average_score": 85.5,
    "highest_score": 95.0,
    "lowest_score": 72.0,
    "total_time_spent_minutes": 157.5,
    "average_time_per_interview_minutes": 22.5,
    "completion_rate": 87.5,
    "topics_attempted": ["Python", "JavaScript", "Data Structures"],
    "difficulty_distribution": {
      "Easy": 2,
      "Medium": 4,
      "Hard": 2
    },
    "last_interview_date": "2024-01-15T10:22:30Z"
  },
  "score_trend": [
    {
      "interview_id": 123,
      "title": "Python - Data Structures Interview",
      "topic": "Python",
      "difficulty": "Medium",
      "date": "2024-01-15",
      "score": 85.5
    }
  ],
  "topic_performance": [
    {
      "topic": "Python",
      "total_interviews": 4,
      "completed": 4,
      "average_score": 88.0,
      "highest_score": 95.0,
      "subtopics": ["Data Structures", "OOP", "Algorithms"]
    }
  ],
  "difficulty_performance": {
    "Easy": {
      "total": 2,
      "completed": 2,
      "average_score": 90.0,
      "highest_score": 92.0
    },
    "Medium": {
      "total": 4,
      "completed": 4,
      "average_score": 85.0,
      "highest_score": 90.0
    },
    "Hard": {
      "total": 2,
      "completed": 1,
      "average_score": 75.0,
      "highest_score": 75.0
    }
  },
  "interviews": [...]
}
```

---

### Topic Analytics

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin-dashboard/api/clients/<client_id>/mock-interviews/topics/` | Topic-level analytics with subtopic breakdown and difficulty distribution |

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `sort_by` | string | Sort field: `total` (default), `completed`, `average_score`, `unique_students` |
| `sort_order` | string | Sort direction: `asc` or `desc` (default: `desc`) |

**Response Structure:**
```json
{
  "total_topics": 15,
  "topics": [
    {
      "topic": "Python",
      "total_interviews": 45,
      "completed_interviews": 40,
      "unique_students": 20,
      "average_score": 78.5,
      "highest_score": 98.0,
      "lowest_score": 45.0,
      "difficulty_breakdown": {
        "Easy": 15,
        "Medium": 20,
        "Hard": 10
      },
      "subtopics": [
        {
          "subtopic": "Data Structures",
          "total_interviews": 20,
          "completed": 18,
          "unique_students": 12,
          "average_score": 80.0
        },
        {
          "subtopic": "OOP",
          "total_interviews": 15,
          "completed": 12,
          "unique_students": 10,
          "average_score": 75.0
        }
      ]
    }
  ]
}
```

---

### Export CSV

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin-dashboard/api/clients/<client_id>/mock-interviews/export/` | Export mock interview data as CSV file |

**Query Parameters:**

Same filtering parameters as the list endpoint:
- `status` (string)
- `difficulty` (string)
- `student_id` (int)
- `date_from` (date, YYYY-MM-DD)
- `date_to` (date, YYYY-MM-DD)

**Response:**
- Content-Type: `text/csv`
- Content-Disposition: `attachment; filename="mock_interviews_{client_slug}_{timestamp}.csv"`

**CSV Columns:**
- Interview ID
- Title
- Student Name
- Student Email
- Topic
- Subtopic
- Difficulty
- Status
- Duration (minutes)
- Scheduled Date
- Started At
- Submitted At
- Time Taken (minutes)
- Overall Score
- Created At

**Example Request:**
```
GET /admin-dashboard/api/clients/1/mock-interviews/export/?status=completed&date_from=2024-01-01
```

---

## Authentication & Permissions

All endpoints require:
1. **Authentication**: User must be authenticated (valid JWT token or session)
2. **Role**: User must have one of the following roles for the specified client:
   - `admin`
   - `superadmin`
   - `course_manager`

**Course Manager Restrictions:**
- Course managers can only view data for students enrolled in courses they manage
- If a course manager tries to access data outside their scope, they receive a `403 Forbidden` response

**Error Responses:**
```json
{
  "error": "You do not have permission to view this resource."
}
```
Status: `403 Forbidden`

---

## Data Models

### MockInterview Model Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | int | Primary key |
| `client` | ForeignKey | Reference to Client |
| `student` | ForeignKey | Reference to UserProfile (student) |
| `topic` | string | Interview topic (e.g., "Python") |
| `subtopic` | string | Interview subtopic (e.g., "Data Structures") |
| `difficulty` | string | `Easy`, `Medium`, or `Hard` |
| `title` | string | Auto-generated title |
| `questions_for_interview` | JSON | List of interview questions |
| `grading_scheme` | JSON | Grading criteria and weights |
| `scheduled_date_time` | DateTime | When the interview was scheduled |
| `evaluation_score` | JSON | AI-generated evaluation scores |
| `interview_transcript` | JSON | Student responses |
| `status` | string | `scheduled`, `in_progress`, `completed`, `cancelled` |
| `duration_minutes` | int | Expected duration (5 minutes per question) |
| `started_at` | DateTime | When interview was started |
| `submitted_at` | DateTime | When interview was submitted |
| `created_at` | DateTime | Record creation timestamp |
| `updated_at` | DateTime | Last update timestamp |

### Evaluation Score Structure

The `evaluation_score` JSON field typically contains:
```json
{
  "overall_score": 85.5,
  "technical_accuracy": 28,
  "communication": 18,
  "problem_solving": 22,
  "code_quality": 23,
  "feedback": "Detailed feedback text..."
}
```

---

## Usage Examples

### Example 1: Get Dashboard Overview for Last 7 Days

```bash
curl -X GET \
  "https://api.example.com/admin-dashboard/api/clients/1/mock-interviews/dashboard/?days=7" \
  -H "Authorization: Bearer <token>"
```

### Example 2: List Completed Interviews for a Specific Student

```bash
curl -X GET \
  "https://api.example.com/admin-dashboard/api/clients/1/mock-interviews/?status=completed&student_id=456&sort_by=created_at&sort_order=desc" \
  -H "Authorization: Bearer <token>"
```

### Example 3: Get Student Performance Report

```bash
curl -X GET \
  "https://api.example.com/admin-dashboard/api/clients/1/mock-interviews/students/456/?include_interviews=true" \
  -H "Authorization: Bearer <token>"
```

### Example 4: Export Completed Interviews from Last Month

```bash
curl -X GET \
  "https://api.example.com/admin-dashboard/api/clients/1/mock-interviews/export/?status=completed&date_from=2024-01-01&date_to=2024-01-31" \
  -H "Authorization: Bearer <token>" \
  -o mock_interviews_export.csv
```

### Example 5: Get Topic Analytics Sorted by Average Score

```bash
curl -X GET \
  "https://api.example.com/admin-dashboard/api/clients/1/mock-interviews/topics/?sort_by=average_score&sort_order=desc" \
  -H "Authorization: Bearer <token>"
```

---

## Performance Considerations

### Database Queries

- All list endpoints use `select_related()` for efficient foreign key joins
- Pagination is applied to limit result sets
- Aggregations use Django ORM's `Count()`, `Sum()`, and `aggregate()` for optimal performance

### Caching Recommendations

For high-traffic scenarios, consider caching:
- Dashboard overview data (cache for 5-10 minutes)
- Topic analytics (cache for 15-30 minutes)
- Student list summaries (cache for 5 minutes)

### Pagination Best Practices

- Default limit is 20 items per page
- Maximum recommended limit: 100 items per page
- For large exports, use the CSV export endpoint instead of paginated list

---

## Error Handling

### Common Error Responses

| Status Code | Error | Description |
|-------------|-------|-------------|
| 400 | Bad Request | Invalid query parameters (e.g., invalid date format, invalid status value) |
| 403 | Forbidden | User lacks required permissions or course manager accessing out-of-scope data |
| 404 | Not Found | Client, interview, or student not found |
| 500 | Internal Server Error | Server error (check logs) |

**Example Error Response:**
```json
{
  "error": "Invalid status. Must be one of: scheduled, in_progress, completed, cancelled"
}
```

---

## Integration Notes

### Frontend Integration

1. **Dashboard Widgets**: Use the dashboard endpoint to populate KPI cards and charts
2. **Data Tables**: Use the list endpoint with pagination for interview tables
3. **Student Profiles**: Use the student detail endpoint to show comprehensive student reports
4. **Export Functionality**: Link to the export endpoint for CSV downloads

### Real-time Updates

The APIs return current data from the database. For real-time updates:
- Poll the dashboard endpoint every 30-60 seconds
- Use WebSocket connections if available (not currently implemented)
- Refresh student reports on demand

---

## Testing

### Test Scenarios

1. **Permission Testing**: Verify course managers can only see their students' data
2. **Filtering**: Test all filter combinations
3. **Pagination**: Test edge cases (first page, last page, empty results)
4. **Export**: Verify CSV format and data accuracy
5. **Score Calculations**: Verify average, median, and trend calculations

### Sample Test Data

To test the APIs, ensure you have:
- At least 10-20 mock interviews across different statuses
- Interviews with different difficulty levels
- Multiple students with varying performance
- Interviews across different topics and subtopics
- Completed interviews with evaluation scores

---

## Future Enhancements

Potential improvements for future iterations:

1. **Advanced Filtering**: Date range picker, multiple status/difficulty selection
2. **Custom Reports**: Save and schedule custom report configurations
3. **Email Reports**: Automated email delivery of student reports
4. **Comparison Views**: Compare student performance across topics or time periods
5. **Predictive Analytics**: ML-based performance predictions
6. **Real-time Notifications**: WebSocket updates for new interviews
7. **Bulk Actions**: Bulk status updates, bulk exports
8. **GraphQL API**: More flexible querying for complex frontend needs

---

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| 403 Forbidden | User role not admin/superadmin/course_manager | Verify user role in UserProfile |
| Empty results | Course manager with no managed courses | Assign courses to course manager |
| Missing scores | Interview not completed | Only completed interviews have evaluation scores |
| CSV export fails | Large dataset | Use date filters to limit export size |
| Slow queries | Large dataset without filters | Add date range or status filters |

---

## Related Documentation

- [Mock Interview Student APIs](../mock_interview/views.py) - Student-facing mock interview endpoints
- [Admin Dashboard Core APIs](./admin_dashboard/views.py) - Other admin dashboard endpoints
- [Assessment Admin APIs](./assessment/views.py) - Similar analytics for assessments

---

## Support

For issues or questions:
1. Check the error response message for specific guidance
2. Verify user permissions and role assignments
3. Review database logs for query performance issues
4. Contact the development team for API enhancements

