# Quickstart: Roster Management API

## 1. Start service
- npm.cmd install
- npm.cmd run dev

## 2. Login as scheduler
Request:
- Method: POST
- Path: /api/v1/auth/login
- Body:
  {
    "username": "scheduler",
    "password": "scheduler123"
  }

Capture accessToken from response.

## 3. Create roster
Request:
- Method: POST
- Path: /api/v1/rosters
- Header: Authorization: Bearer <accessToken>
- Body:
  {
    "name": "Weekday Rotation"
  }
Expected:
- 201 with created roster item.

## 4. List rosters
Request:
- Method: GET
- Path: /api/v1/rosters
- Header: Authorization: Bearer <accessToken>
Expected:
- 200 with items containing created roster.

## 5. Validate error paths
- POST /api/v1/rosters with missing name -> 400.
- GET /does-not-exist -> 404.
