# API Contract: Authentication And RBAC

## Endpoint: POST /api/v1/auth/login

### Request
- Content-Type: application/json
- Body:
  - username (string, required)
  - password (string, required)

### Success Response
- Status: 200
- Body:
  - accessToken (string)
  - tokenType (string, expected Bearer)
  - expiresIn (number)
  - user:
    - id (string)
    - username (string)
    - role (admin | scheduler | viewer)

### Error Responses
- 400 when username or password is missing.
- 401 when credentials are invalid.

## Protected API Access Contract

### Authentication
- Protected routes require Authorization header: Bearer <token>.
- Invalid, missing, or expired token returns 401.

### Authorization
- GET /api/v1/rosters: allowed roles admin, scheduler, viewer.
- POST /api/v1/rosters: allowed roles admin, scheduler.
- Authenticated request with unauthorized role returns 403.
