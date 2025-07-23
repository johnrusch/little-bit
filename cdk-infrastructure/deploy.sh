#!/bin/bash

# CDK Infrastructure Deployment Script
# This script deploys the CDK infrastructure for Little Bit audio processing

set -e  # Exit on error

# Configuration
AWS_REGION="${AWS_REGION:-us-west-2}"
ENV="${ENV:-dev}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting CDK Infrastructure Deployment${NC}"
echo "Environment: ${ENV}"
echo "Region: ${AWS_REGION}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install it first.${NC}"
    exit 1
fi

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing CDK dependencies...${NC}"
    npm install
fi

# Build TypeScript
echo -e "${YELLOW}Building TypeScript...${NC}"
npm run build

# Bootstrap CDK if needed
echo -e "${YELLOW}Checking CDK bootstrap status...${NC}"
if ! aws cloudformation describe-stacks --stack-name CDKToolkit --region ${AWS_REGION} &> /dev/null; then
    echo "Bootstrapping CDK..."
    npx cdk bootstrap aws://$(aws sts get-caller-identity --query Account --output text)/${AWS_REGION}
else
    echo "CDK already bootstrapped"
fi

# Synthesize CloudFormation templates
echo -e "${YELLOW}Synthesizing CloudFormation templates...${NC}"
npx cdk synth --all

# Deploy stacks in order
echo -e "${YELLOW}Deploying Storage Stack...${NC}"
npx cdk deploy LittleBitStorageStack-${ENV} --require-approval never

echo -e "${YELLOW}Deploying Lambda Stack...${NC}"
npx cdk deploy LittleBitLambdaStack-${ENV} --require-approval never

echo -e "${YELLOW}Deploying ECS Stack...${NC}"
npx cdk deploy LittleBitEcsStack-${ENV} --require-approval never

# Get outputs
echo -e "${GREEN}Deployment Complete!${NC}"
echo ""
echo "Stack Outputs:"
aws cloudformation describe-stacks --stack-name LittleBitStorageStack-${ENV} --query 'Stacks[0].Outputs' --output table
aws cloudformation describe-stacks --stack-name LittleBitLambdaStack-${ENV} --query 'Stacks[0].Outputs' --output table
aws cloudformation describe-stacks --stack-name LittleBitEcsStack-${ENV} --query 'Stacks[0].Outputs' --output table

echo ""
echo -e "${GREEN}Next Steps:${NC}"
echo "1. Build and push Docker image to ECR using ../amplify/backend/custom/ecs/audio-processing/deploy.sh"
echo "2. Update Lambda environment variables with actual GraphQL API values"
echo "3. Test the audio processing pipeline"