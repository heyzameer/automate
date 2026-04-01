# Auth Service API Documentation

The Auth Service handles user authentication, registration (including multi-tenant showroom setup), and session management.

## Base URL
`http://localhost:5000/api/v1/auth` (via API Gateway)

---

## 1. Register Tenant (Showroom)
Initializes a new showroom and creates its primary administrator account.

- **URL**: `/register-tenant`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "tenantData": {
      "name": "Auto Elite Motors"
    },
    "adminData": {
      "fullName": "John Doe",
      "email": "john@autoelite.com",
      "phone": "9876543210",
      "password": "securePassword123"
    }
  }
  ```
- **Notes**: `slug` is auto-generated from the showroom name.
- **Response (201)**:
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "data": {
      "user": { "id": "...", "email": "...", "role": "showroom_admin", ... },
      "tenant": { "id": "...", "name": "...", "slug": "...", ... },
      "accessToken": "...",
      "refreshToken": "..."
    }
  }
  ```

---

## 2. Partner Login
Authenticates showroom administrators and staff.

- **URL**: `/login`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "email": "john@autoelite.com",
    "password": "securePassword123"
  }
  ```
- **Response (200)**:
  ```json
  {
    "success": true,
    "data": {
      "user": { ... },
      "accessToken": "...",
      "refreshToken": "..."
    }
  }
  ```

---

## 3. Super Admin Login
Strictly for platform administrators.

- **URL**: `/super-login`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "email": "superadmin@automoto.ai",
    "password": "admin123"
  }
  ```
- **Response (200)**: Same as login.

---

## 4. Get Profile
Retrieves the currently authenticated user's profile.

- **URL**: `/profile`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`
- **Response (200)**:
  ```json
  {
    "success": true,
    "data": {
      "user": { ... }
    }
  }
  ```

---

## 5. Logout
Invalidates the current session.

- **URL**: `/logout`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <token>`

---

## Error Handling
The service uses standard HTTP status codes:
- `400`: Bad Request (Invalid input)
- `401`: Unauthorized (Invalid credentials or token)
- `403`: Forbidden (Inactive account or expired subscription)
- `409`: Conflict (Email or phone already exists)
- `500`: Internal Server Error
