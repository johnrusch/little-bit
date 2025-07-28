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
    alignItems: 'center',
    borderRadius: 40,
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 10,
    padding: 10
  },
  buttonText: {
      color: 'black',
      fontSize: 18,
      fontWeight: 'bold',
  }
});
