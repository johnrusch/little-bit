# ECS Audio Processing Deployment Guide

## Prerequisites

1. **AWS CLI** installed and configured with appropriate credentials
2. **Docker** installed and running
3. **jq** installed (for JSON processing)
   ```bash
   # Install jq on macOS
   brew install jq
   
   # Install jq on Ubuntu/Debian
   sudo apt-get install jq
   ```

## Deployment Steps

### 1. Deploy Lambda Function Changes (if modified)
```bash
# From the project root directory
amplify push
```

### 2. Deploy ECS Container

#### Option A: Deploy to current Amplify environment
```bash
cd amplify/backend/custom/ecs/audio-processing
./deploy.sh
```

#### Option B: Deploy to specific environment
```bash
cd amplify/backend/custom/ecs/audio-processing
./deploy-env.sh dev     # For development
./deploy-env.sh staging # For staging
./deploy-env.sh prod    # For production
```

## What the Deployment Script Does

1. **Authenticates with ECR** - Logs into AWS Elastic Container Registry
2. **Checks/Creates ECR Repository** - Ensures the repository exists
3. **Builds Docker Image** - Builds the container with latest code changes
4. **Tags Image** - Tags the image for ECR
5. **Pushes to ECR** - Uploads the image to AWS
6. **Updates Task Definition** - Creates a new revision with the latest image
7. **Updates Service** (if exists) - For long-running services

## Environment Variables

- `AWS_REGION`: AWS region (default: us-east-1)
- `ENV`: Environment name (default: dev)

## Troubleshooting

### Docker not running
```bash
# macOS
open -a Docker

# Linux
sudo systemctl start docker
```

### AWS credentials not configured
```bash
aws configure
```

### Permission denied errors
Ensure your AWS user/role has permissions for:
- ECR operations (push/pull images)
- ECS operations (update task definitions)
- IAM pass role permissions

## Monitoring Deployment

After deployment, monitor the ECS tasks:
```bash
# List recent tasks
aws ecs list-tasks --cluster little-bit-audio-processing-dev

# Check task status
aws ecs describe-tasks --cluster little-bit-audio-processing-dev --tasks <task-arn>
```

## Rolling Back

To rollback to a previous version:
1. Find the previous task definition revision in AWS Console
2. Update the Lambda environment variable or service to use the previous revision

## Security Notes

- Never commit AWS credentials
- Use IAM roles for ECS tasks
- Ensure ECR images are scanned for vulnerabilities
- Keep base images updated