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
} from "react-native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faMicrophone } from "@fortawesome/free-solid-svg-icons";
import { Audio } from "expo-av";
import { Storage, Auth } from "aws-amplify";
import RecordIcon from "../../svgs/RecordIcon";
import NavBar from "../components/NavBar";
import * as FileSystem from "expo-file-system";
import UserContext from "../contexts/UserContext";


const Recorder = (props) => {
  const [recording, setRecording] = useState();

  const userData = useContext(UserContext);

  console.log(userData.user)

  const startRecording = async () => {
    try {
      console.log("Requesting permissions..");
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      console.log("Starting recording..");
      const { recording } = await Audio.Recording.createAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      setRecording(recording);
      console.log("Recording started", recording);
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  };

  const stopRecording = async () => {
    console.log("Stopping recording...");
    setRecording(undefined);
    const rec = await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    console.log(uri.split('.').slice(-1)[0]);
    const format = uri.split('.').slice(-1)[0];
    const resp = await fetch(uri);
    const blob = await resp.blob();
    await Storage.put(
      `${userData.user}/${new Date().toISOString().replace(/(:|\s+)/g, "-")}.${format}`,
      blob
    );
    console.log("Recording stopped and stored at", uri);
  };

  return (
    <View style={styles.container}>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
        }}
      >
        <TouchableOpacity onPress={recording ? stopRecording : startRecording}>
          <FontAwesomeIcon
            icon={faMicrophone}
            style={styles.recordButton}
            size={150}
            color={recording ? "#FFA164" : "black"}
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
