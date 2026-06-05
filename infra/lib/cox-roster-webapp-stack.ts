import * as path from "node:path";
import {
  CfnOutput,
  Duration,
  RemovalPolicy,
  Stack,
  StackProps,
  aws_apigateway as apigateway,
  aws_cloudfront as cloudfront,
  aws_cloudfront_origins as origins,
  aws_dynamodb as dynamodb,
  aws_lambda as lambda,
  aws_logs as logs,
  aws_lambda_nodejs as lambdaNodejs,
  aws_s3 as s3,
  aws_s3_deployment as s3deploy,
  aws_wafv2 as wafv2
} from "aws-cdk-lib";
import { Construct } from "constructs";

export interface CoxRosterWebAppStackProps extends StackProps {
  stage: string;
  jwtSecret?: string;
}

export class CoxRosterWebAppStack extends Stack {
  constructor(scope: Construct, id: string, props: CoxRosterWebAppStackProps) {
    super(scope, id, props);

    const isProd = props.stage === "prod";
    const jwtSecret = props.jwtSecret ?? (isProd ? undefined : "dev-only-change-me");

    if (!jwtSecret) {
      throw new Error("A jwtSecret context value is required for the prod stage.");
    }

    const siteBucket = new s3.Bucket(this, "FrontendBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: true,
      removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      autoDeleteObjects: !isProd
    });

    const table = new dynamodb.Table(this, "RosterTable", {
      partitionKey: { name: "employeeId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY
    });

    const forecastTable = new dynamodb.Table(this, "ForecastTable", {
      partitionKey: { name: "employeeId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "forecastMonth", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY
    });

    const apiLogGroup = new logs.LogGroup(this, "ApiFunctionLogs", {
      logGroupName: `/aws/lambda/cox-roster-api-${props.stage}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY
    });

    const apiHandler = new lambdaNodejs.NodejsFunction(this, "ApiHandler", {
      entry: path.join(__dirname, "../../src/lambda.ts"),
      handler: "handler",
      functionName: `cox-roster-api-${props.stage}`,
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: Duration.seconds(15),
      memorySize: 512,
      logGroup: apiLogGroup,
      environment: {
        STAGE: props.stage,
        DYNAMODB_TABLE_NAME: table.tableName,
        FORECAST_TABLE_NAME: forecastTable.tableName,
        JWT_SECRET: jwtSecret
      },
      bundling: {
        sourceMap: false,
        minify: false
      }
    });

    table.grantReadWriteData(apiHandler);
    forecastTable.grantReadWriteData(apiHandler);

    const accessLogs = new logs.LogGroup(this, "ApiAccessLogs", {
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY
    });

    const api = new apigateway.RestApi(this, "PublicApi", {
      restApiName: `cox-roster-api-${props.stage}`,
      deployOptions: {
        stageName: props.stage,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: false,
        metricsEnabled: true,
        accessLogDestination: new apigateway.LogGroupLogDestination(accessLogs),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields({
          caller: false,
          httpMethod: true,
          ip: true,
          protocol: true,
          requestTime: true,
          resourcePath: true,
          responseLength: true,
          status: true,
          user: false
        })
      },
      defaultCorsPreflightOptions: {
        allowHeaders: ["Authorization", "Content-Type", "X-Requested-With"],
        allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
        allowOrigins: apigateway.Cors.ALL_ORIGINS
      }
    });

    const rootIntegration = new apigateway.LambdaIntegration(apiHandler);
    api.root.addMethod("ANY", rootIntegration);
    api.root.addResource("{proxy+}").addMethod("ANY", rootIntegration);

    const securityHeaders = new cloudfront.ResponseHeadersPolicy(this, "SecurityHeadersPolicy", {
      responseHeadersPolicyName: `cox-roster-security-${props.stage}`,
      securityHeadersBehavior: {
        contentSecurityPolicy: {
          contentSecurityPolicy:
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'",
          override: true
        },
        contentTypeOptions: { override: true },
        frameOptions: { frameOption: cloudfront.HeadersFrameOption.DENY, override: true },
        referrerPolicy: {
          referrerPolicy: cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
          override: true
        },
        strictTransportSecurity: {
          accessControlMaxAge: Duration.days(365),
          includeSubdomains: true,
          preload: true,
          override: true
        },
        xssProtection: { protection: true, modeBlock: true, override: true }
      }
    });

    const webAcl = new wafv2.CfnWebACL(this, "WebAcl", {
      defaultAction: { allow: {} },
      scope: "CLOUDFRONT",
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: `cox-roster-waf-${props.stage}`,
        sampledRequestsEnabled: true
      },
      rules: [
        {
          name: "AWSManagedRulesCommonRuleSet",
          priority: 1,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              name: "AWSManagedRulesCommonRuleSet",
              vendorName: "AWS"
            }
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: `cox-roster-waf-common-${props.stage}`,
            sampledRequestsEnabled: true
          }
        },
        {
          name: "RateLimitPerIp",
          priority: 2,
          action: { block: {} },
          statement: {
            rateBasedStatement: {
              aggregateKeyType: "IP",
              limit: 2000
            }
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: `cox-roster-waf-rate-${props.stage}`,
            sampledRequestsEnabled: true
          }
        }
      ]
    });

    const distribution = new cloudfront.Distribution(this, "WebDistribution", {
      comment: `Cox roster distribution (${props.stage})`,
      defaultRootObject: "index.html",
      webAclId: webAcl.attrArn,
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(siteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        responseHeadersPolicy: securityHeaders,
        compress: true
      },
      additionalBehaviors: {
        "api/*": {
          origin: new origins.HttpOrigin(
            `${api.restApiId}.execute-api.${this.region}.${this.urlSuffix}`,
            { originPath: `/${api.deploymentStage.stageName}` }
          ),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
          responseHeadersPolicy: securityHeaders,
          compress: true
        },
        health: {
          origin: new origins.HttpOrigin(
            `${api.restApiId}.execute-api.${this.region}.${this.urlSuffix}`,
            { originPath: `/${api.deploymentStage.stageName}` }
          ),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
          responseHeadersPolicy: securityHeaders,
          compress: true
        }
      },
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: Duration.minutes(1)
        }
      ]
    });

    new s3deploy.BucketDeployment(this, "DeployFrontend", {
      destinationBucket: siteBucket,
      sources: [s3deploy.Source.asset(path.join(__dirname, "../../public"))],
      distribution,
      distributionPaths: ["/*"]
    });

    new CfnOutput(this, "CloudFrontUrl", {
      value: `https://${distribution.distributionDomainName}`
    });

    new CfnOutput(this, "ApiInvokeUrl", {
      value: api.url
    });

    new CfnOutput(this, "HealthUrl", {
      value: `https://${distribution.distributionDomainName}/health`
    });

    new CfnOutput(this, "FrontendBucketName", {
      value: siteBucket.bucketName
    });

    new CfnOutput(this, "DynamoTableName", {
      value: table.tableName
    });

    new CfnOutput(this, "ForecastTableName", {
      value: forecastTable.tableName
    });
  }
}
