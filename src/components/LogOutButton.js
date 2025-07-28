import React from "react";
import { Text, TouchableOpacity, StyleSheet } from "react-native";

const LogOutButton = ({ buttonTitle, ...rest }) => {
  return (
    <TouchableOpacity style={styles.buttonContainer} {...rest}>
      <Text style={styles.buttonText}>{buttonTitle}</Text>
    </TouchableOpacity>
  );
};

export default LogOutButton;

const styles = StyleSheet.create({
  buttonContainer: {
    marginTop: 10,
    // backgroundColor: '#69FAA0',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 40,
    marginRight: 10
  },
  buttonText: {
      color: 'black',
      fontSize: 18,
      fontWeight: 'bold',
  }
});
