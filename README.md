# LMS Platform - Frontend

A modern Learning Management System platform built with Next.js, Material-UI, and TypeScript.

## Features

1. **Authentication** - Login, Signup, and Email Verification
2. **Courses** - Course listing, enrollment, and detailed course pages
3. **Student Dashboard** - Progress tracking and course overview
4. **Assessments** - Take assessments, view results, and track progress
5. **Job Portal** - Browse and filter job listings

## Tech Stack

- **Next.js 16** - React framework with App Router
- **Material-UI (MUI)** - Component library
- **lucide-react** - Icon library
- **TypeScript** - Type safety
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **Axios** - HTTP client
- **js-cookie** - Cookie management

## Setup Instructions

1. **Install Dependencies**

```bash
yarn install
```

2. **Install Additional Package for Form Validation**

```bash
yarn add @hookform/resolvers
```

3. **Environment Variables**

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_CLIENT_ID=1
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
```

4. **Run Development Server**

```bash
yarn dev
```

5. **Enable Form Validation**

After installing `@hookform/resolvers`, uncomment the `zodResolver` imports and usage in:
- `app/(auth)/login/page.tsx`
- `app/(auth)/signup/page.tsx`
- `app/(auth)/verify-email/page.tsx`

## Project Structure

```
app/
├── (auth)/          # Authentication pages
├── courses/         # Course pages
├── dashboard/       # Student dashboard
├── assessments/     # Assessment pages
├── jobs/            # Job portal
└── api-reference/   # API documentation

components/
├── common/          # Reusable UI components
├── layout/          # Layout components
├── course/          # Course-specific components
├── assessment/      # Assessment components
└── jobs/            # Job components

lib/
├── services/        # API service files
├── auth/            # Authentication logic
├── config.ts        # Configuration
└── theme.ts         # MUI theme
```

## API Services

All API endpoints are documented in `lib/services/api-list.ts`. You can view them in the API Reference page at `/api-reference`.

## Authentication

The app uses JWT tokens stored in HTTP-only cookies. The authentication context is available throughout the app via the `useAuth` hook.

## Features Implementation

### 1. Login/Signup
- Email/password authentication
- Google OAuth (ready for integration)
- Email verification with OTP

### 2. Courses
- Browse all available courses
- View course details and modules
- Enroll in courses
- Track course progress

### 3. Student Dashboard
- View enrolled courses
- Track learning progress
- See statistics and achievements

### 4. Assessments
- View available assessments
- Start and complete assessments
- Save progress
- View results

### 5. Job Portal
- Browse job listings
- Filter by location, job type, and search
- Apply to jobs

## Development Notes

- All API calls use the base URL from environment variables
- Client ID is configurable via environment variables
- Authentication tokens are managed via cookies
- Error handling is centralized in the API service layer
- Toast notifications provide user feedback
- Loading states are handled with the Loading component

## Build for Production

```bash
yarn build
yarn start
```
