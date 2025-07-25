# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## AWS Configuration

- The AWS region is us-west-2

## AWS SDK Migration

The application is migrating from AWS Amplify SDK to direct AWS SDK services. This migration provides:
- Reduced bundle size (68% reduction)
- Better control over AWS service interactions
- Support for multiple deployment targets (Amplify, CDK, CloudFormation)
- Infrastructure-agnostic frontend

### Service Architecture

The new service layer (`src/services/`) includes:
- **Storage Service**: S3 operations using `@aws-sdk/client-s3`
- **Auth Service**: Cognito operations using `amazon-cognito-identity-js`
- **API Service**: GraphQL operations using `graphql-request`

Each service has:
- Direct implementation (e.g., `S3Service.js`, `CognitoAuthService.js`)
- Adapter for Amplify API compatibility (e.g., `StorageAdapter.js`)
- Feature flag support for gradual migration

### Feature Flags

Control migration with environment variables:
- `REACT_APP_USE_NEW_STORAGE`: Enable new S3 storage service (default: true)
- `REACT_APP_USE_NEW_AUTH`: Enable new Cognito auth service (default: true)
- `REACT_APP_USE_NEW_API`: Enable new GraphQL API service (default: true)

Set any flag to `false` to use the legacy Amplify SDK implementation.

## GraphQL Query Generation

**Important**: The auto-generated GraphQL queries in `src/graphql/queries.js` have a known issue where the `listSamples` query doesn't include the `file` field. This field is necessary for loading S3 URLs for audio playback.

### The Issue
- When running `amplify push` or `amplify codegen`, the queries are regenerated
- The auto-generated `listSamples` query omits the nested `file` object field
- Without this field, sounds cannot be loaded in the app

### The Solution
We use custom GraphQL queries in `src/graphql/customQueries.js` that include all necessary fields. These custom queries:
- Are not overwritten by Amplify codegen
- Include the complete field structure needed by the app
- Should be used instead of the auto-generated queries where needed

### Current Custom Queries
- `listSamplesWithFile` - Used in `src/api/sounds.js` to fetch user sounds with S3 file information

When adding new features that require GraphQL queries with nested fields, consider creating custom queries if the auto-generated ones are incomplete.

## CDK Infrastructure

The project now includes AWS CDK templates as an alternative to Amplify for infrastructure deployment. The CDK implementation is located in the `cdk/` directory.

### CDK Stack Architecture
- **Core Stack**: Cognito User Pool, S3 Bucket, IAM roles
- **API Stack**: AppSync GraphQL API with DynamoDB
- **Compute Stack**: Lambda functions and SQS queue
- **ECS Processing Stack**: VPC, ECS cluster, and audio processing service

### Important CDK Notes
- The S3 event notifications for Lambda triggers are configured in the Compute Stack to avoid circular dependencies
- ECR repository names must be lowercase
- The GraphQL schema is read from `cdk/graphql/schema.graphql`
- Lambda function code is in `cdk/lambda/` directories

### Deployment
To deploy the CDK stacks:
```bash
cd cdk
npm install
npx cdk deploy --all
```

See `cdk/README.md` for detailed deployment instructions and migration guide from Amplify.

## Environment Configuration Management

The project now includes a robust environment configuration management system that replaces Amplify's configuration approach. This system supports multiple environments, provides type-safe configuration access, and maintains backward compatibility with aws-exports.js.

### Configuration System Architecture
- **ConfigManager**: Central configuration loader and validator
- **Multiple sources**: Environment variables, aws-exports.js, and defaults
- **Validation**: Runtime validation of all configuration values
- **Type safety**: JSDoc type definitions for configuration structure

### Configuration Sources (priority order)
1. Environment variables (highest priority)
2. aws-exports.js (backward compatibility)
3. Default values (lowest priority)

### Usage
The configuration system is automatically initialized in App.js:
```javascript
const config = await ConfigManager.load({
  useAwsExports: true // Enable backward compatibility
});
```

### Environment Variables
All configuration can be overridden via environment variables:
- `APP_ENV`: Environment name (development/staging/production)
- `APP_AWS_REGION`: AWS region
- `APP_COGNITO_USER_POOL_ID`: Cognito User Pool ID
- `APP_S3_BUCKET_NAME`: S3 bucket name
- See `environments/README.md` for complete list

### Local Development
1. Copy `environments/.env.example` to `.env.development`
2. Fill in your development values
3. Use a tool like react-native-dotenv to load the values

### Important Notes
- The system maintains full backward compatibility with aws-exports.js
- Configuration is validated at runtime to catch errors early
- All sensitive values should use environment variables, not committed files