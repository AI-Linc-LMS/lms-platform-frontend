# User Profile API Documentation


## Data Structures

### UserProfile

The main user profile data structure containing all user information.

```typescript
interface UserProfile {
  // Required Fields
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  profile_picture: string;  // URL to profile picture
  phone_number: string;
  bio: string;
  
  // Social Links
  social_links: {
    github: string;
    linkedin: string;
  };
  
  // Optional Basic Fields
  date_of_birth: string | null;  // Format: YYYY-MM-DD
  role?: string;  // e.g., "Student", "Instructor"
  headline?: string;  // Professional headline (max 120 characters)
  cover_photo_url?: string;  // URL to cover photo
  
  // Education Fields
  college_name?: string;
  degree_type?: string;  // B.Tech, BCA, B.Sc, MCA, M.Tech, Other
  branch?: string;  // Branch/Major
  graduation_year?: string;  // Format: YYYY
  
  // Location
  city?: string;
  state?: string;
  
  // External Profiles
  portfolio_website_url?: string;
  leetcode_url?: string;
  hackerrank_url?: string;
  kaggle_url?: string;
  medium_url?: string;
  
  // Array Fields
  skills?: Skill[];
  projects?: Project[];
  experience?: Experience[];
  education?: Education[];
  certifications?: Certification[];
  achievements?: Achievement[];
}
```

### Skill

```typescript
interface Skill {
  id?: string;  // UUID or unique identifier
  name: string;  // Skill name (e.g., "React", "JavaScript")
}
```

### Project

```typescript
interface Project {
  id?: string;  // UUID or unique identifier
  name: string;  // Project name
  description: string;  // Project description
  technologies: string[];  // Array of technology names
  url?: string;  // Project URL
  start_date?: string;  // Format: YYYY-MM
  end_date?: string;  // Format: YYYY-MM
  current?: boolean;  // Is this an ongoing project?
}
```

### Experience

```typescript
interface Experience {
  id?: string;  // UUID or unique identifier
  company: string;  // Company name
  position: string;  // Job title/position
  location?: string;  // Work location
  start_date: string;  // Format: YYYY-MM (required)
  end_date?: string;  // Format: YYYY-MM (null if current)
  current: boolean;  // Is this the current position?
  description?: string;  // Job description
}
```

### Education

```typescript
interface Education {
  id?: string;  // UUID or unique identifier
  institution: string;  // School/University name
  degree: string;  // Degree name (e.g., "Bachelor of Technology")
  field_of_study?: string;  // Field of study
  start_date?: string;  // Format: YYYY-MM
  end_date?: string;  // Format: YYYY-MM
  gpa?: string;  // GPA (e.g., "3.8/4.0")
  description?: string;  // Additional details
}
```

### Certification

```typescript
interface Certification {
  id?: string;  // UUID or unique identifier
  name: string;  // Certification name
  issuing_organization: string;  // Organization that issued the certification
  issue_date: string;  // Format: YYYY-MM (required)
  expiration_date?: string;  // Format: YYYY-MM
  credential_id?: string;  // Credential ID/Number
  credential_url?: string;  // URL to verify the certification
}
```

### Achievement

```typescript
interface Achievement {
  id?: string;  // UUID or unique identifier
  title: string;  // Achievement title
  description?: string;  // Achievement description
  date?: string;  // Format: YYYY-MM-DD
  organization?: string;  // Organization that recognized the achievement
}
```

---

## Endpoints

### 1. Get User Profile

Retrieves the complete user profile for the authenticated user.

**Endpoint:**
```
GET /accounts/clients/{clientId}/user-profile/
```

**Request:**
- Method: `GET`
- Headers: `Authorization: Bearer <token>`
- Path Parameters:
  - `clientId` (string, required): Client/Organization ID

**Response:**
- Status: `200 OK`
- Body: `UserProfile` object

