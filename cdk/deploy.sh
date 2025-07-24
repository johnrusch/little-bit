#!/bin/bash

# Little Bit CDK Deployment Script
# This script deploys all CDK stacks in the correct order

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install it first."
        exit 1
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install Node.js first."
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials are not configured. Please run 'aws configure'."
        exit 1
    fi
    
    print_status "All prerequisites met!"
}

# Get environment
ENV=${1:-dev}
print_status "Deploying to environment: $ENV"

# Get AWS account details
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=${CDK_DEPLOY_REGION:-us-west-2}

print_status "AWS Account: $ACCOUNT_ID"
print_status "AWS Region: $REGION"

# Check prerequisites
check_prerequisites

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing CDK dependencies..."
    npm install
fi

# Build TypeScript
print_status "Building TypeScript..."
npm run build

# Bootstrap CDK if needed
print_status "Checking CDK bootstrap..."
if ! aws cloudformation describe-stacks --stack-name CDKToolkit --region $REGION &> /dev/null; then
    print_status "Bootstrapping CDK..."
    npx cdk bootstrap aws://$ACCOUNT_ID/$REGION
fi

# Deploy stacks
print_status "Deploying Core Stack..."
npx cdk deploy LittleBit-Core-$ENV -c env=$ENV --require-approval never

print_status "Deploying API Stack..."
npx cdk deploy LittleBit-API-$ENV -c env=$ENV --require-approval never

print_status "Deploying Compute Stack..."
npx cdk deploy LittleBit-Compute-$ENV -c env=$ENV --require-approval never

# Get ECR repository URI from ECS stack (it will be created when we deploy it)
print_status "Deploying ECS Stack (without container)..."
npx cdk deploy LittleBit-ECS-$ENV -c env=$ENV --require-approval never

# Get the ECR repository URI
ECR_URI=$(aws cloudformation describe-stacks \
    --stack-name LittleBit-ECS-$ENV \
    --query "Stacks[0].Outputs[?OutputKey=='RepositoryUri'].OutputValue" \
    --output text)

if [ -z "$ECR_URI" ]; then
    print_error "Could not get ECR repository URI"
    exit 1
fi

print_status "ECR Repository URI: $ECR_URI"

# Build and push Docker image
print_status "Building Docker image..."
cd ../amplify/backend/custom/ecs/audio-processing

# Login to ECR
print_status "Logging in to ECR..."
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com

# Build and tag image
print_status "Building and tagging Docker image..."
docker build -t littlebit-audio-processing .
docker tag littlebit-audio-processing:latest $ECR_URI:latest

# Push image
print_status "Pushing Docker image to ECR..."
docker push $ECR_URI:latest

# Return to CDK directory
cd -

# Update ECS service to use the new image
print_status "Updating ECS service with new image..."
aws ecs update-service \
    --cluster littlebit-processing-cluster-LittleBit-ECS-$ENV \
    --service littlebit-audio-processing-service-LittleBit-ECS-$ENV \
    --force-new-deployment \
    --region $REGION

print_status "Deployment complete!"

# Print stack outputs
print_status "Stack outputs:"
echo ""
echo "Core Stack:"
aws cloudformation describe-stacks --stack-name LittleBit-Core-$ENV --query "Stacks[0].Outputs[*].[OutputKey,OutputValue]" --output table

echo ""
echo "API Stack:"
aws cloudformation describe-stacks --stack-name LittleBit-API-$ENV --query "Stacks[0].Outputs[*].[OutputKey,OutputValue]" --output table

echo ""
echo "Compute Stack:"
aws cloudformation describe-stacks --stack-name LittleBit-Compute-$ENV --query "Stacks[0].Outputs[*].[OutputKey,OutputValue]" --output table

echo ""
echo "ECS Stack:"
aws cloudformation describe-stacks --stack-name LittleBit-ECS-$ENV --query "Stacks[0].Outputs[*].[OutputKey,OutputValue]" --output table

print_status "You can now update your frontend configuration with these values!"