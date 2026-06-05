# AWS CDK Hosting Stack

This folder contains the AWS CDK stack that deploys the current application as:

Browser -> CloudFront -> S3 (frontend) -> API Gateway -> Lambda (Express API) -> DynamoDB

## What this stack creates

- Private S3 bucket for static frontend hosting
- CloudFront distribution with:
  - Default behavior to S3 origin
  - `/api/*` behavior routed to API Gateway
  - Security headers policy
- AWS WAF (managed rule set + rate limiting) attached to CloudFront
- API Gateway REST API with access logging and CORS
- Lambda backend function bundling the real Express API from `src/lambda.ts`
- DynamoDB table (PAY_PER_REQUEST + PITR + GSI)
- Automatic deployment of `public/` assets to S3 + CloudFront invalidation

## Prerequisites

- AWS credentials configured in your environment
- CDK bootstrap completed for your account/region

## Commands

From repository root:

- `npm run cdk:bootstrap`
- `npm run cdk:synth`
- `npm run cdk:diff`
- `npm run cdk:deploy`

Use context to change stage and stack name:

- `npm run cdk -- synth -c stage=prod -c stackName=CoxRosterWebAppProd`
- `npm run cdk -- deploy -c stage=prod -c stackName=CoxRosterWebAppProd -c jwtSecret=replace-with-a-strong-secret --require-approval never`

## Notes

- The stack creates the DynamoDB table with the app's required `employeeId` partition key.
- For the `prod` stage, `jwtSecret` is required and is passed to the Lambda as `JWT_SECRET`.
- CloudFront serves the frontend from S3 and forwards `/api/*` and `/health` to API Gateway.
- For production custom domains, add ACM certificate + Route53 alias to CloudFront.
