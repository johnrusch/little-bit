# ECS Audio Processing Implementation Plan

## Overview

This document outlines the implementation plan for migrating from Lambda-based audio processing to ECS Fargate for advanced audio processing capabilities, specifically to reinstate the automated "one-shot" creation feature that crops audio recordings based on loudness thresholds.

## Current State

### Existing Architecture
- **Lambda Function**: `EditandConvertRecordings` currently performs minimal processing (file copying)
- **Original Feature**: Previously used PyDub's `split_on_silence` with hardcoded parameters
- **Pipeline**: S3 upload → `CreateSampleRecord` Lambda → `EditandConvertRecordings` Lambda → S3 processed files

### Why ECS Over Lambda Enhancement
- No current users - perfect time for architectural improvement
- Lambda limitations for audio processing:
  - 15-minute execution timeout
  - 3GB memory limit
  - 250MB package size constraint
- ECS provides unlimited processing time and scalable resources

## Proposed Architecture

### New Pipeline Flow
1. User uploads audio → `public/unprocessed/{userID}/{filename}`
2. S3 trigger → `CreateSampleRecord` Lambda (creates database record)
3. `CreateSampleRecord` → triggers ECS Fargate task for audio processing
4. ECS container processes audio with PyDub + advanced algorithms
5. Processed files → `public/processed/{userID}/` with metadata
6. ECS task updates database with processing results and status

### ECS Infrastructure Components

#### 1. ECS Cluster
- **Type**: Fargate (serverless containers)
- **Name**: `little-bit-audio-processing`
- **Network**: VPC with private subnets for security

#### 2. Task Definition
```json
{
  "family": "audio-processing-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",      // 1 vCPU (scalable to 4 vCPU)
  "memory": "2048",   // 2GB (scalable to 30GB)
  "taskRoleArn": "arn:aws:iam::ACCOUNT:role/ECSAudioProcessingRole"
}
```

#### 3. Container Image
- **Base**: `python:3.11-slim`
- **Dependencies**: PyDub, FFmpeg, boto3, librosa (future)
- **Storage**: ECR repository for container images

### Audio Processing Algorithm

#### One-Shot Creation Parameters
Based on 2025 best practices research:

- **Silence Threshold**: -30 dBFS (default, configurable -20 to -50 dBFS)
- **Minimum Silence Duration**: 750ms (configurable 500-2000ms)
- **Padding**: 50ms using PyDub's `keep_silence` parameter
- **Auto-Detection**: Analyze audio to suggest optimal thresholds

#### Processing Options
- **Create One-Shot**: Toggle for silence-based cropping
- **Preserve Original**: Always keep unprocessed version
- **Multiple Outputs**: Generate optimized versions for different use cases
- **Format Preservation**: Maintain original audio format and quality

## Implementation Plan

### Phase 1: Infrastructure Setup (Week 1)
**Deliverables**:
- ECS cluster with Fargate configuration
- IAM roles and security policies
- ECR repository for container images
- VPC networking setup
- Amplify custom resources for ECS deployment

**Tasks**:
1. Create ECS cluster via AWS Console/CloudFormation
2. Set up IAM roles with S3, ECS, and logging permissions
3. Configure VPC with private subnets for container security
4. Create ECR repository for audio processing images
5. Add Amplify custom resources for ECS management

### Phase 2: Container Development (Week 2)
**Deliverables**:
- Docker container with audio processing capabilities
- PyDub-based one-shot creation algorithm
- S3 integration for file operations
- Error handling and logging

**Tasks**:
1. Create Dockerfile with Python 3.11 + audio dependencies
2. Implement audio processing script with configurable parameters
3. Add S3 upload/download handlers with retry logic
4. Implement comprehensive error handling and CloudWatch logging
5. Build and push initial container image to ECR

### Phase 3: Lambda Integration (Week 3)
**Deliverables**:
- Updated `CreateSampleRecord` Lambda to trigger ECS
- Parameter passing via environment variables
- Database integration for processing status
- End-to-end testing

