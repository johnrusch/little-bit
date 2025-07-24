#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CoreStack } from '../lib/stacks/core-stack';
import { ApiStack } from '../lib/stacks/api-stack';
import { ComputeStack } from '../lib/stacks/compute-stack';
import { EcsProcessingStack } from '../lib/stacks/ecs-processing-stack';

const app = new cdk.App();

// Get environment from context
const envName = app.node.tryGetContext('env') || 'dev';

// Environment configurations
const environments: Record<string, cdk.Environment> = {
  dev: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-west-2' },
  staging: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-west-2' },
  prod: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-west-2' }
};

const env = environments[envName] || environments.dev;

// Deploy stacks with explicit dependencies
const coreStack = new CoreStack(app, `LittleBit-Core-${envName}`, {
  env,
  description: 'Little Bit Core Infrastructure - Cognito, S3, IAM',
  tags: {
    Environment: envName,
    Project: 'little-bit',
    Stack: 'core'
  }
});

const apiStack = new ApiStack(app, `LittleBit-API-${envName}`, {
  env,
  userPool: coreStack.userPool,
  description: 'Little Bit API Infrastructure - AppSync GraphQL',
  tags: {
    Environment: envName,
    Project: 'little-bit',
    Stack: 'api'
  }
});
apiStack.addDependency(coreStack);

const computeStack = new ComputeStack(app, `LittleBit-Compute-${envName}`, {
  env,
  bucket: coreStack.audioBucket,
  apiEndpoint: apiStack.graphqlApi.attrGraphQlUrl,
  apiKey: apiStack.apiKey.attrApiKey,
  description: 'Little Bit Compute Infrastructure - Lambda Functions',
  tags: {
    Environment: envName,
    Project: 'little-bit',
    Stack: 'compute'
  }
});
computeStack.addDependency(coreStack);
computeStack.addDependency(apiStack);

const ecsStack = new EcsProcessingStack(app, `LittleBit-ECS-${envName}`, {
  env,
  bucket: coreStack.audioBucket,
  apiEndpoint: apiStack.graphqlApi.attrGraphQlUrl,
  description: 'Little Bit ECS Processing Infrastructure - Audio Processing Service',
  tags: {
    Environment: envName,
    Project: 'little-bit',
    Stack: 'ecs-processing'
  }
});
ecsStack.addDependency(coreStack);
ecsStack.addDependency(apiStack);

// Multi-region deployment example (if enabled)
if (app.node.tryGetContext('deployMultiRegion')) {
  const euEnv = { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'eu-west-1' };
  
  new CoreStack(app, `LittleBit-Core-EU-${envName}`, {
    env: euEnv,
    description: 'Little Bit Core Infrastructure (EU) - Cognito, S3, IAM',
    tags: {
      Environment: envName,
      Project: 'little-bit',
      Stack: 'core',
      Region: 'eu'
    }
  });
}

app.synth();