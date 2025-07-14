import React, { useState, useEffect } from "react";

// AWS Amplify v6 configuration
import { Amplify } from "aws-amplify";
import Navigator from "./src/navigation/Navigator";
import ConfigurationError from "./src/components/ConfigurationError";

export default function App() {
  const [hasValidConfig, setHasValidConfig] = useState(false);
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);

  useEffect(() => {
    const initializeAmplify = async () => {
      try {
        // Try to import real config
        const awsconfig = require('./src/aws-exports').default;
        
        // Validate that we have real config, not placeholder values
        if (awsconfig.Auth?.Cognito?.userPoolId && 
            awsconfig.Auth.Cognito.userPoolId !== 'placeholder' &&
            awsconfig.Storage?.S3?.bucket && 
            awsconfig.Storage.S3.bucket !== 'placeholder' &&
            awsconfig.API?.GraphQL?.endpoint &&
            awsconfig.API.GraphQL.endpoint !== 'placeholder') {
          
          Amplify.configure(awsconfig);
          console.log('✅ AWS Amplify configured with real aws-exports.js');
          setHasValidConfig(true);
        } else {
          console.error('❌ Invalid aws-exports.js configuration detected - contains placeholder values');
          setHasValidConfig(false);
        }
      } catch (error) {
        console.error('❌ aws-exports.js not found or failed to load:', error.message);
        setHasValidConfig(false);
      } finally {
        setIsConfigLoaded(true);
      }
    };

    initializeAmplify();
  }, []);

  // Show loading state while checking configuration
  if (!isConfigLoaded) {
    return null; // Or you could show a loading spinner here
  }

  // Show error screen if configuration is invalid
  if (!hasValidConfig) {
    return <ConfigurationError />;
  }

  // Show normal app if configuration is valid
  return <Navigator />;
}

