# Quickstart: Authentication And RBAC

## 1. Start the API
- npm.cmd install
- npm.cmd run dev

## 2. Login
Request:
- Method: POST
- Path: /api/v1/auth/login
- Body:
  {
    "username": "viewer",
    "password": "viewer123"
  }
Expected:
- 200 response with accessToken, tokenType, expiresIn, and user.

## 3. Verify protected route without token
Request:
- Method: GET
- Path: /api/v1/rosters
Expected:
- 401 unauthorized.

## 4. Verify role policy
- Login as viewer and call POST /api/v1/rosters -> expect 403.
- Login as scheduler and call POST /api/v1/rosters with body {"name":"Weekday Rotation"} -> expect 201.
