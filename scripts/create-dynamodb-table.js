require("dotenv/config");

const {
  CreateTableCommand,
  DescribeTableCommand,
  DynamoDBClient,
  waitUntilTableExists
} = require("@aws-sdk/client-dynamodb");

const region = process.env.AWS_REGION;
const tableName = process.env.DYNAMODB_TABLE_NAME;
const endpoint = process.env.DYNAMODB_ENDPOINT;

if (!region) {
  console.error("AWS_REGION is required.");
  process.exit(1);
}

if (!tableName) {
  console.error("DYNAMODB_TABLE_NAME is required.");
  process.exit(1);
}

const client = new DynamoDBClient({
  region,
  endpoint: endpoint || undefined
});

async function ensureTable() {
  try {
    const existing = await client.send(new DescribeTableCommand({ TableName: tableName }));
    console.log(`DynamoDB table already exists: ${existing.Table.TableName}`);
    return;
  } catch (error) {
    if (error.name !== "ResourceNotFoundException") {
      throw error;
    }
  }

  await client.send(
    new CreateTableCommand({
      TableName: tableName,
      AttributeDefinitions: [{ AttributeName: "employeeId", AttributeType: "S" }],
      KeySchema: [{ AttributeName: "employeeId", KeyType: "HASH" }],
      BillingMode: "PAY_PER_REQUEST"
    })
  );

  await waitUntilTableExists(
    {
      client,
      maxWaitTime: 60
    },
    { TableName: tableName }
  );

  console.log(`Created DynamoDB table: ${tableName}`);
}

ensureTable().catch((error) => {
  console.error(error.name || "CreateTableError", error.message || error);
  process.exit(1);
});