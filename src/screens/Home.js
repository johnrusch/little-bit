import React, { useState } from "react";
import {
  View,
  StatusBar,
  StyleSheet,
  ImageBackground,
  Image,
  Keyboard,
  ActivityIndicator,
} from "react-native";

import RecordIcon from "../../svgs/RecordIcon";
import NavBar from "../components/NavBar";

const Home = () => {
  return (
    <View style={styles.container}>
      <NavBar />
      <View>
        
      </View>
      {/* <RecordIcon style={styles.recordButton} /> */}
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
    borderColor: "red",
    borderWidth: 1,
    alignSelf: "center",
    width: "50%",
  },
});
