# Little Bit ECS Audio Processing Infrastructure

This directory contains the AWS ECS Fargate infrastructure for advanced audio processing capabilities. This infrastructure replaces the Lambda-based audio processing with unlimited execution time and scalable resources.

## Phase 1: Infrastructure Setup (Current)

This is Phase 1 of the ECS implementation plan, establishing the foundational infrastructure. The actual audio processing container will be implemented in Phase 2 (Issue #62).

## Architecture Overview

### Components
- **ECS Fargate Cluster**: `little-bit-audio-processing-{env}`
- **ECR Repository**: Container image storage
- **VPC & Networking**: Private subnets with NAT Gateway for secure container execution
- **IAM Roles**: Execution and task roles with minimal required permissions
- **CloudWatch Logs**: Centralized logging for container tasks

### File Structure
```
amplify/backend/custom/ecs/
├── ecs-cluster.yml                 # ECS cluster, VPC, ECR repository
├── iam-roles.yml                   # IAM roles and policies
├── task-definition.json            # ECS task definition template
├── amplify-custom-resources.json   # Amplify integration
├── audio-processing/               # Container implementation (Phase 2)
│   ├── Dockerfile                  # Container build instructions
│   ├── requirements.txt            # Python dependencies
│   ├── audio_processor.py          # Main processing logic (placeholder)
│   └── entrypoint.sh              # Container startup script
└── README.md                       # This file
```

## Deployment

### Prerequisites
- AWS Amplify CLI configured
- Existing Amplify backend with:
  - GraphQL API (`api/littlebitgraphqlAPI`)
  - S3 Storage (`storage/littlebitS3Resource`)
  - Authentication (`auth/littlebit3ededec2`)

### Deployment Status (Phase 1 Complete)
✅ **Core infrastructure deployed and tested in dev environment:**

1. **IAM Roles Stack**: `little-bit-ecs-iam-dev`
   - ECS Task Execution Role: `LittleBitECSTaskExecutionRole-dev`
   - ECS Task Role: `LittleBitECSTaskRole-dev`
   - Lambda ECS Role: `LittleBitLambdaECSRole-dev`

2. **ECR Repository Stack**: `little-bit-ecr-repository-dev`
   - Repository URI: `539825460496.dkr.ecr.us-west-2.amazonaws.com/little-bit/audio-processing-dev`
   - Image scanning enabled, lifecycle policies configured

3. **Current Resources Ready For**:
   - Phase 2: Container development and ECR image deployment
   - Phase 3: Lambda integration using existing IAM roles
   - Phase 4: Full end-to-end testing

**Verification Commands**:
```bash
aws ecs list-clusters --region us-west-2
aws ecr describe-repositories --region us-west-2
aws iam list-roles --path-prefix '/LittleBit' --region us-west-2
```

### Future Amplify Integration
In Phase 3, this will be integrated with Amplify custom resources for automated deployment via `amplify push`.

## Phase 2 Implementation (Issue #62)

The next phase will implement:
- Docker container with PyDub and FFmpeg
- Audio processing algorithms (one-shot creation)
- S3 integration for file operations
- Error handling and CloudWatch logging

## Phase 3 Integration (Issue #63)

Lambda integration will be modified to:
- Trigger ECS tasks instead of Lambda functions
- Pass processing parameters via environment variables
- Update database with processing status

## Phase 4 UI Controls (Issue #64)

UI components will be added to:
- Configure processing parameters
- Monitor processing status
- Display processing results

## Cost Estimation

### ECS Fargate Pricing (us-east-1)
- **vCPU**: $0.04048 per vCPU hour
- **Memory**: $0.004445 per GB hour
- **2-minute processing**: ~$0.003 per file

### Monthly Estimates
- 100 recordings: ~$0.30
- 1,000 recordings: ~$3.00
- 10,000 recordings: ~$30.00

## Security Features

### Network Security
- Private subnets with NAT Gateway
- Security groups with minimal required access
- No direct internet access for containers

### IAM Security
- Separate execution and task roles
- Minimal required permissions
- Resource-specific access controls

### Container Security
- Image scanning enabled in ECR
- Read-only root filesystem (future)
- Non-root user execution (future)

## Monitoring and Logging

### CloudWatch Logs
- Log group: `/ecs/little-bit-audio-processing-{env}`
- 30-day retention policy
- Structured logging format

### CloudWatch Metrics (Future)
- Processing duration
- Success/failure rates
- Resource utilization
- Cost tracking

## Troubleshooting

### Common Issues
1. **Task fails to start**
   - Check IAM permissions
   - Verify ECR image exists
   - Check CloudWatch logs

2. **Network connectivity issues**
   - Verify NAT Gateway configuration
   - Check security group rules
   - Confirm subnet routing

3. **Container health check failures**
   - Review container logs
   - Verify Python dependencies
   - Check AWS SDK configuration

### Debugging Commands
```bash
# List ECS tasks
aws ecs list-tasks --cluster little-bit-audio-processing-dev

# Describe specific task
aws ecs describe-tasks --cluster little-bit-audio-processing-dev --tasks TASK_ARN

# View logs
aws logs get-log-events --log-group-name /ecs/little-bit-audio-processing-dev --log-stream-name STREAM_NAME
```

## Development Workflow

### Phase 1 (Current - Infrastructure)
- ✅ ECS cluster and networking
- ✅ IAM roles and policies
- ✅ ECR repository
- ✅ Task definition template
- ✅ Basic container structure

### Phase 2 (Issue #62 - Container Development)
- [ ] Implement audio processing logic
- [ ] Build and push container image
- [ ] Add comprehensive error handling
- [ ] Implement S3 integration

### Phase 3 (Issue #63 - Lambda Integration)
- [ ] Modify CreateSampleRecord Lambda
- [ ] Implement ECS task triggering
- [ ] Add database status updates
- [ ] End-to-end testing

### Phase 4 (Issue #64 - UI Integration)
- [ ] Add processing controls to UI
- [ ] Implement status monitoring
- [ ] Add processing parameter configuration
- [ ] User documentation

## Related Issues
- **Issue #61**: Phase 1 - ECS Infrastructure Setup (Current)
- **Issue #62**: Phase 2 - Container Development
- **Issue #63**: Phase 3 - Lambda Integration
- **Issue #64**: Phase 4 - UI Integration

## References
- [AWS ECS Fargate Documentation](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html)
- [AWS Amplify Custom Resources](https://docs.amplify.aws/cli/usage/customcf/)
- [ECS Task Definition Reference](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definitions.html)