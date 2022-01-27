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
import { Storage, Auth, Hub } from "aws-amplify";
import RecordIcon from "../../svgs/RecordIcon";
import NavBar from "../components/NavBar";
import * as FileSystem from "expo-file-system";
import UserContext from "../contexts/UserContext";
import NameSoundModal from "../components/recording/NameSoundModal";
import { windowHeight } from "../utils/Dimensions";

const Recorder = (props) => {
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
      const { recording } = await Audio.Recording.createAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
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
    console.log(uri.split(".").slice(-1)[0]);
    setFormat(uri.split(".").slice(-1)[0]);
    const resp = await fetch(uri);
    setBlob(await resp.blob());
    // console.log("Recording stopped and stored at", uri);
    setModalVisible(true);
  };

  const nameRecording = async () => {
    setModalVisible(true);
    saveRecording();
  };

  const saveRecording = async () => {
    // userData.setLoading();
    await Storage.put(`unprocessed/${userData.user}/${text}.${format}`, blob);
    setModalVisible(false);
    setFormat();
    setBlob();
    setText();
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
