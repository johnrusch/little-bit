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
  ScrollView
} from "react-native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faMicrophone } from "@fortawesome/free-solid-svg-icons";
import { Audio } from "expo-av";
import { Storage, Auth } from "aws-amplify";
import RecordIcon from "../../svgs/RecordIcon";
import NavBar from "../components/NavBar";
import Sound from "../components/Sound";
import * as FileSystem from "expo-file-system";
import UserContext from "../contexts/UserContext";

const Sounds = (props) => {

  const userData = useContext(UserContext);

  const renderSounds = sounds => {
    return sounds.map((sound, i) => {
      if (!sound) return;
      return <Sound name={sound.name || "untitled"} url={sound.url} key={i}/>
    })
  }

  return (
    <ScrollView style={styles.container}>
      <View
        style={{
          flex: 1
        }}
      >
        {userData.sounds && renderSounds(userData.sounds)}
      </View>
    </ScrollView>
  );
};

export default Sounds;

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
