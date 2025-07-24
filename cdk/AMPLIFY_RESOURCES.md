# Amplify Resource Configuration Documentation

This document captures all the Amplify-managed resources and their configurations for migration to CDK.

## 1. Authentication (Cognito)

### User Pool Configuration
- **Name**: `littlebit3ededec2`
- **Sign-in Options**: Email
- **Email Verification**: Required
- **MFA**: Not enabled
- **Password Policy**: Default Cognito policy
- **Auto-verified Attributes**: Email

### User Pool Client
- **Generate client secret**: No
- **OAuth Flows**: Not configured
- **Callback URLs**: Not configured (native app)

## 2. Storage (S3)

### S3 Bucket Configuration
- **Name**: `littlebitS3Resource`
- **Public Access**: Authenticated users only
- **CORS**: Configured for cross-origin access
- **Lifecycle Rules**: None configured
- **Versioning**: Not enabled

### Directory Structure
- `/public/unprocessed/` - Raw uploaded audio files
- `/public/processed/` - Processed audio files
- `/debug/` - Debug and temporary files

### S3 Trigger
- **Function**: CreateSampleRecord Lambda
- **Events**: s3:ObjectCreated:*
- **Prefix**: public/unprocessed/
- **Suffix**: .wav

## 3. API (AppSync GraphQL)

### GraphQL API Configuration
- **Name**: `littlebitgraphqlAPI`
- **Authentication Types**:
  - Primary: Cognito User Pools
  - Additional: API Key, AWS IAM
- **Conflict Resolution**: Auto Merge
- **Schema**: See `graphql/schema.graphql`

### Data Sources
- DynamoDB tables (auto-generated from @model)
- Lambda resolvers (if any)

### Models
- **Sample**: Main data model for audio samples
  - Fields: id, name, user_id, file, processing_status, etc.
  - Auth: Owner-based with public read/create/update

## 4. Functions (Lambda)

### CreateSampleRecord
- **Runtime**: Node.js 18.x
- **Handler**: index.handler
- **Memory**: 128 MB
- **Timeout**: 60 seconds
- **Environment Variables**:
  - `API_LITTLEBITGRAPHQLAPI_GRAPHQLAPIENDPOINTOUTPUT`
  - `API_LITTLEBITGRAPHQLAPI_GRAPHQLAPIIDOUTPUT`
  - `API_LITTLEBITGRAPHQLAPI_GRAPHQLAPIKEYOUTPUT`
  - `AUTH_LITTLEBIT3EDEDEC2_USERPOOLID`
  - `ENV`
  - `REGION`
  - `SQS_QUEUE_URL`
- **IAM Permissions**:
  - S3 read access
  - AppSync GraphQL mutations
  - SQS send message

### EditandConvertRecordings
- **Runtime**: Python 3.11
- **Handler**: index.handler
- **Memory**: 3008 MB
- **Timeout**: 15 minutes
- **Layers**: ffmpeg layer
- **Environment Variables**:
  - `ENV`
  - `REGION`
- **IAM Permissions**:
  - S3 read/write access

## 5. Custom Resources (ECS)

### VPC Configuration
- **CIDR**: 10.0.0.0/16
- **Subnets**:
  - 2 Private: 10.0.1.0/24, 10.0.2.0/24
  - 1 Public: 10.0.3.0/24
- **NAT Gateway**: In public subnet
- **Internet Gateway**: Attached

### ECS Cluster
- **Name**: AudioProcessingCluster
- **Capacity Providers**: FARGATE, FARGATE_SPOT

### ECS Service
- **Name**: AudioProcessingService
- **Task CPU**: 1024
- **Task Memory**: 3072
- **Desired Count**: 1
- **Auto-scaling**: 1-10 tasks based on SQS queue depth

### SQS Queue
- **Name**: AudioProcessingQueue
- **Visibility Timeout**: 900 seconds (15 minutes)
- **Message Retention**: 14 days

### ECR Repository
- **Name**: audio-processing-lambda
- **Lifecycle Policy**: Keep last 10 images

## Environment Variables Mapping

### API Endpoint Pattern
- Dev: `https://{api-id}.appsync-api.us-west-2.amazonaws.com/graphql`
- Staging: Similar pattern with different API ID

### Region
- All environments: `us-west-2`

## Naming Conventions

All resources follow the pattern:
- `{serviceName}{resourceType}{environment}{hash}`
- Example: `littlebit3ededec2` (auth resource)

## Migration Notes

1. **Resource Names**: CDK should generate similar but not identical resource names
2. **IAM Roles**: Need to be carefully recreated with same permissions
3. **S3 Event Notifications**: Must be configured after bucket and Lambda creation
4. **API Keys**: New keys will be generated, need to update any hardcoded references
5. **Environment Variables**: Need to map Amplify environment variable names to CDK outputs