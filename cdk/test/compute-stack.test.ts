import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { ComputeStack } from '../lib/stacks/compute-stack';

describe('ComputeStack', () => {
  let app: cdk.App;
  let stack: ComputeStack;
  let template: Template;
  let mockBucket: s3.Bucket;

  beforeEach(() => {
    app = new cdk.App();
    
    // Create mock dependencies
    const coreStack = new cdk.Stack(app, 'MockCoreStack');
    mockBucket = new s3.Bucket(coreStack, 'MockBucket');
    
    stack = new ComputeStack(app, 'TestComputeStack', {
      env: { account: '123456789012', region: 'us-west-2' },
      bucket: mockBucket,
      apiEndpoint: 'https://mock-api.appsync.amazonaws.com/graphql',
      apiKey: 'mock-api-key',
      apiId: 'mock-api-id',
      userPoolId: 'mock-user-pool-id',
    });
    template = Template.fromStack(stack);
  });

  test('Creates SQS queue for audio processing', () => {
    template.hasResourceProperties('AWS::SQS::Queue', {
      QueueName: Match.stringLikeRegexp('littlebit-audio-processing-.*'),
      VisibilityTimeout: 900,
      MessageRetentionPeriod: 1209600, // 14 days
    });
  });

  test('Creates Dead Letter Queue', () => {
    template.hasResourceProperties('AWS::SQS::Queue', {
      QueueName: Match.stringLikeRegexp('littlebit-audio-processing-dlq-.*'),
      MessageRetentionPeriod: 1209600, // 14 days
    });
  });

  test('Creates CreateSampleRecord Lambda function', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: Match.stringLikeRegexp('CreateSampleRecord-.*'),
      Runtime: 'nodejs18.x',
      Handler: 'index.handler',
      MemorySize: 128,
      Timeout: 60,
      Environment: {
        Variables: Match.objectLike({
          API_ENDPOINT: 'https://mock-api.appsync.amazonaws.com/graphql',
          ENV: 'dev',
          REGION: 'us-west-2',
        }),
      },
    });
  });

  test('Creates EditandConvertRecordings Lambda function', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: Match.stringLikeRegexp('EditandConvertRecordings-.*'),
      Runtime: 'python3.11',
      Handler: 'index.handler',
      MemorySize: 3008,
      Timeout: 900, // 15 minutes
    });
  });

  test('Lambda functions have correct IAM permissions', () => {
    // Check for SQS permissions
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Effect: 'Allow',
            Action: Match.arrayWith(['sqs:SendMessage']),
          }),
        ]),
      },
    });

    // Check for AppSync permissions
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Effect: 'Allow',
            Action: ['appsync:GraphQL'],
          }),
        ]),
      },
    });
  });

  test('S3 bucket has event notification for Lambda', () => {
    // Note: This is configured on the bucket in the core stack, 
    // but we can verify the Lambda has the necessary permissions
    template.hasResourceProperties('AWS::Lambda::Permission', {
      Action: 'lambda:InvokeFunction',
      Principal: 's3.amazonaws.com',
    });
  });

  test('Stack has correct outputs', () => {
    template.hasOutput('CreateSampleRecordFunctionArn', {
      Description: 'CreateSampleRecord Lambda Function ARN',
      Export: {
        Name: 'TestComputeStack-CreateSampleRecordFunctionArn',
      },
    });

    template.hasOutput('ProcessingQueueUrl', {
      Description: 'Audio Processing SQS Queue URL',
      Export: {
        Name: 'TestComputeStack-ProcessingQueueUrl',
      },
    });
  });
});