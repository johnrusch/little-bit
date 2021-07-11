import React from "react";
import { View, StyleSheet, Text, useWindowDimensions } from "react-native";


const NavBar = () => {
  return (
    <View style={styles.container}>
      <Text>NavBar</Text>
    </View>
  );
};

export default NavBar;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#69FAA0",
    paddingTop: 75,
    paddingLeft: 25,
  },
});
