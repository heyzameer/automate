# Backend Template API Documentation

This document outlines the core API endpoints provided out-of-the-box by the backend template.

## Table of Contents
1. [System Endpoints](#1-system-endpoints)
2. [Authentication (Public Routes)](#2-authentication-public-routes)
3. [Social Login (OAuth 2.0)](#3-social-login-oauth-20)
4. [Protected Routes](#4-protected-routes)
5. [Development Notes](#5-development-notes)


## Base URL
All API paths are prefixed with: `/api/v1`

---

## 1. System Endpoints

### API Root
- **Endpoint:** `GET /`
- **Description:** Landing page for the API, providing basic version info.
- **Response:**
  ```json
  {
    "success": true,
    "message": "Travel Hub API v1",
    "data": {
      "version": "1.0.0",
      "status": "Operational",
      "docs": "/api/v1/health"
    },
    "timestamp": "..."
  }
  ```

### Health Check
- **Endpoint:** `GET /health`
- **Description:** Checks if the server is healthy and reporting.
- **Response:**
  ```json
  {
    "success": true,
    "message": "Service is healthy",
    "data": {
      "status": "OK",
      "timestamp": "2026-03-07T16:11:59.690Z",
      "uptime": 45.2,
      "environment": "development"
    }
  }
  ```

### API Version
- **Endpoint:** `GET /version`
- **Description:** Retrieves the current API version name and metadata.

---

## 2. Authentication (Public Routes)

These endpoints do not require a JWT and are used to build up a session.

### Register User
- **Endpoint:** `POST /auth/register`
- **Body:**
  ```json
  {
    "fullName": "John Doe",
    "email": "johndoe@example.com",
    "phone": "+1234567890",
    "password": "SecurePassword123!",
    "role": "customer" // "customer", "partner", "admin"
  }
  ```
- **Returns:** Tokens + User data. Note: `refreshToken` is also planted securely into HTTP-only cookies.

### Login
- **Endpoint:** `POST /auth/login`
- **Body:**
  ```json
  {
    "email": "johndoe@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Returns:** Tokens + User data. Includes a Set-Cookie header for the `refreshToken`.

### Refresh Token
- **Endpoint:** `POST /auth/refresh-token`
- **Description:** Refreshes the `accessToken` using the HTTP-only cookie `refreshToken`.
- **Returns:** New `accessToken` and updates the existing `refreshToken` cookie.

### Validate Token
- **Endpoint:** `POST /auth/validate-token`
- **Body:**
  ```json
  {
    "token": "eyJhb..."
  }
  ```
- **Returns:** Token validity details and payload.

### Forgot Password
- **Endpoint:** `POST /auth/forgot-password`
- **Body:**
  ```json
  {
    "email": "johndoe@example.com"
  }
  ```
- **Description:** Triggers the process to send a password reset OTP.

### Reset Password
- **Endpoint:** `POST /auth/reset-password`
- **Body:**
  ```json
  {
    "email": "johndoe@example.com",
    "otp": "123456",
    "password": "NewSecurePassword123!"
  }
  ```

---

## 3. Social Login (OAuth 2.0)

### Login with Google
- **Endpoint:** `GET /auth/google`
- **Description:** Redirects the user to the Google Consent screen. Link the "Login with Google" button directly to this URL.

### Google Callback
- **Endpoint:** `GET /auth/google/callback`
- **Description:** Internal route used by Google to send the user back after authentication. This route will generate tokens and redirect to the frontend with tokens attached directly in the URL params: `?accessToken=X&refreshToken=Y&user=Z`

---

## 4. Protected Routes

These endpoints **require** a valid Access Token passed in the Authorization header.
**Header:** `Authorization: Bearer <accessToken>`

### Get Profile
- **Endpoint:** `GET /auth/profile`
- **Description:** Retrieve the profile data of the currently authenticated user.

### Change Password
- **Endpoint:** `POST /auth/change-password`
- **Body:**
  ```json
  {
    "currentPassword": "SecurePassword123!",
    "newPassword": "AnotherPassword456!"
  }
  ```

### Request OTP
- **Endpoint:** `POST /auth/request-otp`
- **Description:** Requests an OTP code to verify certain actions.
- **Body:**
  ```json
  {
    "type": "phone_verification" // "email_verification", "password_reset"
  }
  ```

### Verify OTP
- **Endpoint:** `POST /auth/verify-otp`
- **Description:** Verifies an OTP code for a specific verification type.
- **Body:**
  ```json
  {
    "code": "123456",
    "type": "phone_verification"
  }
  ```

### Resend OTP
- **Endpoint:** `POST /auth/resend-otp`
- **Body:**
  ```json
  {
    "email": "johndoe@example.com",
    "type": "email_verification"
  }
  ```

### Logout
- **Endpoint:** `POST /auth/logout`
- **Description:** Logs out the user by blacklisting/deleting their session in MongoDB and clearing the HTTP-only `refreshToken` cookie.


---

## 5. Development Notes

### OTP Verification
In development mode, OTP codes are logged to the application logs instead of being sent via SMS/Email.
- **Log Location:** `logs/app-YYYY-MM-DD.log`
- **Format:** `[TEST] OTP for <email> (<type>): <otpCode>`

### Error Handling
The API uses standard HTTP status codes:
- `200 OK`: Request succeeded
- `201 Created`: Resource created successfully
- `400 Bad Request`: Validation error or invalid input
- `401 Unauthorized`: Authentication required or failed
- `403 Forbidden`: Insufficient permissions (RBAC)
- `404 Not Found`: Endpoint or resource not found
- `409 Conflict`: Resource already exists (e.g., duplicate email)
- `500 Internal Server Error`: Something went wrong on the server
