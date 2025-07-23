import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { LittleBitStorageStack } from '../lib/storage-stack';
import { LittleBitEcsStack } from '../lib/ecs-stack';
import { LittleBitLambdaStack } from '../lib/lambda-stack';

describe('CDK Stack Tests', () => {
  const app = new cdk.App();
  const env = 'test';
  
  test('Storage Stack creates S3 bucket', () => {
    const stack = new LittleBitStorageStack(app, 'TestStorageStack', {
      environmentName: env
    });
    
    const template = Template.fromStack(stack);
    
    // Check S3 bucket is created
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [{
          ServerSideEncryptionByDefault: {
            SSEAlgorithm: 'AES256'
          }
        }]
      },
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true
      }
    });
  });

  test('Lambda Stack creates functions and queue', () => {
    const storageStack = new LittleBitStorageStack(app, 'TestStorageStack2', {
      environmentName: env
    });
    
    const stack = new LittleBitLambdaStack(app, 'TestLambdaStack', {
      environmentName: env,
      audioBucket: storageStack.audioBucket
    });
    
    const template = Template.fromStack(stack);
    
    // Check Lambda functions are created
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: `CreateSampleRecord-${env}`,
      Runtime: 'nodejs18.x'
    });
    
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: `EditandConvertRecordings-${env}`,
      Runtime: 'python3.11'
    });
    
    // Check SQS queue is created
    template.hasResourceProperties('AWS::SQS::Queue', {
      QueueName: `little-bit-audio-processing-${env}`
    });
  });

  test('ECS Stack creates cluster and service', () => {
    const storageStack = new LittleBitStorageStack(app, 'TestStorageStack3', {
      environmentName: env
    });
    
    const lambdaStack = new LittleBitLambdaStack(app, 'TestLambdaStack2', {
      environmentName: env,
      audioBucket: storageStack.audioBucket
    });
    
    const stack = new LittleBitEcsStack(app, 'TestEcsStack', {
      environmentName: env,
      audioBucket: storageStack.audioBucket,
      processingQueue: lambdaStack.processingQueue
    });
    
    const template = Template.fromStack(stack);
    
    // Check ECS cluster is created
    template.hasResourceProperties('AWS::ECS::Cluster', {
      ClusterName: `little-bit-audio-processing-${env}`,
      ClusterSettings: [{
        Name: 'containerInsights',
        Value: 'enabled'
      }]
    });
    
    // Check ECR repository is created
    template.hasResourceProperties('AWS::ECR::Repository', {
      RepositoryName: `little-bit-audio-processing-${env}`,
      ImageScanningConfiguration: {
        ScanOnPush: true
      }
    });
  });
});