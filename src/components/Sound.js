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
import { faPlay, faPause, faFrown } from "@fortawesome/free-solid-svg-icons";
import { Audio } from "expo-av";
import { Storage, Auth } from "aws-amplify";
import * as FileSystem from "expo-file-system";
import { windowWidth } from "../utils/Dimensions";
import { Player, MediaStates } from "@react-native-community/audio-toolkit";

const Sound = ({ name, url, setUpdatedSound }) => {
  const soundObject = React.useRef(new Audio.Sound());
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState();
  const [duration, setDuration] = useState();
  const [fileNotLoaded, setFileNotLoaded] = useState(false);

  const handleIfPlayable = () => {
    if (fileNotLoaded) {
    }
  }

  const toggleAudioPlayback = () => {
    if (!soundObject.current._loaded) {
      setFileNotLoaded(true);
      return;
    }
    !isPlaying ? soundObject.current.playAsync() : soundObject.current.pauseAsync();
    setIsPlaying(!isPlaying);
  };

  const onPlaybackStatusUpdate = async playbackStatus => {
    if (!playbackStatus.isLoaded) {
      await loadSound();
      if (playbackStatus.error) {
        console.log(`Encountered a fatal error during playback: ${playbackStatus.error}`);
        // Send Expo team the error on Slack or the forums so we can help you debug!
      }
    } else {
      setFileNotLoaded(false);
    }

    setPosition(playbackStatus.positionMillis);
    setDuration(playbackStatus.durationMillis);

    if (playbackStatus.didJustFinish && !playbackStatus.isLooping) {
      setIsPlaying(false);
      await soundObject.current.setStatusAsync({ shouldPlay: false, positionMillis: 0 });
    }
  }

  const loadSound = async () => {
    try {
      await soundObject.current.loadAsync({ uri: url }, {volume: 0.8}, true);
      await soundObject.current.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
    } catch (error) {
      console.log("Unable to load sound: ", error.message);
      setFileNotLoaded(true);
    }
  };

  useEffect(() => {

    const unloadSound = () => {
      soundObject.current && soundObject.current.unloadAsync().then();
    };

    loadSound();

    return unloadSound();
  }, []);

  return (
    <View style={{ flexDirection: "row", padding: 15, alignItems: "center", backgroundColor: 'rgba(255,255,255,1)' }}>
      <TouchableOpacity style={{ marginRight: 15 }}onPress={() => toggleAudioPlayback()}>
        <FontAwesomeIcon
          icon={fileNotLoaded ? faFrown : !isPlaying ? faPlay : faPause}
          size={30}
          color={fileNotLoaded ? "#AD2D26" : "black"}
        />
      </TouchableOpacity>
      <View style={{ alignItems: 'center', flex: 1 }}>
        <Text style={{ fontSize: 20 }}>
          {name}
        </Text>
        {fileNotLoaded && <Text style={{ color: "#AD2D26" }}>
          Unable to load sound
        </Text>}
      </View>
    </View>
  );
};

export default Sound;
