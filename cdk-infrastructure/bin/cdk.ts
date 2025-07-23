#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { LittleBitEcsStack } from '../lib/ecs-stack';
import { LittleBitStorageStack } from '../lib/storage-stack';
import { LittleBitLambdaStack } from '../lib/lambda-stack';

const app = new cdk.App();

// Get environment from context or default to dev
const env = app.node.tryGetContext('amplifyEnvironment') || 'dev';

// Common tags for all stacks
const commonTags = {
  Environment: env,
  Application: 'little-bit',
  ManagedBy: 'CDK'
};

// Define AWS environment
const awsEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-west-2'
};

// Storage Stack - S3 bucket for audio files
const storageStack = new LittleBitStorageStack(app, `LittleBitStorageStack-${env}`, {
  env: awsEnv,
  tags: commonTags,
  environmentName: env
});

// Lambda Stack - Functions for processing
const lambdaStack = new LittleBitLambdaStack(app, `LittleBitLambdaStack-${env}`, {
  env: awsEnv,
  tags: commonTags,
  environmentName: env,
  audioBucket: storageStack.audioBucket
});

// ECS Stack - Container service for audio processing
const ecsStack = new LittleBitEcsStack(app, `LittleBitEcsStack-${env}`, {
  env: awsEnv,
  tags: commonTags,
  environmentName: env,
  audioBucket: storageStack.audioBucket,
  processingQueue: lambdaStack.processingQueue
});

// Add stack dependencies
lambdaStack.addDependency(storageStack);
ecsStack.addDependency(storageStack);
ecsStack.addDependency(lambdaStack);