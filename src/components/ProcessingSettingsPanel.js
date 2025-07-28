import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import Slider from '@react-native-community/slider';
import { PROCESSING_CONSTANTS } from '../utils/processingDefaults';

const ProcessingSettingsPanel = ({
  settings,
  onSettingsChange,
  visible,
  onToggleVisibility,
  style,
  testID,
}) => {
  const heightAnim = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const rotationAnim = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heightAnim, {
        toValue: visible ? 1 : 0,
        duration: 300,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1),
        useNativeDriver: false,
      }),
      Animated.timing(rotationAnim, {
        toValue: visible ? 1 : 0,
        duration: 300,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1),
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, heightAnim, rotationAnim]);

  const panelHeight = heightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 280],
  });

  const chevronRotation = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const handleSettingChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    onSettingsChange(newSettings);
  };

  const formatThresholdValue = (value) => {
    return `${Math.round(value)} dBFS`;
  };

  const formatDurationValue = (value) => {
    return `${Math.round(value)} ms`;
  };

  return (
    <View style={[styles.container, style]} testID={testID}>
      <TouchableOpacity 
        onPress={onToggleVisibility} 
        style={styles.header}
        activeOpacity={0.7}
      >
        <Text style={styles.headerText}>Processing Settings</Text>
        <Animated.View style={{ transform: [{ rotate: chevronRotation }] }}>
          <FontAwesomeIcon 
            icon={faChevronDown} 
            style={styles.chevronIcon} 
            size={16}
          />
        </Animated.View>
      </TouchableOpacity>
      
      <Animated.View style={[styles.content, { height: panelHeight }]}>
        <View style={styles.settingsContainer}>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Create One-Shot</Text>
              <Text style={styles.settingDescription}>
                Automatically crop silence from recordings
              </Text>
            </View>
            <Switch 
              value={settings.createOneShot}
              onValueChange={(value) => handleSettingChange('createOneShot', value)}
              trackColor={{ false: "#767577", true: "#69FAA0" }}
              thumbColor={settings.createOneShot ? "#ffffff" : "#f4f3f4"}
              ios_backgroundColor="#3e3e3e"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Preserve Original</Text>
              <Text style={styles.settingDescription}>
                Keep unprocessed copy of recording
              </Text>
            </View>
            <Switch 
              value={settings.preserveOriginal}
              onValueChange={(value) => handleSettingChange('preserveOriginal', value)}
              trackColor={{ false: "#767577", true: "#69FAA0" }}
              thumbColor={settings.preserveOriginal ? "#ffffff" : "#f4f3f4"}
              ios_backgroundColor="#3e3e3e"
            />
          </View>

          <View style={styles.sliderContainer}>
            <View style={styles.sliderHeader}>
              <Text style={styles.settingLabel}>Silence Threshold</Text>
              <Text style={styles.sliderValue}>
                {formatThresholdValue(settings.silenceThreshold)}
              </Text>
            </View>
            <Text style={styles.settingDescription}>
              How quiet audio must be to detect silence
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={PROCESSING_CONSTANTS.SILENCE_THRESHOLD_MIN}
              maximumValue={PROCESSING_CONSTANTS.SILENCE_THRESHOLD_MAX}
              value={settings.silenceThreshold}
              onValueChange={(value) => handleSettingChange('silenceThreshold', value)}
              minimumTrackTintColor="#69FAA0"
              maximumTrackTintColor="#d3d3d3"
              thumbStyle={styles.sliderThumb}
              trackStyle={styles.sliderTrack}
              step={1}
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabelText}>More Sensitive</Text>
              <Text style={styles.sliderLabelText}>Less Sensitive</Text>
            </View>
          </View>

          <View style={styles.sliderContainer}>
            <View style={styles.sliderHeader}>
              <Text style={styles.settingLabel}>Min Silence Duration</Text>
              <Text style={styles.sliderValue}>
                {formatDurationValue(settings.minSilenceDuration)}
              </Text>
            </View>
            <Text style={styles.settingDescription}>
              Minimum duration of silence before cropping
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={PROCESSING_CONSTANTS.MIN_SILENCE_DURATION_MIN}
              maximumValue={PROCESSING_CONSTANTS.MIN_SILENCE_DURATION_MAX}
              value={settings.minSilenceDuration}
              onValueChange={(value) => handleSettingChange('minSilenceDuration', value)}
              minimumTrackTintColor="#69FAA0"
              maximumTrackTintColor="#d3d3d3"
              thumbStyle={styles.sliderThumb}
              trackStyle={styles.sliderTrack}
              step={50}
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabelText}>Quick Crop</Text>
              <Text style={styles.sliderLabelText}>Careful Crop</Text>
            </View>
          </View>

        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  chevronIcon: {
    color: '#666',
  },
  container: {
    backgroundColor: '#ffffff',
    borderColor: '#e0e0e0',
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 8,
    overflow: 'hidden',
  },
  content: {
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  settingDescription: {
    color: '#666',
    fontSize: 12,
    lineHeight: 16,
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    color: '#333',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  settingsContainer: {
    padding: 16,
  },
  slider: {
    height: 40,
    marginVertical: 8,
    width: '100%',
  },
  sliderContainer: {
    marginBottom: 20,
  },
  sliderHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sliderLabelText: {
    color: '#999',
    fontSize: 11,
    fontStyle: 'italic',
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sliderThumb: {
    backgroundColor: '#69FAA0',
    height: 20,
    width: 20,
  },
  sliderTrack: {
    borderRadius: 2,
    height: 4,
  },
  sliderValue: {
    color: '#69FAA0',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ProcessingSettingsPanel;