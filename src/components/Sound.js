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
  ScrollView,
} from "react-native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faPlay, faPause } from "@fortawesome/free-solid-svg-icons";
import { Audio } from "expo-av";
import { Storage, Auth } from "aws-amplify";
import * as FileSystem from "expo-file-system";
import { windowWidth } from "../utils/Dimensions";
import { Player, MediaStates } from "@react-native-community/audio-toolkit";

const Sound = ({ name, url }) => {
  const [soundObject, setSoundObject] = useState();
  const [isPlaying, setIsPlaying] = useState(false);

  const toggleAudioPlayback = () => {
    !isPlaying ? soundObject.playAsync() : soundObject.pauseAsync();
    setIsPlaying(!isPlaying);
  }

  useEffect(() => {
    const loadSound = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync({ uri: url });
        setSoundObject(sound);
      } catch (error) {
        console.log("Unable to load sound: ", error.message);
      }
    };

    const unloadSound = () => {
      soundObject && soundObject.unloadAsync().then();
      setSoundObject(null);
    }

    loadSound();

    return unloadSound();
  }, []);

  console.log(soundObject)

  return (
    <View style={{ flexDirection: "row", padding: 15, alignItems: "center" }}>
      <TouchableOpacity onPress={() => toggleAudioPlayback()}>
        <FontAwesomeIcon icon={!isPlaying ? faPlay : faPause} size={30} color={"black"} />
      </TouchableOpacity>
      <Text style={{ marginLeft: windowWidth / 5, fontSize: 20 }}>{name}</Text>
    </View>
  );
};

export default Sound;
