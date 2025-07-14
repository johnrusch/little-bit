import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const ConfigurationError = () => {
  return (
    <View style={styles.container}>
      <View style={styles.errorBox}>
        <Text style={styles.title}>🔧 Configuration Required</Text>
        
        <Text style={styles.message}>
          AWS Amplify configuration is missing or invalid. The app cannot start without proper backend configuration.
        </Text>
        
        <View style={styles.instructionsBox}>
          <Text style={styles.instructionsTitle}>To fix this issue:</Text>
          <Text style={styles.instruction}>1. Open terminal in project directory</Text>
          <Text style={styles.instruction}>2. Run: <Text style={styles.command}>amplify pull</Text></Text>
          <Text style={styles.instruction}>3. Follow the prompts to configure AWS</Text>
          <Text style={styles.instruction}>4. Restart the app</Text>
        </View>
        
        <Text style={styles.securityNote}>
          🔒 For security reasons, the app will not start with placeholder configuration values.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ff6b6b',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorBox: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 24,
    maxWidth: 400,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#34495e',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  instructionsBox: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  instruction: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 8,
    lineHeight: 20,
  },
  command: {
    fontFamily: 'monospace',
    backgroundColor: '#e9ecef',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
  },
  securityNote: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 16,
  },
});

export default ConfigurationError;