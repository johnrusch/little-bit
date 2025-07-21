#!/bin/bash

# Quick deployment script with environment selection
# Usage: ./deploy-env.sh [dev|staging|prod]

ENV=${1:-dev}

if [[ ! "$ENV" =~ ^(dev|staging|prod)$ ]]; then
    echo "Error: Invalid environment. Use: dev, staging, or prod"
    echo "Usage: ./deploy-env.sh [dev|staging|prod]"
    exit 1
fi

echo "Deploying to environment: $ENV"
export ENV=$ENV

# Run the main deployment script
./deploy.sh