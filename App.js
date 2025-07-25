import React, { useState, useEffect } from "react";

// AWS Amplify v6 configuration
import { Amplify } from "aws-amplify";
import Navigator from "./src/navigation/Navigator";
import ConfigurationError from "./src/components/ConfigurationError";
import { ConfigManager } from "./src/config";
import { initializeServices } from "./src/services";

export default function App() {
  const [hasValidConfig, setHasValidConfig] = useState(false);
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load configuration using ConfigManager
        const config = await ConfigManager.load({
          useAwsExports: true // Enable backward compatibility
        });
        
        // Initialize new services with config
        await initializeServices(config);
        
        // Convert to Amplify format and configure
        const amplifyConfig = ConfigManager.toAmplifyFormat(config);
        Amplify.configure(amplifyConfig);
        
        console.log('✅ Application configured successfully');
        // Only log details in development mode
        if (config.environment === 'development') {
          console.log(`Environment: ${config.environment}`);
        }
        
        setHasValidConfig(true);
      } catch (error) {
        console.error('❌ Configuration failed:', error.message);
        setHasValidConfig(false);
      } finally {
        setIsConfigLoaded(true);
      }
    };

    initializeApp();
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

