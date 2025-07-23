# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## AWS Configuration

- The AWS region is us-west-2

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

## Infrastructure Migration to CDK

We are migrating from AWS Amplify to CDK for improved deployment reliability. This is a **hybrid approach** where:

### Remains in Amplify
- Cognito User Pool (authentication)
- AppSync GraphQL API

### Migrated to CDK
- ECS infrastructure for audio processing
- S3 bucket with proper event notifications
- Lambda functions with enhanced IAM controls

### CDK Project Structure
- `cdk-infrastructure/` - Contains all CDK code
- `cdk-infrastructure/lib/` - Stack definitions
- `cdk-infrastructure/deploy.sh` - Deployment script

### Important Notes
- The CDK stacks depend on values from Amplify (GraphQL API endpoint, etc.)
- When updating Lambda functions, ensure environment variables are correctly set
- ECS container images must be built and pushed separately using the existing deploy script
- Use `ENV=dev` or `ENV=prod` to deploy to different environments

### Common CDK Commands
```bash
cd cdk-infrastructure
./deploy.sh              # Deploy all stacks
cdk diff --all          # See what changes will be made
cdk synth --all         # Generate CloudFormation templates
cdk destroy --all       # Tear down stacks (use with caution)
```