import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { ApiStack } from '../lib/stacks/api-stack';
import { MockUserPool } from './mocks/mock-user-pool';

describe('ApiStack', () => {
  let app: cdk.App;
  let stack: ApiStack;
  let template: Template;
  let mockUserPool: cognito.IUserPool;

  beforeEach(() => {
    app = new cdk.App({
      context: {
        testing: true
      }
    });
    
    // Create a core stack with the user pool
    const coreStack = new cdk.Stack(app, 'MockCoreStack', {
      env: { account: '123456789012', region: 'us-west-2' },
    });
    mockUserPool = new cognito.UserPool(coreStack, 'MockUserPool');
    
    // Create API stack in the same app
    stack = new ApiStack(app, 'TestApiStack', {
      env: { account: '123456789012', region: 'us-west-2' },
      userPool: mockUserPool,
    });
    
    // Only analyze the API stack
    template = Template.fromStack(stack);
  });

  test('Creates AppSync GraphQL API with correct configuration', () => {
    template.hasResourceProperties('AWS::AppSync::GraphQLApi', {
      Name: Match.stringLikeRegexp('littlebit-graphql-api-.*'),
      AuthenticationType: 'AMAZON_COGNITO_USER_POOLS',
      XrayEnabled: true,
    });
  });

  test('GraphQL API has multiple authentication modes', () => {
    template.hasResourceProperties('AWS::AppSync::GraphQLApi', {
      AdditionalAuthenticationProviders: Match.arrayWith([
        Match.objectLike({
          AuthenticationType: 'API_KEY',
        }),
        Match.objectLike({
          AuthenticationType: 'AWS_IAM',
        }),
      ]),
    });
  });

  test('Creates DynamoDB table for Sample model', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: Match.stringLikeRegexp('Sample-.*'),
      BillingMode: 'PAY_PER_REQUEST',
      PointInTimeRecoverySpecification: {
        PointInTimeRecoveryEnabled: true,
      },
      StreamSpecification: {
        StreamViewType: 'NEW_AND_OLD_IMAGES',
      },
    });
  });

  test('DynamoDB table has byOwner GSI', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      GlobalSecondaryIndexes: [{
        IndexName: 'byOwner',
        KeySchema: [
          {
            AttributeName: 'user_id',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'createdAt',
            KeyType: 'RANGE',
          },
        ],
        Projection: {
          ProjectionType: 'ALL',
        },
      }],
    });
  });

  test('Creates GraphQL resolvers', () => {
    // Check for CreateSample resolver
    template.hasResourceProperties('AWS::AppSync::Resolver', {
      TypeName: 'Mutation',
      FieldName: 'createSample',
    });

    // Check for UpdateSample resolver
    template.hasResourceProperties('AWS::AppSync::Resolver', {
      TypeName: 'Mutation',
      FieldName: 'updateSample',
    });

    // Check for GetSample resolver
    template.hasResourceProperties('AWS::AppSync::Resolver', {
      TypeName: 'Query',
      FieldName: 'getSample',
    });

    // Check for ListSamples resolver
    template.hasResourceProperties('AWS::AppSync::Resolver', {
      TypeName: 'Query',
      FieldName: 'listSamples',
    });
  });

  test('Stack has correct outputs', () => {
    template.hasOutput('GraphQLAPIURL', {
      Description: 'GraphQL API URL',
      Export: {
        Name: 'TestApiStack-GraphQLAPIURL',
      },
    });

    template.hasOutput('GraphQLAPIKey', {
      Description: 'GraphQL API Key',
      Export: {
        Name: 'TestApiStack-GraphQLAPIKey',
      },
    });
  });
});