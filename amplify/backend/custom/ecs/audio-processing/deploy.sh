#!/bin/bash

# ECS Audio Processing Container Deployment Script
# This script builds and deploys the audio processing container to AWS ECS

set -e  # Exit on error

# Configuration
AWS_REGION="${AWS_REGION:-us-east-1}"
ENV="${ENV:-dev}"
ECR_REPO_NAME="little-bit-audio-processing-${ENV}"
ECS_CLUSTER_NAME="little-bit-audio-processing-${ENV}"
ECS_SERVICE_NAME="little-bit-audio-processing-service-${ENV}"
ECS_TASK_FAMILY="little-bit-audio-processing-${ENV}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting ECS Audio Processing Deployment${NC}"
echo "Environment: ${ENV}"
echo "Region: ${AWS_REGION}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}Docker is not running. Please start Docker.${NC}"
    exit 1
fi

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
if [ -z "$AWS_ACCOUNT_ID" ]; then
    echo -e "${RED}Failed to get AWS account ID. Check your AWS credentials.${NC}"
    exit 1
fi

ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_NAME}"

echo -e "${YELLOW}Step 1: Authenticating with ECR${NC}"
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# Check if ECR repository exists, create if it doesn't
echo -e "${YELLOW}Step 2: Checking ECR repository${NC}"
if ! aws ecr describe-repositories --repository-names ${ECR_REPO_NAME} --region ${AWS_REGION} &> /dev/null; then
    echo "Creating ECR repository: ${ECR_REPO_NAME}"
    aws ecr create-repository --repository-name ${ECR_REPO_NAME} --region ${AWS_REGION}
else
    echo "ECR repository already exists: ${ECR_REPO_NAME}"
fi

# Build Docker image
echo -e "${YELLOW}Step 3: Building Docker image${NC}"
cd "$(dirname "$0")"
docker build --platform linux/amd64 -t ${ECR_REPO_NAME}:latest .

# Tag image for ECR
echo -e "${YELLOW}Step 4: Tagging image for ECR${NC}"
docker tag ${ECR_REPO_NAME}:latest ${ECR_URI}:latest

# Push image to ECR
echo -e "${YELLOW}Step 5: Pushing image to ECR${NC}"
docker push ${ECR_URI}:latest

# Get the current task definition
echo -e "${YELLOW}Step 6: Updating ECS task definition${NC}"
TASK_DEFINITION=$(aws ecs describe-task-definition --task-definition ${ECS_TASK_FAMILY} --region ${AWS_REGION})

# Create new task definition with updated image
NEW_TASK_DEF=$(echo $TASK_DEFINITION | jq --arg IMAGE "${ECR_URI}:latest" '.taskDefinition | .containerDefinitions[0].image = $IMAGE | del(.taskDefinitionArn) | del(.revision) | del(.status) | del(.requiresAttributes) | del(.compatibilities) | del(.registeredAt) | del(.registeredBy)')

# Register new task definition
NEW_TASK_DEF_ARN=$(aws ecs register-task-definition --cli-input-json "$NEW_TASK_DEF" --region ${AWS_REGION} --query 'taskDefinition.taskDefinitionArn' --output text)

echo "New task definition registered: ${NEW_TASK_DEF_ARN}"

# Check if service exists
echo -e "${YELLOW}Step 7: Updating ECS service${NC}"
if aws ecs describe-services --cluster ${ECS_CLUSTER_NAME} --services ${ECS_SERVICE_NAME} --region ${AWS_REGION} --query 'services[0].status' --output text 2>/dev/null | grep -q ACTIVE; then
    # Update existing service
    echo "Updating ECS service to use new task definition..."
    aws ecs update-service \
        --cluster ${ECS_CLUSTER_NAME} \
        --service ${ECS_SERVICE_NAME} \
        --task-definition ${NEW_TASK_DEF_ARN} \
        --force-new-deployment \
        --region ${AWS_REGION}
    
    echo -e "${GREEN}Service update initiated!${NC}"
    echo "Waiting for service to stabilize..."
    
    # Wait for service to stabilize
    aws ecs wait services-stable \
        --cluster ${ECS_CLUSTER_NAME} \
        --services ${ECS_SERVICE_NAME} \
        --region ${AWS_REGION}
    
    echo -e "${GREEN}Service successfully updated!${NC}"
else
    echo -e "${YELLOW}Note: ECS service ${ECS_SERVICE_NAME} not found.${NC}"
    echo "Since this is a task-based processing (not a long-running service), deployment is complete."
    echo "The Lambda function will use the new task definition for future processing."
fi

# Display deployment summary
echo -e "${GREEN}Deployment Summary:${NC}"
echo "- Docker image: ${ECR_URI}:latest"
echo "- Task definition: ${NEW_TASK_DEF_ARN}"
echo "- Cluster: ${ECS_CLUSTER_NAME}"
echo "- Region: ${AWS_REGION}"

echo -e "${GREEN}Deployment complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Run 'amplify push' to deploy Lambda function changes"
echo "2. Test the audio processing pipeline with a new recording"