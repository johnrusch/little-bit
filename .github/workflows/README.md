# GitHub Actions CI/CD Workflows

This directory contains the CI/CD pipeline workflows that replace AWS Amplify's deployment system. These workflows provide full control over build, test, and deployment processes.

## Workflows Overview

### Continuous Integration (`ci.yml`)
- **Triggers**: All pushes and pull requests
- **Jobs**:
  - Linting & formatting checks
  - Unit and integration tests (Node 18.x and 20.x)
  - Bundle size analysis
  - Security vulnerability scanning
  - CDK template validation
- **Required for**: All pull requests to pass

### Infrastructure Deployment (`infrastructure.yml`)
- **Triggers**: 
  - Manual workflow dispatch
  - Pull requests with CDK changes (diff only)
- **Features**:
  - Deploy individual or all CDK stacks
  - Environment-specific deployments
  - CDK diff comments on PRs
  - Rollback procedures
- **Environments**: dev, staging, prod

### Environment Deployments

#### Development (`deploy-dev.yml`)
- **Triggers**: Push to `develop` branch
- **Automatic**: Yes
- **Features**:
  - Deploys CDK infrastructure
  - Builds and deploys frontend
  - Runs post-deployment tests
  - No approval required

#### Staging (`deploy-staging.yml`)
- **Triggers**: Push to `staging` branch
- **Automatic**: Yes
- **Features**:
  - Full deployment pipeline
  - Integration test suite
  - Performance testing
  - Pre-production validation

#### Production (`deploy-production.yml`)
- **Triggers**: 
  - Push tags matching `v*`
  - Manual workflow dispatch
- **Automatic**: No (requires approval)
- **Features**:
  - Manual approval gate
  - Pre-deployment backups
  - Version management
  - Automated rollback on failure
  - CloudFront invalidation
  - Release creation

## Setup Requirements

### AWS Configuration

1. **OIDC Provider Setup**:
   ```bash
   aws iam create-open-id-connect-provider \
     --url https://token.actions.githubusercontent.com \
     --client-id-list sts.amazonaws.com \
     --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
   ```

2. **IAM Roles**: Create deployment roles for each environment with trust policy:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": {
           "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
         },
         "Action": "sts:AssumeRoleWithWebIdentity",
         "Condition": {
           "StringEquals": {
             "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
           },
           "StringLike": {
             "token.actions.githubusercontent.com:sub": [
               "repo:johnrusch/little-bit:ref:refs/heads/master",
               "repo:johnrusch/little-bit:ref:refs/heads/develop",
               "repo:johnrusch/little-bit:ref:refs/heads/staging",
               "repo:johnrusch/little-bit:ref:refs/tags/v*",
               "repo:johnrusch/little-bit:pull_request"
             ]
           }
         }
       }
     ]
   }
   ```
   
   **Note**: Adjust the allowed refs based on your environment:
   - Development role: Allow `develop` branch and pull requests
   - Staging role: Allow `staging` branch
   - Production role: Allow `master` branch and version tags (`v*`)

### GitHub Secrets

Required secrets for each environment:

#### Global Secrets
- `AWS_ACCOUNT_ID`: AWS account ID
- `CODECOV_TOKEN`: Codecov integration token (optional)

#### Development Environment
- `AWS_DEPLOY_ROLE_DEV`: ARN of development deployment role
- `AWS_GITHUB_ACTIONS_ROLE`: ARN for read-only operations

#### Staging Environment
- `AWS_DEPLOY_ROLE_STAGING`: ARN of staging deployment role

#### Production Environment
- `AWS_DEPLOY_ROLE_PROD`: ARN of production deployment role

### GitHub Environments

Configure these environments in repository settings:

1. **development**
   - No protection rules
   - Auto-deploy enabled

2. **staging**
   - No protection rules
   - Integration tests required

3. **production**
   - Required reviewers: 1
   - Deployment branches: tags only
   - Environment URL: https://littlebit.app

4. **production-approval**
   - Required reviewers: 2
   - Wait timer: 5 minutes

## Usage

### Manual Infrastructure Deployment

```bash
# Deploy all stacks to development
gh workflow run infrastructure.yml -f environment=dev -f stack=all

# Deploy only API stack to staging
gh workflow run infrastructure.yml -f environment=staging -f stack=api
```

### Production Release

```bash
# Create and push a version tag
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# Or manually trigger
gh workflow run deploy-production.yml -f tag=v1.0.0
```

### Monitoring Deployments

View deployment status:
- GitHub Actions tab
- Deployment environments page
- CloudFormation console
- Generated deployment issues (production only)

## Troubleshooting

### Common Issues

1. **CDK Diff Fails**: Ensure AWS credentials are configured correctly
2. **Tests Timeout**: Check if services are accessible from GitHub runners
3. **Deployment Fails**: Review CloudFormation events in AWS console
4. **Bundle Too Large**: Check bundle analysis comments on PR

### Rollback Procedures

#### Automatic Rollback (Production)
- Triggered on deployment failure
- Creates rollback issue for tracking

#### Manual Rollback
```bash
# Revert to previous version
git revert <commit>
git push

# Or redeploy previous version
gh workflow run deploy-production.yml -f tag=v0.9.0
```

## Best Practices

1. **Version Tags**: Use semantic versioning (v1.0.0)
2. **Branch Protection**: Enable required status checks
3. **Secrets Rotation**: Rotate AWS credentials quarterly
4. **Monitoring**: Set up CloudWatch alarms for deployments
5. **Documentation**: Update deployment notes in releases

## Migration from Amplify

To fully migrate from Amplify:

1. ✅ Set up these workflows
2. ✅ Configure AWS OIDC and roles
3. ✅ Add required secrets
4. ⏳ Test deployments in each environment
5. ⏳ Remove Amplify CLI dependencies
6. ⏳ Update documentation

## Support

For issues or questions:
- Check workflow run logs
- Review AWS CloudFormation events
- Open an issue with the `deployment` label