# Little Bit CDK Infrastructure

This directory contains the AWS CDK (Cloud Development Kit) infrastructure code for the Little Bit audio processing application. This is part of the migration from AWS Amplify to CDK for improved deployment reliability and control.

## Overview

The CDK infrastructure is organized into three main stacks:

1. **Storage Stack** (`LittleBitStorageStack`)
   - S3 bucket for audio file storage
   - Bucket lifecycle policies
   - CORS configuration
   - Folder structure setup

2. **Lambda Stack** (`LittleBitLambdaStack`)
   - CreateSampleRecord Lambda function
   - EditAndConvertRecordings Lambda function
   - SQS queue for audio processing
   - S3 event notifications
   - IAM roles and permissions

3. **ECS Stack** (`LittleBitEcsStack`)
   - ECS Cluster for Fargate
   - ECR repository for container images
   - Queue-based auto-scaling service
   - VPC and networking configuration
   - CloudWatch logging

## Prerequisites

- Node.js (v14 or higher)
- AWS CLI configured with appropriate credentials
- Docker (for building container images)
- AWS CDK CLI (`npm install -g aws-cdk`)

## Installation

1. Navigate to the CDK directory:
   ```bash
   cd cdk-infrastructure
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Deployment

### Quick Deploy

Use the provided deployment script:

```bash
./deploy.sh
```

This script will:
- Install dependencies
- Build TypeScript code
- Bootstrap CDK (if needed)
- Deploy all stacks in the correct order

### Manual Deployment

1. Build the TypeScript code:
   ```bash
   npm run build
   ```

2. Bootstrap CDK (first time only):
   ```bash
   cdk bootstrap
   ```

3. Deploy stacks:
   ```bash
   # Deploy all stacks
   cdk deploy --all

   # Or deploy individually
   cdk deploy LittleBitStorageStack-dev
   cdk deploy LittleBitLambdaStack-dev
   cdk deploy LittleBitEcsStack-dev
   ```

## Environment Configuration

The infrastructure supports multiple environments. Set the environment using:

```bash
export ENV=dev  # or prod, staging, etc.
```

## Post-Deployment Steps

1. **Build and Push Docker Image**:
   ```bash
   cd ../amplify/backend/custom/ecs/audio-processing
   ./deploy.sh
   ```

2. **Update Lambda Environment Variables**:
   - Update the GraphQL API endpoint and keys in the Lambda functions
   - These values come from your Amplify GraphQL API

3. **Test the Pipeline**:
   - Upload a test audio file to the S3 bucket
   - Verify Lambda functions are triggered
   - Check ECS tasks are running
   - Confirm processed audio is saved correctly

## Stack Outputs

After deployment, important values are output:

- **Storage Stack**:
  - AudioBucketName: S3 bucket name
  - AudioBucketArn: S3 bucket ARN

- **Lambda Stack**:
  - CreateSampleRecordFunctionArn
  - EditAndConvertFunctionArn
  - ProcessingQueueUrl

- **ECS Stack**:
  - ClusterName
  - ECRRepositoryUri
  - ServiceName
  - LogGroupName

## Troubleshooting

### Common Issues

1. **CDK Bootstrap Failed**:
   - Ensure AWS credentials have sufficient permissions
   - Check the correct region is set

2. **Stack Deployment Failed**:
   - Review CloudFormation events in AWS Console
   - Check IAM permissions
   - Verify resource limits haven't been exceeded

3. **Container Not Running**:
   - Check ECR has the latest image
   - Review ECS task logs in CloudWatch
   - Verify IAM task role permissions

### Debugging

View CDK differences before deployment:
```bash
cdk diff --all
```

Synthesize templates for review:
```bash
cdk synth --all
```

## Architecture Decisions

### Why CDK over Amplify?

1. **Better Control**: Direct control over CloudFormation templates
2. **Flexibility**: Can customize complex resources like ECS
3. **Reliability**: Avoid Amplify's UPDATE_ROLLBACK_FAILED issues
4. **Standard Patterns**: Use AWS best practices directly

### Hybrid Approach

We maintain Amplify for:
- Cognito User Pool (authentication)
- AppSync GraphQL API

We migrate to CDK for:
- ECS infrastructure
- S3 bucket configuration
- Lambda functions
- Complex IAM policies

## Security Considerations

- All S3 buckets have encryption enabled
- Public access is blocked on S3
- ECS tasks run with least-privilege IAM roles
- Secrets should be stored in AWS Secrets Manager
- VPC uses private subnets for ECS tasks

## Cost Optimization

- ECS auto-scaling based on queue depth
- S3 lifecycle policies for old files
- CloudWatch log retention set to 1 week
- Fargate Spot can be enabled for cost savings

## Contributing

When making changes:
1. Update TypeScript code in `lib/`
2. Run `npm run build` to compile
3. Use `cdk diff` to review changes
4. Test in dev environment first
5. Create PR with description of changes

## Related Documentation

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/v2/guide/)
- [Main Migration Plan](../amplify-to-cloudformation-migration-plan.md)
- [ECS Deployment Script](../amplify/backend/custom/ecs/audio-processing/deploy.sh)