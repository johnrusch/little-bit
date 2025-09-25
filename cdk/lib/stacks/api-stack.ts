import * as cdk from 'aws-cdk-lib';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';
import * as fs from 'fs';
import { Construct } from 'constructs';

export interface ApiStackProps extends cdk.StackProps {
  readonly userPool: cognito.UserPool;
}

export class ApiStack extends cdk.Stack {
  public readonly graphqlApi: appsync.CfnGraphQLApi;
  public readonly apiKey: appsync.CfnApiKey;
  public readonly sampleTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    // Read GraphQL schema (use AppSync version without Amplify directives)
    const schemaPath = path.join(__dirname, '../../graphql/schema-appsync.graphql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Create CloudWatch Logs role for GraphQL API
    const logRole = new iam.Role(this, 'GraphQLLogRole', {
      assumedBy: new iam.ServicePrincipal('appsync.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSAppSyncPushToCloudWatchLogs'),
      ],
    });

    // Create GraphQL API (equivalent to littlebitgraphqlAPI)
    this.graphqlApi = new appsync.CfnGraphQLApi(this, 'GraphQLAPI', {
      name: `littlebit-graphql-api-${cdk.Stack.of(this).stackName}`,
      authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      userPoolConfig: {
        userPoolId: props.userPool.userPoolId,
        awsRegion: cdk.Stack.of(this).region,
        defaultAction: 'ALLOW',
      },
      additionalAuthenticationProviders: [
        {
          authenticationType: 'API_KEY',
        },
        {
          authenticationType: 'AWS_IAM',
        },
      ],
      logConfig: {
        fieldLogLevel: 'ERROR',
        excludeVerboseContent: true,
        cloudWatchLogsRoleArn: logRole.roleArn,
      },
      xrayEnabled: true,
    });

    // Create API Key
    this.apiKey = new appsync.CfnApiKey(this, 'GraphQLAPIKey', {
      apiId: this.graphqlApi.attrApiId,
      description: 'API Key for public access',
      expires: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60), // 90 days from now
    });

    // Create GraphQL Schema
    const graphqlSchema = new appsync.CfnGraphQLSchema(this, 'GraphQLSchema', {
      apiId: this.graphqlApi.attrApiId,
      definition: schema,
    });
    graphqlSchema.addDependency(this.graphqlApi);

    // Create DynamoDB table for Sample model
    this.sampleTable = new dynamodb.Table(this, 'SampleTable', {
      tableName: `Sample-${cdk.Stack.of(this).stackName}`,
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    // Add GSI for owner queries
    this.sampleTable.addGlobalSecondaryIndex({
      indexName: 'byOwner',
      partitionKey: {
        name: 'user_id',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'createdAt',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Create IAM role for DynamoDB data source
    const dataSourceRole = new iam.Role(this, 'DataSourceRole', {
      assumedBy: new iam.ServicePrincipal('appsync.amazonaws.com'),
    });
    this.sampleTable.grantReadWriteData(dataSourceRole);

    // Create DynamoDB data source
    const sampleDataSource = new appsync.CfnDataSource(this, 'SampleDataSource', {
      apiId: this.graphqlApi.attrApiId,
      name: 'SampleTableDataSource',
      type: 'AMAZON_DYNAMODB',
      dynamoDbConfig: {
        tableName: this.sampleTable.tableName,
        awsRegion: cdk.Stack.of(this).region,
      },
      serviceRoleArn: dataSourceRole.roleArn,
    });
    sampleDataSource.addDependency(graphqlSchema);

    // Create resolvers using simplified mapping templates
    const resolvers = [
      {
        typeName: 'Query',
        fieldName: 'getSample',
        requestTemplate: `{
          "version": "2017-02-28",
          "operation": "GetItem",
          "key": {
            "id": $util.dynamodb.toDynamoDBJson($ctx.args.id)
          }
        }`,
        responseTemplate: '$util.toJson($ctx.result)',
      },
      {
        typeName: 'Query',
        fieldName: 'listSamples',
        requestTemplate: `{
          "version": "2017-02-28",
          "operation": "Scan"
        }`,
        responseTemplate: `{
          "items": $util.toJson($ctx.result.items),
          "nextToken": $util.toJson($util.defaultIfNullOrBlank($ctx.result.nextToken, null))
        }`,
      },
      {
        typeName: 'Mutation',
        fieldName: 'createSample',
        requestTemplate: `{
          "version": "2017-02-28",
          "operation": "PutItem",
          "key": {
            "id": $util.dynamodb.toDynamoDBJson($util.autoId())
          },
          "attributeValues": $util.dynamodb.toMapValuesJson($ctx.args.input)
        }`,
        responseTemplate: '$util.toJson($ctx.result)',
      },
      {
        typeName: 'Mutation',
        fieldName: 'updateSample',
        requestTemplate: `{
          "version": "2017-02-28",
          "operation": "UpdateItem",
          "key": {
            "id": $util.dynamodb.toDynamoDBJson($ctx.args.input.id)
          },
          "update": {
            "expression": "SET #n = :name",
            "expressionNames": {
              "#n": "name"
            },
            "expressionValues": {
              ":name": $util.dynamodb.toDynamoDBJson($ctx.args.input.name)
            }
          }
        }`,
        responseTemplate: '$util.toJson($ctx.result)',
      },
      {
        typeName: 'Mutation',
        fieldName: 'deleteSample',
        requestTemplate: `{
          "version": "2017-02-28",
          "operation": "DeleteItem",
          "key": {
            "id": $util.dynamodb.toDynamoDBJson($ctx.args.input.id)
          }
        }`,
        responseTemplate: '$util.toJson($ctx.result)',
      },
    ];

    // Create resolvers
    resolvers.forEach((resolver, index) => {
      const cfnResolver = new appsync.CfnResolver(this, `${resolver.typeName}${resolver.fieldName}Resolver`, {
        apiId: this.graphqlApi.attrApiId,
        typeName: resolver.typeName,
        fieldName: resolver.fieldName,
        dataSourceName: sampleDataSource.name,
        requestMappingTemplate: resolver.requestTemplate,
        responseMappingTemplate: resolver.responseTemplate,
      });
      cfnResolver.addDependency(sampleDataSource);
    });

    // Stack outputs
    new cdk.CfnOutput(this, 'GraphQLAPIURL', {
      value: this.graphqlApi.attrGraphQlUrl,
      description: 'GraphQL API URL',
      exportName: `${this.stackName}-GraphQLAPIURL`,
    });

    new cdk.CfnOutput(this, 'GraphQLAPIID', {
      value: this.graphqlApi.attrApiId,
      description: 'GraphQL API ID',
      exportName: `${this.stackName}-GraphQLAPIID`,
    });

    new cdk.CfnOutput(this, 'GraphQLAPIKeyOutput', {
      value: this.apiKey.attrApiKey,
      description: 'GraphQL API Key',
      exportName: `${this.stackName}-GraphQLAPIKey`,
    });

    new cdk.CfnOutput(this, 'SampleTableName', {
      value: this.sampleTable.tableName,
      description: 'Sample DynamoDB Table Name',
      exportName: `${this.stackName}-SampleTableName`,
    });
  }
}