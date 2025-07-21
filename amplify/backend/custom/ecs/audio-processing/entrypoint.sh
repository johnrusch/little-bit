#!/bin/bash
# Entrypoint script for Little Bit Audio Processing Container
# This will be implemented in Phase 2: ECS Audio Processing Container Development

set -e

echo "Little Bit Audio Processing Service - Starting Container"
echo "Phase: ECS Service with SQS Integration"
echo "Container Image: $(date)"

# Check processing mode
PROCESSING_MODE="${PROCESSING_MODE:-task}"
echo "Processing Mode: $PROCESSING_MODE"

if [ "$PROCESSING_MODE" = "service" ]; then
    echo "Running in SERVICE mode - SQS polling loop"
    
    # Validate service mode environment variables
    if [ -z "$SQS_QUEUE_URL" ]; then
        echo "ERROR: Required environment variable SQS_QUEUE_URL is not set for service mode"
        exit 1
    fi
    
    if [ -z "$AWS_DEFAULT_REGION" ]; then
        echo "ERROR: Required environment variable AWS_DEFAULT_REGION is not set"
        exit 1
    fi
    
    echo "SQS Queue URL: $SQS_QUEUE_URL"
    echo "AWS Region: $AWS_DEFAULT_REGION"
    
else
    echo "Running in TASK mode - single execution"
    
    # Validate task mode environment variables
    required_vars=(
        "S3_BUCKET"
        "S3_KEY" 
        "USER_ID"
        "AWS_DEFAULT_REGION"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            echo "ERROR: Required environment variable $var is not set"
            exit 1
        fi
    done
    
    echo "Environment validation passed"
    echo "S3 Bucket: $S3_BUCKET"
    echo "S3 Key: $S3_KEY"
    echo "User ID: $USER_ID"
    echo "AWS Region: $AWS_DEFAULT_REGION"
fi

# Run the audio processor
echo "Starting audio processor..."
exec python3 /app/audio_processor.py