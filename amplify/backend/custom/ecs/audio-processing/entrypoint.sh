#!/bin/bash
# Entrypoint script for Little Bit Audio Processing Container
# This will be implemented in Phase 2: ECS Audio Processing Container Development

set -e

echo "Little Bit Audio Processing Service - Starting Container"
echo "Phase: Infrastructure Setup (Phase 1)"
echo "Container Image: $(date)"

# Validate required environment variables
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

# Run the audio processor
echo "Starting audio processing..."
python3 /app/audio_processor.py

echo "Audio processing completed"