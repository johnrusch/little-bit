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
- **Backend**: AWS Amplify
  - Authentication: AWS Cognito
  - Storage: AWS S3
  - API: GraphQL with AWS AppSync
  - Functions: AWS Lambda (Node.js & Python)
- **Audio**: Expo AV
- **Navigation**: React Navigation

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

3. Configure AWS Amplify:
```bash
amplify init
amplify push
```

4. Create `src/aws-exports.js` file (generated by Amplify)

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
│   ├── api/          # API service modules
│   ├── components/   # Reusable UI components
│   │   └── modals/   # Modal components
│   ├── contexts/     # React contexts
│   ├── graphql/      # GraphQL queries and mutations
│   ├── hooks/        # Custom React hooks
│   ├── models/       # Data models
│   ├── navigation/   # Navigation configuration
│   ├── screens/      # Screen components
│   └── utils/        # Utility functions
├── amplify/          # AWS Amplify backend configuration
│   └── backend/
│       ├── api/      # GraphQL API
│       ├── auth/     # Authentication config
│       ├── function/ # Lambda functions
│       └── storage/  # S3 storage config
├── assets/           # Images and static assets
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

- **Cognito**: User authentication and authorization
- **S3**: Audio file storage
- **AppSync**: GraphQL API
- **DynamoDB**: Sample metadata storage
- **Lambda Functions**:
  - `CreateSampleRecord`: Creates database records for new samples
  - `EditandConvertRecordings`: Performs intelligent audio processing to automatically crop recordings, removing silence and isolating the intended audio content

## Environment Setup

The app requires AWS Amplify to be configured. Key files:
- `amplify/team-provider-info.json`: Team-specific Amplify config
- `src/aws-exports.js`: Auto-generated AWS configuration (not in repo)

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