import * as cdk from "aws-cdk-lib";
import { CoxRosterWebAppStack } from "../lib/cox-roster-webapp-stack";

const app = new cdk.App();

const stackName = app.node.tryGetContext("stackName") ?? "CoxRosterWebAppStack";
const stage = app.node.tryGetContext("stage") ?? "dev";

new CoxRosterWebAppStack(app, stackName, {
  stage,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? "us-east-1"
  }
});
