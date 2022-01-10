import React from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faMicrophone, faPlay } from "@fortawesome/free-solid-svg-icons";

const NavBar = (props) => {

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => props.navigation.navigate("Recorder")}>
        <FontAwesomeIcon
          icon={faMicrophone}
          size={40}
          color={props.navigation.getState().index === 0 ? "#FFA164" : "black"}
        />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => props.navigation.navigate("Sounds")}>
        <FontAwesomeIcon
          icon={faPlay}
          size={40}
          color={props.navigation.getState().index === 1 ? "#FFA164" : "black"}
        />
      </TouchableOpacity>
    </View>
  );
};

export default NavBar;

const styles = StyleSheet.create({
  container: {
    // flex: 1,
    flexDirection: "row",
    backgroundColor: "#69FAA0",
    padding: 25,
    justifyContent: "space-between",
  },
});
