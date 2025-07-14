import React from "react";

// AWS Amplify configuration - using fallback until aws-exports.js is regenerated
import Amplify from "aws-amplify";
import { DataStore } from "@aws-amplify/datastore";

// Minimal configuration to prevent crashes until 'amplify pull' regenerates aws-exports.js
const fallbackConfig = {
  Auth: {
    region: 'us-east-1', // Default region - will be overridden by amplify pull
    userPoolId: 'placeholder',
    userPoolWebClientId: 'placeholder',
  },
  Storage: {
    region: 'us-east-1',
    bucket: 'placeholder'
  },
  aws_appsync_graphqlEndpoint: 'placeholder',
  aws_appsync_region: 'us-east-1',
  aws_appsync_authenticationType: 'AMAZON_COGNITO_USER_POOLS'
};

try {
  // Try to import real config, fall back to placeholder if missing
  const awsconfig = require('./src/aws-exports').default;
  Amplify.configure(awsconfig);
  DataStore.configure(awsconfig);
  console.log('✅ AWS Amplify configured with real aws-exports.js');
} catch (error) {
  console.warn('⚠️ aws-exports.js not found, using fallback config. Run "amplify pull" to restore full functionality.');
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

