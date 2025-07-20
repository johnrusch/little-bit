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
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginVertical: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    minWidth: 35,
    textAlign: 'right',
  },
  errorText: {
    fontSize: 12,
    color: '#FF5722',
    marginTop: 4,
    fontStyle: 'italic',
  },
});

export default ProcessingStatusIndicator;