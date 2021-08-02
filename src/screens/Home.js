import React, { useState } from "react";
import {
  View,
  StatusBar,
  StyleSheet,
  ImageBackground,
  Image,
  Keyboard,
  ActivityIndicator,
  Text
} from "react-native";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faMicrophone } from '@fortawesome/free-solid-svg-icons'

import RecordIcon from "../../svgs/RecordIcon";
import NavBar from "../components/NavBar";

const Home = () => {
  const [recording, setRecording] = useState(false);


  return (
    <View style={styles.container}>
      {/* <Text>Hey</Text> */}
      <View style={{ borderColor: 'red', borderWidth: 2, flex: 1}}>
        <FontAwesomeIcon icon={ faMicrophone } style={styles.recordButton} size={ 128 } color={recording ? '#FFA164' : 'black'}/>
      </View>
      <NavBar />
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,1)"
  },
  recordButton: {
    borderColor: "red",
    borderWidth: 1,
    alignSelf: "center",
    width: "50%",
    marginBottom: '50%'
  },
});
