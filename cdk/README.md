# Little Bit CDK Infrastructure

This directory contains AWS CDK (Cloud Development Kit) templates that replicate all Amplify-managed resources for the Little Bit application. These templates provide an alternative deployment method that is independent of Amplify CLI while maintaining full compatibility with the existing application.

## Overview

The CDK implementation is organized into four main stacks:

1. **Core Stack**: Cognito User Pool, S3 Bucket, IAM roles
2. **API Stack**: AppSync GraphQL API with DynamoDB
3. **Compute Stack**: Lambda functions and SQS queue
4. **ECS Processing Stack**: VPC, ECS cluster, and audio processing service

## Prerequisites

- Node.js 18.x or later
- AWS CLI configured with appropriate credentials
- Docker (for building ECS container images)
- AWS CDK CLI: `npm install -g aws-cdk`

## Initial Setup

1. Install dependencies:
```bash
cd cdk
npm install
```

2. Bootstrap CDK (one-time per account/region):
```bash
npx cdk bootstrap aws://ACCOUNT-NUMBER/us-west-2
```

## Configuration

### Environment Variables

Set these environment variables before deployment:

```bash
export CDK_DEPLOY_ACCOUNT=your-aws-account-id
export CDK_DEPLOY_REGION=us-west-2
```

### Environment-Specific Deployment

Deploy to different environments using context:

```bash
# Development (default)
npx cdk deploy --all

# Staging
npx cdk deploy --all -c env=staging

# Production
npx cdk deploy --all -c env=prod
```

## Deployment

### Full Deployment

Deploy all stacks in the correct order:

```bash
npx cdk deploy --all
```

### Individual Stack Deployment

Deploy stacks individually (respecting dependencies):

```bash
# 1. Deploy Core Stack first
npx cdk deploy LittleBit-Core-dev

# 2. Deploy API Stack
npx cdk deploy LittleBit-API-dev

# 3. Deploy Compute Stack
npx cdk deploy LittleBit-Compute-dev

# 4. Deploy ECS Stack
npx cdk deploy LittleBit-ECS-dev
```

### Building and Pushing Docker Image

Before deploying the ECS stack, build and push the Docker image:

```bash
# Get the ECR repository URI from the ECS stack output
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin ACCOUNT.dkr.ecr.us-west-2.amazonaws.com

# Build and tag the image
cd ../amplify/backend/custom/ecs/audio-processing
docker build -t littlebit-audio-processing .
docker tag littlebit-audio-processing:latest ACCOUNT.dkr.ecr.us-west-2.amazonaws.com/littlebit-audio-processing-dev:latest

# Push the image
docker push ACCOUNT.dkr.ecr.us-west-2.amazonaws.com/littlebit-audio-processing-dev:latest
```

## Stack Outputs

After deployment, important values are exported as CloudFormation outputs:

### Core Stack Outputs
- `UserPoolId`: Cognito User Pool ID
- `UserPoolClientId`: Cognito User Pool Client ID
- `IdentityPoolId`: Cognito Identity Pool ID
- `AudioBucketName`: S3 bucket name for audio files

### API Stack Outputs
- `GraphQLAPIURL`: AppSync GraphQL endpoint
- `GraphQLAPIID`: AppSync API ID
- `GraphQLAPIKey`: API key for public access

### Compute Stack Outputs
- `ProcessingQueueUrl`: SQS queue URL for audio processing

### ECS Stack Outputs
- `RepositoryUri`: ECR repository URI for Docker images
- `ServiceArn`: ECS service ARN

## Migration from Amplify

To migrate from existing Amplify infrastructure:

1. **Export existing data**: Back up DynamoDB tables and S3 content
2. **Deploy CDK stacks**: Follow deployment instructions above
3. **Update frontend configuration**: 
   - Replace `aws-exports.js` with CDK outputs
   - Update API endpoints and authentication config
4. **Migrate data**: Import backed-up data to new resources
5. **Update DNS**: Point any custom domains to new resources
6. **Test thoroughly**: Verify all functionality works
7. **Decommission Amplify resources**: Once verified, remove old resources

## Updating Frontend Configuration

Create a new configuration file with CDK outputs:

```javascript
// src/aws-exports-cdk.js
export default {
  aws_project_region: 'us-west-2',
  aws_cognito_identity_pool_id: 'IDENTITY_POOL_ID_FROM_CDK',
  aws_cognito_region: 'us-west-2',
  aws_user_pools_id: 'USER_POOL_ID_FROM_CDK',
  aws_user_pools_web_client_id: 'CLIENT_ID_FROM_CDK',
  aws_appsync_graphqlEndpoint: 'GRAPHQL_URL_FROM_CDK',
  aws_appsync_region: 'us-west-2',
  aws_appsync_authenticationType: 'AMAZON_COGNITO_USER_POOLS',
  aws_appsync_apiKey: 'API_KEY_FROM_CDK',
  aws_user_files_s3_bucket: 'BUCKET_NAME_FROM_CDK',
  aws_user_files_s3_bucket_region: 'us-west-2',
};
```

## Multi-Region Deployment

Deploy to multiple regions:

```bash
# Deploy to EU region
npx cdk deploy --all -c deployMultiRegion=true
```

## Disaster Recovery

In case of Amplify service issues:

1. Ensure you have recent backups of data
2. Deploy CDK stacks to new region if needed
3. Update frontend to point to new endpoints
4. Restore data from backups

## Monitoring

Monitor deployed resources:

- CloudWatch Logs: `/ecs/littlebit-audio-processing-*`
- ECS Service metrics in CloudWatch
- AppSync metrics and logs
- Lambda function logs

## Troubleshooting

### Common Issues

1. **Docker image not found**: Ensure image is pushed to ECR before ECS deployment
2. **Permission errors**: Check IAM roles and policies match Amplify permissions
3. **S3 trigger not working**: Verify Lambda has proper S3 event permissions
4. **API errors**: Check AppSync logs and ensure resolvers are configured

### Debug Commands

```bash
# Check stack status
npx cdk list

# View stack differences
npx cdk diff

# Synthesize CloudFormation template
npx cdk synth

# View stack outputs
aws cloudformation describe-stacks --stack-name LittleBit-Core-dev --query "Stacks[0].Outputs"
```

## Cost Optimization

- ECS uses FARGATE_SPOT for cost savings
- DynamoDB uses on-demand billing
- S3 lifecycle rules clean up debug files
- CloudWatch logs have retention policies

## Security

- All resources follow least-privilege IAM policies
- S3 bucket has encryption enabled
- VPC uses private subnets for ECS tasks
- API requires authentication for mutations

## Cleanup

To remove all resources:

```bash
# Remove in reverse order of dependencies
npx cdk destroy LittleBit-ECS-dev
npx cdk destroy LittleBit-Compute-dev
npx cdk destroy LittleBit-API-dev
npx cdk destroy LittleBit-Core-dev
```

**Warning**: This will delete all resources including data. Back up important data first!

## Contributing

When modifying CDK templates:

1. Run `npm run build` to compile TypeScript
2. Run `npx cdk diff` to preview changes
3. Test in development environment first
4. Update this documentation if adding new resources

## Support

For issues or questions:
- Check CloudFormation events for deployment errors
- Review CloudWatch logs for runtime errors
- Consult AWS CDK documentation
- Reference the original Amplify configuration in `AMPLIFY_RESOURCES.md`