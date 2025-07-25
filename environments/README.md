# Environment Configuration

This directory contains environment-specific configuration files for the Little Bit application.

## Overview

The application uses a hierarchical configuration system that loads settings from multiple sources:

1. **Default values** - Built-in defaults for each environment
2. **aws-exports.js** - Legacy Amplify configuration (backward compatibility)
3. **Environment variables** - Override any setting via environment variables

## Configuration Priority

Configuration sources are merged in the following order (highest priority wins):
1. Environment variables (highest priority)
2. aws-exports.js (if present)
3. Default values (lowest priority)

## Environment Variables

All configuration values can be set via environment variables using the following naming convention:

### AWS Services
- `APP_AWS_REGION` - AWS region (default: us-west-2)
- `APP_COGNITO_USER_POOL_ID` - Cognito User Pool ID
- `APP_COGNITO_CLIENT_ID` - Cognito App Client ID
- `APP_COGNITO_IDENTITY_POOL_ID` - Cognito Identity Pool ID
- `APP_S3_BUCKET_NAME` - S3 bucket for audio files
- `APP_APPSYNC_ENDPOINT` - GraphQL API endpoint
- `APP_APPSYNC_API_KEY` - GraphQL API key
- `APP_SQS_QUEUE_URL` - SQS queue URL (optional)

### API Configuration
- `APP_API_BASE_URL` - Base URL for API calls
- `APP_API_TIMEOUT` - API timeout in milliseconds

### Feature Flags
- `APP_FEATURE_AUDIO_PROCESSING` - Enable audio processing (true/false)
- `APP_FEATURE_SOCIAL_SHARING` - Enable social sharing (true/false)
- `APP_FEATURE_ANALYTICS` - Enable analytics (true/false)

## Local Development

For local development, you can:

1. Copy `.env.example` to `.env.development`
2. Fill in your development environment values
3. Load the file in your development environment

**Note**: .env files are not automatically loaded by React Native. You'll need to use a tool like `react-native-dotenv` or manually set environment variables.

## CDK Integration

If you're using the CDK deployment, you can generate the configuration automatically:

```bash
# Generate aws-exports.js from CDK outputs
node scripts/generate-aws-exports.js --env development
```

This will read the CDK stack outputs and create an aws-exports.js file that the ConfigManager can use.

## Environments

The application supports three environments:
- **development** - Local development environment
- **staging** - Pre-production testing
- **production** - Live production environment

Set the environment using the `APP_ENV` variable:
```bash
APP_ENV=development npm start
```

## Security

**Important**: Never commit sensitive configuration values to the repository!

- Use environment variables for sensitive data
- aws-exports.js should be in .gitignore
- For production, use AWS Parameter Store or Secrets Manager

## Troubleshooting

### Configuration not loading
1. Check that all required fields are set
2. Look for validation errors in the console
3. Ensure AWS credentials are properly configured

### Invalid configuration errors
The ConfigManager validates all configuration before use. Check the console for specific validation errors.

### Environment variables not working
Make sure environment variables are properly exported or set in your shell/IDE before starting the application.