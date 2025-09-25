# Little Bit - Audio Sample Recorder

A React Native mobile application for recording and automatically editing audio samples into clean one-shots. Built with Expo and AWS Amplify.

## Overview

Little Bit is a mobile app that allows users to:

- Record audio samples using their device's microphone
- Automatically crop recordings to isolate intended content
- Create clean "one-shots" ready for audio production
- Name and save recordings to the cloud
- Browse and playback their recorded samples
- Edit sample metadata
- Secure authentication with user accounts

The app's key feature is its intelligent audio editing capability that automatically detects and crops recordings to only include what was intended to be recorded, eliminating silence and extraneous noise. This creates isolated audio samples that can be immediately incorporated into audio projects without requiring manual editing.

## Tech Stack

- **Frontend**: React Native + Expo
- **Backend**: Direct AWS SDK Integration + AWS CDK Infrastructure
  - Authentication: AWS Cognito (direct SDK)
  - Storage: AWS S3 (direct SDK)
  - API: GraphQL with AWS AppSync (direct SDK)
  - Functions: AWS Lambda (Node.js & Python)
  - Infrastructure: AWS CDK (alternative to Amplify)
- **Audio**: Expo AV
- **Navigation**: React Navigation

### Migration Status: ✅ Complete

The application has been **successfully migrated** from AWS Amplify SDK to direct AWS SDK services, providing:

- **68% smaller bundle size**
- **Better performance and control**
- **Infrastructure-agnostic frontend**
- **Support for CDK, Amplify, or pure CloudFormation deployment**

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- AWS Account (for Amplify backend)
- iOS Simulator (Mac) or Android Emulator

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd little-bit
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Deploy AWS infrastructure:

**Option A: Using AWS CDK (Recommended)**

```bash
cd cdk
npm install
npx cdk bootstrap
npx cdk deploy --all -c testing=true
```

**Option B: Using AWS Amplify (Legacy)**

```bash
amplify init
amplify push
```

4. Generate configuration:

```bash
# For CDK deployment
node scripts/generate-aws-exports.js --env dev

# For Amplify (auto-generated)
# aws-exports.js is created automatically
```

## Running the App

### Development

Start the Expo development server:

```bash
npm start
# or
yarn start
```

This will open Expo DevTools in your browser.

### Platform-specific commands:

- **iOS**: `npm run ios` or press `i` in Expo DevTools
- **Android**: `npm run android` or press `a` in Expo DevTools
- **Web**: `npm run web` or press `w` in Expo DevTools

## Project Structure

```
little-bit/
├── src/
│   ├── api/          # API service modules (legacy)
│   ├── services/     # NEW: Direct AWS SDK services
│   │   ├── auth/     # Cognito authentication service
│   │   ├── storage/  # S3 storage service
│   │   ├── api/      # GraphQL API service
│   │   └── index.js  # Service initialization
│   ├── config/       # NEW: Configuration management
│   │   ├── ConfigManager.js # Central config loader
│   │   └── providers/       # Config providers
│   ├── components/   # Reusable UI components
│   ├── contexts/     # React contexts
│   ├── graphql/      # GraphQL queries and mutations
│   ├── navigation/   # Navigation configuration
│   ├── screens/      # Screen components
│   └── utils/        # Utility functions
├── cdk/              # NEW: AWS CDK infrastructure
│   ├── lib/stacks/   # CDK stack definitions
│   ├── lambda/       # Lambda function code
│   └── graphql/      # GraphQL schema files
├── amplify/          # Legacy: AWS Amplify configuration
├── scripts/          # NEW: Deployment and config scripts
├── environments/     # NEW: Environment configurations
└── App.js           # Main app entry point
```

## Features

### Audio Recording & Automatic Editing

- Real-time audio recording with visual feedback
- High-quality recording presets
- **Intelligent automatic cropping** that detects and isolates intended content
- Creates clean "one-shots" by removing silence and unwanted audio
- Perfect for creating samples for music production, sound design, or audio projects
- Custom naming for recordings
- Automatic cloud upload with processed audio

### Playback

- Stream recorded samples from cloud storage
- Play/pause controls
- Audio state management

### User Authentication

- Secure sign up and login
- Email verification
- Password recovery
- Session management

### Cloud Storage

- Automatic upload to AWS S3
- User-specific storage buckets
- Secure file access

## AWS Services Used

- **Cognito**: User authentication and authorization (direct SDK)
- **S3**: Audio file storage (direct SDK)
- **AppSync**: GraphQL API (direct SDK)
- **DynamoDB**: Sample metadata storage
- **Lambda Functions**:
  - `CreateSampleRecord`: Creates database records for new samples
  - `EditandConvertRecordings`: Performs intelligent audio processing to automatically crop recordings
- **CloudFormation/CDK**: Infrastructure as Code deployment

## Service Architecture

The app uses a modern service layer architecture with feature flags:

### Feature Flags

Control which services to use via environment variables:

```bash
# Enable direct AWS SDK services (recommended)
REACT_APP_USE_NEW_STORAGE=true  # Use S3Service directly
REACT_APP_USE_NEW_AUTH=true     # Use CognitoAuthService directly
REACT_APP_USE_NEW_API=true      # Use GraphQLService directly

# Or fall back to Amplify SDK (legacy)
REACT_APP_USE_NEW_STORAGE=false
REACT_APP_USE_NEW_AUTH=false
REACT_APP_USE_NEW_API=false
```

### Service Layer

- **Gradual Migration**: Switch between Amplify and direct SDK per service
- **Adapter Pattern**: Maintains API compatibility during transition
- **Zero Downtime**: Falls back gracefully if new services fail
- **Production Ready**: Successfully deployed and tested

## Environment Setup

### CDK Deployment (Recommended)

Key files:

- `.env`: Feature flags and local configuration
- `src/aws-exports.js`: Generated from CDK stack outputs
- `cdk/cdk.context.json`: CDK context and settings

### Legacy Amplify Setup

- `amplify/team-provider-info.json`: Team-specific Amplify config
- `src/aws-exports.js`: Auto-generated AWS configuration

### Current Deployment Status ✅

- **Core Stack**: Deployed (Cognito, S3, IAM)
- **API Stack**: Deployed (AppSync, DynamoDB)
- **Configuration**: Generated and working
- **App Status**: Ready to run with new services

## Development Notes

- The app uses Expo's managed workflow
- Audio permissions are required for recording functionality
- iOS silent mode compatibility is enabled
- Web platform is supported but may have limited audio features

## Troubleshooting

1. **Recording permissions**: Ensure microphone permissions are granted
2. **AWS credentials**: Verify Amplify is properly initialized
3. **Build errors**: Clear cache with `expo start -c`
4. **Audio playback issues**: Check device audio settings and silent mode

## License

This project is private and proprietary.
