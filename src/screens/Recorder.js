import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faMicrophone } from "@fortawesome/free-solid-svg-icons";
import { Audio } from "expo-av";
import { uploadFile } from "../services/storage";
import { getAPIService } from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { onUpdateSample } from "../graphql/subscriptions";
import NameSoundModal from "../components/modals/NameSoundModal";
import ProcessingSettingsPanel from "../components/ProcessingSettingsPanel";
import ProcessingStatusIndicator from "../components/ProcessingStatusIndicator";
import { 
  DEFAULT_PROCESSING_SETTINGS, 
  validateProcessingSettings, 
  formatProcessingMetadata 
} from "../utils/processingDefaults";

const PROCESSING_TIMEOUT_MS = 30000; // 30 seconds for ECS processing
const SUCCESS_DISPLAY_DELAY_MS = 2000; // 2 seconds to show completion

const Recorder = (props) => {
  const { user, setLoadingStatus } = props;
  const [recording, setRecording] = useState();
  const [modalVisible, setModalVisible] = useState(false);
  const [format, setFormat] = useState();
  const [blob, setBlob] = useState();

  const [text, setText] = useState(
    `${new Date().toISOString().replace(/(:|\s+)/g, "-")}`
  );

  const [processingSettings, setProcessingSettings] = useState(DEFAULT_PROCESSING_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('idle');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingError, setProcessingError] = useState(null);

  const apiService = getAPIService();
  const loadingTimeoutRef = useRef(null);

  useEffect(() => {
    loadProcessingSettings();
  }, []);

  useEffect(() => {
    saveProcessingSettings();
  }, [processingSettings]);

  useEffect(() => {
    if (!user) return;
    
    let isMounted = true;
    
    const subscription = apiService.subscribe({
      query: onUpdateSample,
      variables: { user_id: user }
    }).subscribe({
      next: ({ data }) => {
        if (!isMounted) return;
        
        const updatedSample = data.onUpdateSample;
        if (updatedSample && updatedSample.user_id === user) {
          const status = updatedSample.processing_status;
          
          setProcessingStatus(status ? status.toLowerCase() : 'idle');
          
          if (status === 'PROCESSING') {
            setProcessingProgress(25);
          } else if (status === 'COMPLETED') {
            setProcessingProgress(100);
            setTimeout(() => {
              if (!isMounted) return;
              setLoadingStatus({ loading: false, processingSound: false });
              setProcessingStatus('idle');
              setProcessingProgress(0);
              if (loadingTimeoutRef.current) {
                clearTimeout(loadingTimeoutRef.current);
                loadingTimeoutRef.current = null;
              }
            }, SUCCESS_DISPLAY_DELAY_MS);
          } else if (status === 'FAILED') {
            setProcessingError(updatedSample.processing_error || 'Processing failed');
            setLoadingStatus({ loading: false, processingSound: false });
            if (loadingTimeoutRef.current) {
              clearTimeout(loadingTimeoutRef.current);
              loadingTimeoutRef.current = null;
            }
          }
        }
      },
      error: (error) => {
        console.warn('Processing status subscription error:', error);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    };
  }, [user, apiService, setLoadingStatus]);

  const loadProcessingSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('processingSettings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        const validatedSettings = validateProcessingSettings(parsedSettings);
        setProcessingSettings(validatedSettings);
      }
    } catch (error) {
      console.warn('Failed to load processing settings:', error);
    }
  };

  const saveProcessingSettings = async () => {
    try {
      await AsyncStorage.setItem('processingSettings', JSON.stringify(processingSettings));
    } catch (error) {
      console.warn('Failed to save processing settings:', error);
    }
  };

  const startRecording = async () => {
    try {
      console.log("Requesting permissions..");
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      console.log("Starting recording..");
      
      // Use the exact structure from Expo docs that we know works
      const CONSERVATIVE_HIGH_QUALITY = {
        isMeteringEnabled: true,
        android: {
          extension: '.m4a',
          outputFormat: 2,  // MPEG_4
          audioEncoder: 3,  // AAC
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 256000,  // 2x the default 128kbps
        },
        ios: {
          extension: '.m4a',
          outputFormat: 'mpeg4AAC',
          audioQuality: 0x60,  // MAX quality
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 256000,  // 2x the default 128kbps
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 256000,
        }
      };
      
      
      const { recording } = await Audio.Recording.createAsync(
        CONSERVATIVE_HIGH_QUALITY
      );
      
      // DEBUG: Log actual recording status to verify settings
      console.log("=== RECORDING DEBUG INFO ===");
      console.log("Recording preset used:", CONSERVATIVE_HIGH_QUALITY);
      
      // Check recording status to see actual parameters
      const recordingStatus = await recording.getStatusAsync();
      console.log("Recording status:", recordingStatus);
      
      setRecording(recording);
      // console.log("Recording starteds", recording);
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  };

  const stopRecording = async () => {
    console.log("Stopping recording...");
    setRecording(undefined);
    const rec = await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    
    // DEBUG: Log final recording info
    console.log("=== FINAL RECORDING DEBUG INFO ===");
    console.log("Recording URI:", uri);
    console.log("File extension:", uri.split(".").slice(-1)[0]);
    console.log("Recording result:", rec);
    
    setFormat(uri.split(".").slice(-1)[0]);
    const resp = await fetch(uri);
    const blob = await resp.blob();
    
    // DEBUG: Log blob info
    console.log("Blob size:", blob.size, "bytes");
    console.log("Blob type:", blob.type);
    
    setBlob(blob);
    // console.log("Recording stopped and stored at", uri);
    setModalVisible(true);
  };


  const saveRecording = async () => {
    setLoadingStatus({ loading: true, processingSound: true });
    setProcessingStatus('uploading');
    setProcessingError(null);
    
    try {
      const metadata = formatProcessingMetadata(processingSettings);
      
      await uploadFile({
        key: `unprocessed/${user}/${text}.${format}`,
        data: blob,
        options: {
          metadata: metadata
        }
      });
      
      setProcessingStatus('uploaded');
      
      // Set a timeout to clear loading state if subscription doesn't trigger
      // This prevents indefinite loading if ECS processing fails
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      
      loadingTimeoutRef.current = setTimeout(() => {
        setLoadingStatus({ loading: false, processingSound: false });
        setProcessingStatus('failed');
        setProcessingError("Processing timeout - please try again");
        console.warn("Recording uploaded but processing may have failed");
      }, PROCESSING_TIMEOUT_MS);
      
      setModalVisible(false);
      setFormat();
      setBlob();
      setText(`${new Date().toISOString().replace(/(:|\s+)/g, "-")}`);
    } catch (error) {
      console.error("Failed to upload recording:", error);
      setLoadingStatus({ loading: false, processingSound: false });
      setProcessingStatus('failed');
      setProcessingError(error.message || "Upload failed");
    }
  };


  const renderModal = () => {
    return (
      <NameSoundModal
        text={text}
        setText={setText}
        saveRecording={saveRecording}
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        {renderModal()}

        <ProcessingSettingsPanel
          settings={processingSettings}
          onSettingsChange={setProcessingSettings}
          visible={showSettings}
          onToggleVisibility={() => setShowSettings(!showSettings)}
          style={styles.settingsPanel}
        />

        <ProcessingStatusIndicator
          status={processingStatus}
          progress={processingProgress}
          error={processingError}
          style={styles.statusIndicator}
        />

        <TouchableOpacity onPress={recording ? stopRecording : startRecording}>
          <FontAwesomeIcon
            icon={faMicrophone}
            style={styles.recordButton}
            size={150}
            color={recording ? "#FA7069" : "black"}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Recorder;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(255,255,255,1)",
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  recordButton: {
    alignSelf: "center",
    width: "50%",
  },
  settingsPanel: {
    marginBottom: 16,
  },
  statusIndicator: {
    marginBottom: 24,
  },
});
