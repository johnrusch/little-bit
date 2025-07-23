# Amplify to CDK Migration Guide

This guide provides step-by-step instructions for migrating Little Bit's infrastructure from AWS Amplify to CDK.

## Migration Overview

We're implementing a **hybrid approach** that keeps Amplify for simple resources while migrating complex infrastructure to CDK.

### What Stays in Amplify
- ✅ Cognito User Pool (authentication)
- ✅ AppSync GraphQL API (auto-generated resolvers)

### What Moves to CDK
- 🔄 ECS Audio Processing Service
- 🔄 S3 Bucket with proper notification configuration
- 🔄 Lambda Functions with enhanced control

## Pre-Migration Checklist

- [ ] Backup current Amplify configuration
- [ ] Document all environment variables
- [ ] Export GraphQL API endpoint and keys
- [ ] List all S3 bucket contents
- [ ] Review current Lambda function configurations
- [ ] Check ECS task definitions and environment variables

## Migration Steps

### Phase 1: CDK Setup and Initial Deployment

1. **Install CDK Infrastructure**:
   ```bash
   cd cdk-infrastructure
   npm install
   ```

2. **Configure Environment**:
   ```bash
   export AWS_REGION=us-west-2
   export ENV=dev
   ```

3. **Deploy CDK Stacks**:
   ```bash
   ./deploy.sh
   ```

4. **Verify Resources Created**:
   - Check CloudFormation stacks in AWS Console
   - Verify S3 bucket creation
   - Confirm Lambda functions deployed
   - Check ECS cluster and task definitions

### Phase 2: Data Migration

1. **S3 Bucket Migration**:
   ```bash
   # Get old and new bucket names
   OLD_BUCKET=$(aws s3 ls | grep littlebit | awk '{print $3}')
   NEW_BUCKET=little-bit-audio-dev-[ACCOUNT]-us-west-2

   # Sync data (dry run first)
   aws s3 sync s3://$OLD_BUCKET s3://$NEW_BUCKET --dryrun

   # Actual sync
   aws s3 sync s3://$OLD_BUCKET s3://$NEW_BUCKET
   ```

2. **Update Lambda Environment Variables**:
   - Get GraphQL API details from Amplify
   - Update Lambda functions with new environment variables

### Phase 3: Application Configuration Updates

1. **Update Frontend Configuration**:
   ```javascript
   // src/aws-exports.js or equivalent
   const awsconfig = {
     // ... existing config
     Storage: {
       AWSS3: {
         bucket: 'little-bit-audio-dev-[ACCOUNT]-us-west-2', // New CDK bucket
         region: 'us-west-2'
       }
     }
   };
   ```

2. **Update Backend References**:
   - Update any hardcoded bucket names
   - Update Lambda function ARNs if referenced
   - Update ECS cluster/service names

### Phase 4: Testing and Validation

1. **Test Audio Upload Flow**:
   - Upload a new audio file
   - Verify S3 trigger fires
   - Check Lambda execution logs
   - Confirm ECS task runs
   - Validate processed audio saved

2. **Test Existing Functionality**:
   - List existing audio files
   - Play audio files
   - Edit metadata
   - Delete files

3. **Monitor CloudWatch Logs**:
   ```bash
   # Lambda logs
   aws logs tail /aws/lambda/CreateSampleRecord-dev --follow
   aws logs tail /aws/lambda/EditandConvertRecordings-dev --follow

   # ECS logs
   aws logs tail /ecs/little-bit-audio-processing-dev --follow
   ```

### Phase 5: Cutover

1. **Update DNS/API Endpoints** (if applicable)

2. **Disable Old Resources**:
   ```bash
   # Remove S3 triggers from old bucket
   # Disable old Lambda functions
   # Stop old ECS tasks
   ```

3. **Monitor for Issues**:
   - Watch CloudWatch alarms
   - Check error rates
   - Monitor performance metrics

### Phase 6: Cleanup

1. **Remove from Amplify Backend Config**:
   - Edit `amplify/backend/backend-config.json`
   - Remove migrated resources
   - Run `amplify push` to update

2. **Archive Old Resources**:
   - Export old Lambda function code
   - Document old configurations
   - Create backups before deletion

3. **Delete Old Resources** (after validation period):
   ```bash
   # Delete old S3 bucket (after ensuring all data migrated)
   aws s3 rb s3://$OLD_BUCKET --force

   # Delete old Lambda functions
   # Delete old ECS resources
   ```

## Rollback Plan

If issues arise during migration:

1. **Immediate Rollback**:
   - Update frontend to use old bucket
   - Re-enable old Lambda functions
   - Revert application configuration

2. **Partial Rollback**:
   - Keep CDK infrastructure running
   - Route traffic back to Amplify resources
   - Debug issues while maintaining service

3. **Data Consistency**:
   - Ensure S3 sync is bidirectional during transition
   - Keep both systems running in parallel if needed

## Verification Checklist

- [ ] All audio files accessible in new S3 bucket
- [ ] Lambda functions triggering correctly
- [ ] ECS tasks processing audio successfully
- [ ] No errors in CloudWatch logs
- [ ] Frontend working with new resources
- [ ] Authentication still functioning (Amplify Cognito)
- [ ] GraphQL API queries working (Amplify AppSync)

## Common Issues and Solutions

### Issue: Lambda Cannot Access GraphQL API
**Solution**: Update environment variables with correct API endpoint and key

### Issue: ECS Tasks Failing to Start
**Solution**: 
- Check ECR has latest image
- Verify IAM role permissions
- Review task definition CPU/memory settings

### Issue: S3 Trigger Not Firing
**Solution**:
- Verify notification configuration
- Check Lambda permissions
- Ensure correct prefix/suffix filters

### Issue: Frontend Cannot Access S3
**Solution**:
- Update CORS configuration
- Check Cognito identity pool permissions
- Verify bucket policy

## Post-Migration Optimizations

1. **Enable Cost Optimizations**:
   - Enable S3 Intelligent-Tiering
   - Use Fargate Spot for ECS
   - Set up CloudWatch log retention

2. **Enhance Security**:
   - Enable S3 bucket versioning
   - Implement least-privilege IAM
   - Enable AWS CloudTrail

3. **Improve Monitoring**:
   - Set up CloudWatch dashboards
   - Create alarms for key metrics
   - Enable X-Ray tracing

## Support and Troubleshooting

For issues during migration:
1. Check CloudFormation stack events
2. Review CloudWatch logs
3. Verify IAM permissions
4. Test individual components in isolation

Remember: The hybrid approach means Amplify and CDK will coexist. Ensure clear boundaries between managed resources.