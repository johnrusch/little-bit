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
  ScrollView
} from "react-native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faPlay } from "@fortawesome/free-solid-svg-icons";
import { Audio } from "expo-av";
import { Storage, Auth } from "aws-amplify";
import * as FileSystem from "expo-file-system";
import { windowWidth } from '../utils/Dimensions';

const Sound = ({ name, url }) => {
    const [soundObject, setSoundObject] = useState();

    useEffect(() => {
        const loadSound = async () => {
            try {
                const { sound } = Audio.Sound.createAsync({uri: url})
                // setSoundObject(sound);
            } catch (error) {
               console.log("Unable to load sound: ", error.message); 
            }
        }

        // loadSound();
    }, [])

  return (
    <View style={{ flexDirection: 'row', padding: 15, alignItems: 'center' }}>
      <FontAwesomeIcon
        icon={faPlay}
        size={30}
        color={"black"}
      />
      <Text style={{ marginLeft: windowWidth / 5, fontSize: 20 }}>{name}</Text>
    </View>
  );
};

export default Sound;
