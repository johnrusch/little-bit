import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

const ProcessingStatusIndicator = ({ status = 'idle', progress = 0, error = null, style, testID }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'uploading':
        return '#FFA500';
      case 'processing':
        return '#2196F3';
      case 'completed':
        return '#69FAA0';
      case 'failed':
        return '#FF5722';
      default:
        return '#757575';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'uploading':
        return 'Uploading...';
      case 'processing':
        return 'Processing audio...';
      case 'completed':
        return 'Processing complete';
      case 'failed':
        return 'Processing failed';
      default:
        return 'Ready to record';
    }
  };

  const shouldShowProgress = status === 'processing' && progress >= 0;

  return (
    <View style={[styles.container, style]} testID={testID}>
      <View style={styles.statusRow}>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
        <Text style={styles.statusText}>{getStatusText()}</Text>
      </View>
      
      {shouldShowProgress && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(Math.max(progress, 0), 100)}%`,
                  backgroundColor: getStatusColor(),
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{Math.round(Math.min(Math.max(progress, 0), 100))}%</Text>
        </View>
      )}
      
      {error && (
        <Text style={styles.errorText} numberOfLines={2}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginVertical: 8,
    padding: 12,
  },
  errorText: {
    color: '#FF5722',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  progressBar: {
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    flex: 1,
    height: 4,
    marginRight: 8,
  },
  progressContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 8,
  },
  progressFill: {
    borderRadius: 2,
    height: '100%',
  },
  progressText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '500',
    minWidth: 35,
    textAlign: 'right',
  },
  statusDot: {
    borderRadius: 6,
    height: 12,
    marginRight: 8,
    width: 12,
  },
  statusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 4,
  },
  statusText: {
    color: '#333',
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ProcessingStatusIndicator;