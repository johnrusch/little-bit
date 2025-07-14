import React from "react";

// AWS Amplify v6 configuration
import { Amplify } from "aws-amplify";

// Minimal configuration to prevent crashes until 'amplify pull' regenerates aws-exports.js
const fallbackConfig = {
  Auth: {
    Cognito: {
      region: 'us-east-1', // Default region - will be overridden by amplify pull
      userPoolId: 'placeholder',
      userPoolClientId: 'placeholder',
    }
  },
  Storage: {
    S3: {
      region: 'us-east-1',
      bucket: 'placeholder'
    }
  },
  API: {
    GraphQL: {
      endpoint: 'placeholder',
      region: 'us-east-1',
      defaultAuthMode: 'userPool'
    }
  }
};

try {
  // Try to import real config, fall back to placeholder if missing
  const awsconfig = require('./src/aws-exports').default;
  
  // Validate that we have real config, not placeholder values
  if (awsconfig.Auth?.Cognito?.userPoolId && 
      awsconfig.Auth.Cognito.userPoolId !== 'placeholder' &&
      awsconfig.Storage?.S3?.bucket && 
      awsconfig.Storage.S3.bucket !== 'placeholder') {
    Amplify.configure(awsconfig);
    console.log('✅ AWS Amplify configured with real aws-exports.js');
  } else {
    throw new Error('Invalid aws-exports.js configuration detected');
  }
} catch (error) {
  console.warn('⚠️ aws-exports.js not found or invalid, using fallback config. Run "amplify pull" to restore full functionality.');
  console.warn('🚨 App is running in limited mode - authentication and storage features may not work');
  Amplify.configure(fallbackConfig);
}

import Navigator from "./src/navigation/Navigator";

export default function App() {

  return (
    <>
      <Navigator />
    </>
  );
}

