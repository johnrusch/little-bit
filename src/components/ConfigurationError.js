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
  command: {
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    color: '#495057',
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  container: {
    alignItems: 'center',
    backgroundColor: '#ff6b6b',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  errorBox: {
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 5,
    maxWidth: 400,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    width: '100%',
  },
  instruction: {
    color: '#495057',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  instructionsBox: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 20,
    padding: 16,
  },
  instructionsTitle: {
    color: '#2c3e50',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  message: {
    color: '#34495e',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'center',
  },
  securityNote: {
    color: '#6c757d',
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 16,
    textAlign: 'center',
  },
  title: {
    color: '#2c3e50',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
});

export default ConfigurationError;