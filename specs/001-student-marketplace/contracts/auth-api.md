# API Contract: Authentication & User Management

**Scope**: User registration, login, logout, profile management, student ID verification  
**Base URL**: `/api/auth`  
**Auth**: Supabase Auth session cookie / Bearer token

---

## `POST /api/auth/signup`
Register a new student account with email, password, and student ID.

**Request**:
```json
{
  "email": "student@university.edu",
  "password": "securePassword123!",
  "first_name": "John",
  "last_name": "Doe",
  "student_id": "STU123456"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "user": {
    "id": "uuid-string",
    "email": "student@university.edu",
    "student_id": "STU123456",
    "student_id_verified": false,
    "first_name": "John",
    "last_name": "Doe"
  },
  "message": "Account created. Please verify your student ID."
}
```

**Errors**:
- 400: Invalid email format, password too weak, student ID already registered
- 409: Email already exists

---

## `POST /api/auth/login`
Authenticate user with email and password.

**Request**:
```json
{
  "email": "student@university.edu",
  "password": "securePassword123!"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "user": {
    "id": "uuid-string",
    "email": "student@university.edu",
    "student_id_verified": true,
    "first_name": "John"
  },
  "session": {
    "access_token": "eyJhbGc...",
    "refresh_token": "refreshToken...",
    "expires_in": 3600
  }
}
```

**Errors**:
- 401: Invalid email or password
- 403: Account not verified

---

## `POST /api/auth/logout`
End user session.

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## `GET /api/auth/me`
Fetch current authenticated user profile.

**Response** (200 OK):
```json
{
  "id": "uuid-string",
  "email": "student@university.edu",
  "student_id": "STU123456",
  "student_id_verified": true,
  "first_name": "John",
  "last_name": "Doe",
  "avatar_url": "https://storage.url/avatars/uuid.jpg",
  "bio": "Computer Science student",
  "created_at": "2026-04-16T10:30:00Z"
}
```

**Errors**:
- 401: Not authenticated

---

## `PATCH /api/auth/profile`
Update user profile information.

**Request**:
```json
{
  "first_name": "Jonathan",
  "bio": "CS student, bookworm",
  "avatar_file": "<multipart file>"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "user": {
    "id": "uuid-string",
    "first_name": "Jonathan",
    "bio": "CS student, bookworm",
    "avatar_url": "https://storage.url/avatars/uuid.jpg"
  }
}
```

**Errors**:
- 400: Invalid data format
- 413: File too large (max 10MB)
- 401: Not authenticated

---

## `POST /api/auth/verify-student-id`
Verify student ID (validates format; future: integrate university registrar API).

**Request**:
```json
{
  "student_id": "STU123456"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "student_id_verified": true,
  "message": "Student ID verified successfully"
}
```

**Errors**:
- 400: Invalid student ID format
- 409: Student ID already registered
- 401: Not authenticated

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_EMAIL",
    "message": "Email format is invalid",
    "status": 400
  }
}
```

---

## Implementation Notes

- **Server Component**: Wrap login/signup forms in `'use client'` component for form interactivity
- **Session Management**: Use Supabase Auth session cookie for subsequent requests
- **Password Hashing**: Handled by Supabase Auth (no plaintext storage)
- **Student ID Storage**: Stored in Supabase auth metadata + users table for querying
- **Token Expiration**: Access tokens expire in 1 hour; refresh tokens valid for 7 days
