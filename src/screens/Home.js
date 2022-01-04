import React, { useState, useEffect } from "react";
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
import { Audio } from 'expo-av';
import { Storage, Auth } from 'aws-amplify';
import RecordIcon from "../../svgs/RecordIcon";
import NavBar from "../components/NavBar";
import * as FileSystem from 'expo-file-system';

const Home = (props) => {
  const [recording, setRecording] = useState();
  const [userEmail, setUserEmail] = useState();
  const [userSounds, setUserSounds] = useState([]);

  const login = props.route.params

  const startRecording = async () => {
    try {
      console.log('Requesting permissions..');
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      }); 
      console.log('Starting recording..');
      const { recording } = await Audio.Recording.createAsync(
         Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      setRecording(recording);
      console.log('Recording started', recording);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    console.log('Stopping recording...');
    setRecording(undefined);
    const rec = await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    const resp = await fetch(uri);
    const blob = await resp.blob();
    await Storage.put(`${userEmail}/${new Date().toISOString().replace(/(:|\s+)/g, "-")}.m4a`, blob); 
    console.log('Recording stopped and stored at', uri);
  }

  const getUser = async () => {
    const user = await Auth.currentAuthenticatedUser();
    console.log('GETTING USER', user.attributes.email)
    setUserEmail(user.attributes.email.split('@')[0]);
  }

  const listSounds = async (email) => {
    const files = await Storage.list(`${email}/`);
    const arr = [];
    for (const file of files) {
      const sound = await Storage.get(file.key);
      console.log(sound);
      arr.push(file.key);
    }
    console.log(arr);
    setUserSounds(arr);
  }

  useEffect(() => {
    getUser();
  }, [])

  useEffect(() => {
    listSounds(userEmail);
    console.log(userSounds);
  }, [userEmail])

  return (
    <View style={styles.container}>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
        }}
      >
        {console.log("LOGIN??", userEmail)}
        <TouchableOpacity onPress={recording ? stopRecording : startRecording}>
          <FontAwesomeIcon
            icon={faMicrophone}
            style={styles.recordButton}
            size={150}
            color={recording ? "#FFA164" : "black"}
          />
        </TouchableOpacity>
      </View>
      <NavBar />
    </View>
  );
};

export default Home;

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
