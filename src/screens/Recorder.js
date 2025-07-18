import React, { useState, useEffect, useContext } from "react";
import {
  View,
  StatusBar,
  StyleSheet,
  ImageBackground,
  Image,
  Keyboard,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faMicrophone } from "@fortawesome/free-solid-svg-icons";
import { Audio } from "expo-av";
import { uploadData } from "aws-amplify/storage";
import NavBar from "../components/NavBar";
import * as FileSystem from "expo-file-system";
import UserContext from "../contexts/UserContext";
import NameSoundModal from "../components/modals/NameSoundModal";
import { windowHeight } from "../utils/Dimensions";

const Recorder = (props) => {
  const { user, setLoadingStatus } = props;
  const [recording, setRecording] = useState();
  const [modalVisible, setModalVisible] = useState(false);
  const [format, setFormat] = useState();
  const [blob, setBlob] = useState();

  const [text, setText] = useState(
    `${new Date().toISOString().replace(/(:|\s+)/g, "-")}`
  );

  const userData = useContext(UserContext);

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
      
      // Device-level quality recording preset using uncompressed formats
      // iOS AAC bitrate is limited to 64kbps, so use linear PCM for true high quality
      const DEVICE_QUALITY_PRESET = {
        isMeteringEnabled: true,
        android: {
          extension: '.wav',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_DEFAULT,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_DEFAULT,
          sampleRate: 48000,  // Professional sample rate
          numberOfChannels: 2,
          bitRate: 1536000,   // 48kHz * 16-bit * 2 channels = 1536kbps uncompressed
        },
        ios: {
          extension: '.wav',
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_LINEARPCM,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_MAX,
          sampleRate: 48000,  // Professional sample rate
          numberOfChannels: 2,
          bitRate: 1536000,   // 48kHz * 16-bit * 2 channels = 1536kbps uncompressed
          linearPCMBitDepth: 16, // 16-bit for compatibility
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm;codecs=opus',
          bitsPerSecond: 320000, // High quality Opus encoding
        }
      };
      
      // Try conservative first, fallback to built-in preset if it fails
      let recordingPreset = CONSERVATIVE_HIGH_QUALITY;
      
      const { recording } = await Audio.Recording.createAsync(
        recordingPreset
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

  const nameRecording = async () => {
    setModalVisible(true);
    saveRecording();
  };

  const saveRecording = async () => {
    setLoadingStatus({ loading: true, processingSound: true });
    
    try {
      await uploadData({
        key: `unprocessed/${user}/${text}.${format}`,
        data: blob
      });
      
      // Set a timeout to clear loading state if subscription doesn't trigger
      // This prevents indefinite loading if Lambda fails
      const loadingTimeout = setTimeout(() => {
        setLoadingStatus({ loading: false, processingSound: false });
        console.warn("Recording uploaded but processing may have failed");
      }, 15000); // 15 second timeout
      
      // Store timeout ID to clear it if subscription triggers
      window.loadingTimeout = loadingTimeout;
      
      setModalVisible(false);
      setFormat();
      setBlob();
      setText(`${new Date().toISOString().replace(/(:|\s+)/g, "-")}`);
    } catch (error) {
      console.error("Failed to upload recording:", error);
      setLoadingStatus({ loading: false, processingSound: false });
      // You might want to show an error message to the user here
    }
  };

  const handleTextSubmit = () => {
    setModalVisible(!modalVisible);
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
      <View
        style={{
          flex: 1,
          justifyContent: "center",
        }}
      >
        {renderModal()}

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
    flex: 1,
    backgroundColor: "rgba(255,255,255,1)",
  },
  recordButton: {
    alignSelf: "center",
    width: "50%",
  },
});
