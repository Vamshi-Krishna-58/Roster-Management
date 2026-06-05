# RosterManagemnet

A Node.js + TypeScript Express app for authenticated employee roster management with a built-in frontend and optional DynamoDB persistence.

## Structure

- `src/config`: environment and app settings
- `src/controllers`: request handlers
- `src/services`: business logic
- `src/repositories`: data access layer and DynamoDB integration
- `src/routes`: route declarations
- `src/middleware`: cross-cutting middleware
- `src/`: source code root and app composition
- `public/`: frontend assets served by Express
- `tests/`: automated tests
- `docs/`: documentation
- `dist/`: compiled output

## Getting Started

1. Install Node.js LTS (includes npm): https://nodejs.org/
2. Install dependencies:
	- `npm install`
3. Configure AWS settings:
	- The repository now reads a local `.env` file automatically.
	- Default values are `AWS_REGION=us-east-1` and `DYNAMODB_TABLE_NAME=cox-roster-employees`.
	- Change them in `.env` if you need a different region or table name.
4. Create the DynamoDB table:
	- `npm run create:dynamodb-table`
	- This requires valid AWS credentials in your shell or shared AWS config.
5. Run in development mode:
	- `npm run dev`
6. Open the frontend:
	- `http://localhost:3000/`
	- Sign in with one of the demo users below.
7. Login and get a JWT token manually if needed:
	- `POST http://localhost:3000/api/v1/auth/login`
	- Body: `{ "username": "viewer", "password": "viewer123" }`
8. Test API endpoints:
	- `GET http://localhost:3000/health`
	- `GET http://localhost:3000/api/v1/employees` (requires Bearer token)
	- `POST http://localhost:3000/api/v1/employees` (requires scheduler/admin role)
	- `PATCH http://localhost:3000/api/v1/employees/:employeeId` (requires scheduler/admin role)
	- `GET http://localhost:3000/does-not-exist` (returns 404)
9. Build for production:
	- `npm run build`
10. Run tests:
	- `npm test`

## Auth and Roles

- JWT auth via `Authorization: Bearer <token>` header
- Default demo users:
	- `admin` / `admin123` (roles: admin)
	- `scheduler` / `scheduler123` (roles: scheduler)
	- `viewer` / `viewer123` (roles: viewer)
- Role rules:
	- `GET /api/v1/employees`: admin, scheduler, viewer
	- `POST /api/v1/employees`: admin, scheduler
	- `PATCH /api/v1/employees/:employeeId`: admin, scheduler

## Environment Variables

- `PORT` (default `3000`)
- `JWT_SECRET` (default `dev-only-change-me`)
- `JWT_EXPIRES_IN_SECONDS` (default `3600`)
- `AWS_REGION` (required only when using DynamoDB)
- `DYNAMODB_TABLE_NAME` (optional; when omitted the app uses in-memory storage)
- `DYNAMODB_ENDPOINT` (optional; useful for local DynamoDB)

## DynamoDB Table

When DynamoDB is enabled, create a table with a string partition key named `employeeId`.

Bootstrap command from this repo:

```bash
npm run create:dynamodb-table
```

Equivalent AWS CLI command:

```bash
aws dynamodb create-table \
	--table-name cox-roster-employees \
	--attribute-definitions AttributeName=employeeId,AttributeType=S \
	--key-schema AttributeName=employeeId,KeyType=HASH \
	--billing-mode PAY_PER_REQUEST
```

## Scripts

- `npm run dev`: run the Express API in watch mode
- `npm run build`: compile TypeScript into `dist/`
- `npm run start`: run compiled server from `dist/`
- `npm test`: run tests once
- `npm run test:watch`: run tests in watch mode

## AWS Hosting

This repository now includes a deployable AWS CDK stack in `infra/` that hosts:

- frontend assets from `public/` in S3 behind CloudFront
- the Express API in Lambda behind API Gateway
- employee data in DynamoDB

Typical deployment flow from the repository root:

1. Install dependencies:
	- `npm install`
2. Bootstrap CDK once per account/region:
	- `npm run cdk:bootstrap`
3. Synthesize the stack:
	- `npm run cdk:synth -c stage=dev`
4. Deploy the stack:
	- `npm run cdk:deploy -c stage=prod -c stackName=CoxRosterWebAppProd -c jwtSecret=replace-with-a-strong-secret`

After deploy, CDK outputs the CloudFront URL for the hosted app, the direct API Gateway URL, the health check URL, and the DynamoDB table name.

## Spec-Driven Workflow (Spec Kit)

This repository is configured to run with Spec Kit as the default delivery workflow.

1. Define or amend project rules:
	- `/speckit.constitution`
2. Create a feature specification:
	- `/speckit.specify <feature description>`
3. Generate technical plan artifacts:
	- `/speckit.plan`
4. Break work into executable tasks:
	- `/speckit.tasks`
5. Execute implementation from tasks:
	- `/speckit.implement`

Current baseline feature specifications are available under `specs/` and map to implemented auth/RBAC and roster management behavior.
