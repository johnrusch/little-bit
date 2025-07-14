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
        if (awsconfig.aws_user_pools_id && 
            awsconfig.aws_user_pools_id !== 'placeholder' &&
            awsconfig.aws_user_files_s3_bucket && 
            awsconfig.aws_user_files_s3_bucket !== 'placeholder' &&
            awsconfig.aws_appsync_graphqlEndpoint &&
            awsconfig.aws_appsync_graphqlEndpoint !== 'placeholder') {
          
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

