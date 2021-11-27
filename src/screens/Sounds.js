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

const Sounds = () => {

    return (
        <View>

        </View>
    )
}

export default Sounds;