**Tasks**:
1. Modify `CreateSampleRecord` to use ECS `runTask` API
2. Implement parameter passing via container environment variables
3. Add processing status tracking in database
4. Create monitoring and alerting for ECS task failures
5. Test complete pipeline with sample audio files

### Phase 4: UI Integration (Week 4)
**Deliverables**:
- Processing controls in Recorder screen
- Metadata passing for user preferences
- Processing status indicators
- User documentation

**Tasks**:
1. Add collapsible settings panel to Recorder screen
2. Implement processing parameter controls (toggles, sliders)
3. Update S3 upload to include processing metadata
4. Add processing status indicators in UI
5. Create user documentation for new features

## Technical Specifications

### File Structure
```
amplify/backend/custom/ecs/
├── audio-processing/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── audio_processor.py
│   └── entrypoint.sh
├── ecs-cluster.yml
├── task-definition.json
└── iam-roles.yml

src/components/
├── ProcessingSettingsPanel.js
└── ProcessingStatusIndicator.js
```

### Processing Parameters
```javascript
const processingSettings = {
  createOneShot: true,           // Enable one-shot creation
  silenceThreshold: -30,         // dBFS threshold for silence
  minSilenceDuration: 750,       // Minimum silence duration (ms)
  autoDetectThreshold: true,     // Auto-analyze optimal threshold
  preserveOriginal: true,        // Keep unprocessed version
  outputFormats: ['original']    // Future: multiple format support
};
```

### ECS Task Environment Variables
```bash
S3_BUCKET=little-bit-storage
S3_KEY=public/unprocessed/user123/recording.m4a
USER_ID=user123
PROCESSING_PARAMS='{"createOneShot":true,"silenceThreshold":-30}'
DATABASE_TABLE=Sample-table-name
REGION=us-east-1
```

## Cost Analysis

### ECS Fargate Pricing
- **vCPU**: $0.04048 per vCPU hour
- **Memory**: $0.004445 per GB hour
- **Example**: 2-minute processing task = ~$0.003 per file

### Comparison with Lambda
- **Lambda**: Fixed pricing regardless of processing complexity
- **ECS**: Pay only for actual processing time
- **Break-even**: ECS becomes cost-effective for processing > 30 seconds

### Monthly Cost Estimates
- **100 recordings/month**: ~$0.30
- **1,000 recordings/month**: ~$3.00
- **10,000 recordings/month**: ~$30.00

## Future Enhancements

### Advanced Audio Processing
- **AI-powered silence detection** using librosa/TensorFlow
- **Automatic audio enhancement** (noise reduction, normalization)
- **Batch processing** for multiple files
- **Real-time audio effects** processing

### Scalability Features
- **Auto-scaling** based on queue depth
- **Multi-region deployment** for global users
- **Custom audio format** support
- **Machine learning model** integration

## Risk Mitigation

### Technical Risks
- **Container startup time**: Mitigated by Fargate's fast cold starts
- **Processing failures**: Comprehensive error handling and retries
- **Cost overruns**: Monitoring and alerts for unusual usage patterns
- **Debugging complexity**: Structured logging and CloudWatch integration

### Operational Risks
- **ECS learning curve**: Comprehensive documentation and testing
- **Amplify integration**: Custom resources may require manual setup
- **Monitoring gaps**: CloudWatch dashboards and alarms for all components

## Success Metrics

### Technical Metrics
- **Processing time**: < 2 minutes for typical 30-second recordings
- **Success rate**: > 99% successful processing
- **Cost per processing**: < $0.005 per file
- **Container startup**: < 30 seconds for cold starts

### User Experience Metrics
- **Processing transparency**: Clear status indicators and progress
- **Parameter control**: Intuitive UI for processing settings
- **Quality improvement**: Measurable improvement in one-shot quality
- **Error recovery**: Graceful handling of processing failures

## Conclusion

This ECS-based approach provides a robust, scalable foundation for advanced audio processing while maintaining cost efficiency and enabling future enhancements. The implementation timeline allows for careful testing and validation at each phase, ensuring a reliable production deployment.

The migration from Lambda to ECS positions the app for advanced audio processing capabilities that would be impossible within Lambda's constraints, while providing better cost control and performance for audio processing workloads.