**Example Response:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "username": "johndoe",
  "profile_picture": "https://example.com/profile.jpg",
  "phone_number": "+1234567890",
  "bio": "Software engineer passionate about web development",
  "social_links": {
    "github": "johndoe",
    "linkedin": "johndoe"
  },
  "date_of_birth": "1995-05-15",
  "role": "Student",
  "headline": "Software Engineer | Full Stack Developer",
  "cover_photo_url": "https://example.com/cover.jpg",
  "college_name": "University of Technology",
  "degree_type": "B.Tech",
  "branch": "Computer Science",
  "graduation_year": "2020",
  "city": "New York",
  "state": "NY",
  "portfolio_website_url": "https://johndoe.dev",
  "leetcode_url": "https://leetcode.com/johndoe",
  "hackerrank_url": "https://www.hackerrank.com/johndoe",
  "kaggle_url": "https://www.kaggle.com/johndoe",
  "medium_url": "https://medium.com/@johndoe",
  "skills": [
    {
      "id": "skill-1",
      "name": "React"
    },
    {
      "id": "skill-2",
      "name": "JavaScript"
    }
  ],
  "projects": [
    {
      "id": "project-1",
      "name": "E-Commerce Platform",
      "description": "Full-stack e-commerce application",
      "technologies": ["React", "Node.js", "MongoDB"],
      "url": "https://github.com/johndoe/ecommerce",
      "start_date": "2023-01",
      "end_date": "2023-06",
      "current": false
    }
  ],
  "experience": [
    {
      "id": "exp-1",
      "company": "Tech Corp",
      "position": "Software Engineer",
      "location": "San Francisco, CA",
      "start_date": "2020-07",
      "end_date": "2023-12",
      "current": false,
      "description": "Developed and maintained web applications"
    }
  ],
  "education": [
    {
      "id": "edu-1",
      "institution": "University of Technology",
      "degree": "Bachelor of Technology",
      "field_of_study": "Computer Science",
      "start_date": "2016-09",
      "end_date": "2020-05",
      "gpa": "3.8/4.0",
      "description": "Focused on software engineering and web development"
    }
  ],
  "certifications": [
    {
      "id": "cert-1",
      "name": "AWS Certified Solutions Architect",
      "issuing_organization": "Amazon Web Services",
      "issue_date": "2022-03",
      "expiration_date": "2025-03",
      "credential_id": "AWS-123456",
      "credential_url": "https://aws.amazon.com/verification"
    }
  ],
  "achievements": [
    {
      "id": "ach-1",
      "title": "Hackathon Winner",
      "description": "First place in regional coding competition",
      "date": "2021-08-15",
      "organization": "Tech Community"
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing authentication token
- `404 Not Found`: User profile not found
- `500 Internal Server Error`: Server error

---

### 2. Update User Profile

Updates the user profile. Supports partial updates - only send the fields that need to be updated.

**Endpoint:**
```
POST /accounts/clients/{clientId}/user-profile/
```

**Request:**
- Method: `POST`
- Headers: 
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- Path Parameters:
  - `clientId` (string, required): Client/Organization ID
- Body: `Partial<UserProfile>` (JSON)

**Example Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "phone_number": "+1234567890",
  "bio": "Updated bio text",
  "headline": "Senior Software Engineer | React Specialist",
  "social_links": {
    "github": "johndoe",
    "linkedin": "johndoe"
  },
  "college_name": "University of Technology",
  "degree_type": "B.Tech",
  "branch": "Computer Science",
  "graduation_year": "2020",
  "city": "New York",
  "state": "NY",
  "portfolio_website_url": "https://johndoe.dev",
  "skills": [
    {
      "name": "React"
    },
    {
      "name": "TypeScript"
    }
  ],
  "experience": [
    {
      "company": "Tech Corp",
      "position": "Software Engineer",
      "start_date": "2020-07",
      "current": true,
      "description": "Full-stack development"
    }
  ]
}
```

**Response:**
- Status: `200 OK`
- Body: Updated `UserProfile` object

**Error Responses:**
- `400 Bad Request`: Invalid data format or validation errors
- `401 Unauthorized`: Invalid or missing authentication token
- `500 Internal Server Error`: Server error

**Notes:**
- For array fields (skills, projects, experience, etc.), sending an array will **replace** the entire array
- To add a single item, send the complete array including existing items
- To remove an item, send the array without that item
- For nested objects like `social_links`, send the complete object

---

### 3. Upload Cover Photo

Uploads a cover photo for the user profile.

**Endpoint:**
```
POST /accounts/clients/{clientId}/user-profile/cover-photo/
```

**Request:**
- Method: `POST`
- Headers: 
  - `Authorization: Bearer <token>`
  - `Content-Type: multipart/form-data`
- Path Parameters:
  - `clientId` (string, required): Client/Organization ID
- Body: FormData with field `cover_photo` (File)

**FormData Structure:**
```
cover_photo: <File>
```

**File Requirements:**
- Format: JPEG, PNG, or WebP
- Max Size: 10MB (recommended)
- Aspect Ratio: 16:9 (recommended, frontend will auto-crop)
- Recommended Dimensions: 1920x1080px or higher

**Response:**
- Status: `200 OK`
- Body:
```json
{
  "cover_photo_url": "https://example.com/uploads/cover-photos/user-123-cover.jpg"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid file format or size exceeded
- `401 Unauthorized`: Invalid or missing authentication token
- `413 Payload Too Large`: File size exceeds limit
- `500 Internal Server Error`: Server error

**Implementation Notes:**
- Store the uploaded file in a secure location (S3, local storage, etc.)
- Generate a unique filename to avoid conflicts
- Return the full URL to the uploaded image
- Consider image optimization/compression
- Handle file deletion when a new cover photo is uploaded

---

### 4. Upload Profile Picture

Uploads a profile picture for the user.

**Endpoint:**
```
POST /accounts/clients/{clientId}/user-profile/profile-picture/
```

**Request:**
- Method: `POST`
- Headers: 
  - `Authorization: Bearer <token>`
  - `Content-Type: multipart/form-data`
- Path Parameters:
  - `clientId` (string, required): Client/Organization ID
- Body: FormData with field `profile_picture` (File)

**FormData Structure:**
```
profile_picture: <File>
```

**File Requirements:**
- Format: JPEG, PNG, or WebP
- Max Size: 5MB (recommended)
- Aspect Ratio: 1:1 (square, frontend will auto-crop)
- Recommended Dimensions: 400x400px or higher (square)

**Response:**
- Status: `200 OK`
- Body:
```json
{
  "profile_picture": "https://example.com/uploads/profile-pictures/user-123-profile.jpg"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid file format or size exceeded
- `401 Unauthorized`: Invalid or missing authentication token
- `413 Payload Too Large`: File size exceeds limit
- `500 Internal Server Error`: Server error

**Implementation Notes:**
- Store the uploaded file in a secure location
- Generate a unique filename to avoid conflicts
- Return the full URL to the uploaded image
- Consider image optimization/compression
- Handle file deletion when a new profile picture is uploaded
- Consider generating thumbnails for better performance

---

### 5. Remove Cover Photo (Optional)

Removes the cover photo from the user profile.

**Endpoint:**
```
DELETE /accounts/clients/{clientId}/user-profile/cover-photo/
```

**Request:**
- Method: `DELETE`
- Headers: `Authorization: Bearer <token>`
- Path Parameters:
  - `clientId` (string, required): Client/Organization ID

**Response:**
- Status: `200 OK`
- Body:
```json
{
  "message": "Cover photo removed successfully"
}
```

**Alternative Implementation:**
If DELETE endpoint is not available, the frontend sends an empty file with filename "remove" in the upload endpoint. Backend should detect this and remove the existing cover photo.

---

### 6. Remove Profile Picture (Optional)

Removes the profile picture from the user profile.

**Endpoint:**
```
DELETE /accounts/clients/{clientId}/user-profile/profile-picture/
```

**Request:**
- Method: `DELETE`
- Headers: `Authorization: Bearer <token>`
- Path Parameters:
  - `clientId` (string, required): Client/Organization ID

**Response:**
- Status: `200 OK`
- Body:
```json
{
  "message": "Profile picture removed successfully"
}
```

**Alternative Implementation:**
If DELETE endpoint is not available, the frontend sends an empty file with filename "remove" in the upload endpoint. Backend should detect this and remove the existing profile picture.

---

## Field Specifications

### Required Fields

These fields are required and should always be present in the profile:

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `first_name` | string | User's first name | Required, min 1 character |
| `last_name` | string | User's last name | Required, min 1 character |
| `email` | string | User's email address | Required, valid email format |
| `username` | string | Unique username | Required, unique |
| `profile_picture` | string | URL to profile picture | Required (can be default/placeholder) |
| `phone_number` | string | Phone number | Required, valid phone format |
| `bio` | string | User biography | Required, can be empty string |

### Optional Fields

| Field | Type | Description | Validation | Max Length |
|-------|------|-------------|------------|------------|
| `date_of_birth` | string \| null | Date of birth | Format: YYYY-MM-DD | - |
| `role` | string | User role | e.g., "Student", "Instructor" | 50 |
| `headline` | string | Professional headline | - | 120 |
| `cover_photo_url` | string | URL to cover photo | Valid URL | - |
| `college_name` | string | College/University name | - | 200 |
| `degree_type` | string | Degree type | B.Tech, BCA, B.Sc, MCA, M.Tech, Other | 50 |
| `branch` | string | Branch/Major | - | 100 |
| `graduation_year` | string | Graduation year | Format: YYYY | 4 |
| `city` | string | City name | - | 100 |
| `state` | string | State/Province | - | 100 |
| `portfolio_website_url` | string | Portfolio website URL | Valid URL | - |
| `leetcode_url` | string | LeetCode profile URL | Valid URL | - |
| `hackerrank_url` | string | HackerRank profile URL | Valid URL | - |
| `kaggle_url` | string | Kaggle profile URL | Valid URL | - |
| `medium_url` | string | Medium profile URL | Valid URL | - |

### Social Links

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `social_links.github` | string | GitHub username | Valid GitHub username format |
| `social_links.linkedin` | string | LinkedIn username | Valid LinkedIn username format |

### Array Fields

All array fields are optional and can be empty arrays `[]`.

**Skills:**
- Each skill must have a `name` field
- `id` is optional (can be generated by backend)
- Duplicate skill names should be prevented

**Projects:**
- Required: `name`, `description`, `technologies`
- Optional: `url`, `start_date`, `end_date`, `current`
- `technologies` is an array of strings

**Experience:**
- Required: `company`, `position`, `start_date`, `current`
- Optional: `location`, `end_date`, `description`
- If `current` is `true`, `end_date` should be `null`

**Education:**
- Required: `institution`, `degree`
- Optional: `field_of_study`, `start_date`, `end_date`, `gpa`, `description`

**Certifications:**
- Required: `name`, `issuing_organization`, `issue_date`
- Optional: `expiration_date`, `credential_id`, `credential_url`

**Achievements:**
- Required: `title`
- Optional: `description`, `date`, `organization`

---

## File Upload Specifications

### Cover Photo Upload

**Endpoint:** `POST /accounts/clients/{clientId}/user-profile/cover-photo/`

**FormData Field:** `cover_photo`

**Specifications:**
- **Accepted Formats:** JPEG, JPG, PNG, WebP
- **Max File Size:** 10MB
- **Recommended Dimensions:** 1920x1080px (16:9 aspect ratio)
- **Min Dimensions:** 1200x675px
- **Aspect Ratio:** 16:9 (frontend auto-crops to this ratio)

**Backend Processing:**
1. Validate file type and size
2. Optionally resize/optimize image
3. Crop to 16:9 aspect ratio if needed
4. Store in secure location
5. Return full URL

### Profile Picture Upload

**Endpoint:** `POST /accounts/clients/{clientId}/user-profile/profile-picture/`

**FormData Field:** `profile_picture`

**Specifications:**
- **Accepted Formats:** JPEG, JPG, PNG, WebP
- **Max File Size:** 5MB
- **Recommended Dimensions:** 400x400px (1:1 aspect ratio)
- **Min Dimensions:** 200x200px
- **Aspect Ratio:** 1:1 (square, frontend auto-crops to this ratio)

**Backend Processing:**
1. Validate file type and size
2. Resize to square format (1:1)
3. Optionally generate thumbnails (e.g., 100x100, 200x200)
4. Store in secure location
5. Return full URL

### File Removal

The frontend may send a file with filename "remove" to signal removal. Backend should:
1. Detect the "remove" filename
2. Delete the existing file from storage
3. Set the field to `null` or empty string in the database
4. Return success response

---

## Error Handling

### Standard Error Response Format

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details"
  }
}
```

### Common Error Codes

| Status Code | Error Code | Description |
|-------------|------------|-------------|
| 400 | `VALIDATION_ERROR` | Invalid input data |
| 400 | `INVALID_FILE_TYPE` | Unsupported file format |
| 400 | `FILE_TOO_LARGE` | File size exceeds limit |
| 401 | `UNAUTHORIZED` | Invalid or missing authentication |
| 404 | `PROFILE_NOT_FOUND` | User profile does not exist |
| 413 | `PAYLOAD_TOO_LARGE` | File size exceeds maximum allowed |
| 500 | `INTERNAL_SERVER_ERROR` | Server error |

### Validation Error Example

```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "headline": "Headline cannot exceed 120 characters",
    "email": "Invalid email format",
    "skills": "Duplicate skill names are not allowed"
  }
}
```


## Example API Calls

### cURL Examples

#### Get User Profile
```bash
curl -X GET \
  'https://be-app.ailinc.com/accounts/clients/5/user-profile/' \
  -H 'Authorization: Bearer YOUR_TOKEN_HERE'
```

#### Update User Profile
```bash
curl -X POST \
  'https://be-app.ailinc.com/accounts/clients/5/user-profile/' \
  -H 'Authorization: Bearer YOUR_TOKEN_HERE' \
  -H 'Content-Type: application/json' \
  -d '{
    "headline": "Software Engineer | Full Stack Developer",
    "city": "New York",
    "state": "NY",
    "skills": [
      {"name": "React"},
      {"name": "TypeScript"}
    ]
  }'
```

#### Upload Cover Photo
```bash
curl -X POST \
  'https://be-app.ailinc.com/accounts/clients/5/user-profile/cover-photo/' \
  -H 'Authorization: Bearer YOUR_TOKEN_HERE' \
  -F 'cover_photo=@/path/to/cover-photo.jpg'
```

#### Upload Profile Picture
```bash
curl -X POST \
  'https://be-app.ailinc.com/accounts/clients/5/user-profile/profile-picture/' \
  -H 'Authorization: Bearer YOUR_TOKEN_HERE' \
  -F 'profile_picture=@/path/to/profile-picture.jpg'
```

---

## Notes for Backend Developers

1. **Partial Updates:** The update endpoint should support partial updates. Only update fields that are provided in the request.

2. **Array Handling:** When updating array fields (skills, projects, etc.), the frontend sends the complete array. The backend should replace the entire array, not merge.

3. **File Storage:** Consider using cloud storage (AWS S3, Google Cloud Storage) for production. Implement proper file naming to avoid conflicts.

4. **Image Processing:** Consider using libraries like Pillow (Python), Sharp (Node.js), or ImageMagick for image processing and optimization.

5. **Database Design:** Use proper relationships (foreign keys) for array fields. Consider soft deletes for historical data.

6. **Performance:** Add database indexes on frequently queried fields. Consider caching for profile data.

7. **Security:** Always validate file uploads server-side. Never trust client-side validation alone.

8. **Error Messages:** Provide clear, actionable error messages to help users fix issues.

---

## Version History

- **v1.0** (Current): Initial API specification
  - Complete profile structure
  - File upload endpoints
  - All field definitions

---

## Support

For questions or issues regarding this API specification, please contact the development team.

**Last Updated:** [Current Date]
**Document Version:** 1.0
