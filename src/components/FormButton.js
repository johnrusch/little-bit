import React from "react";
import { Text, TouchableOpacity, StyleSheet } from "react-native";

import { windowHeight } from "../utils/Dimensions";

const FormButton = ({ buttonTitle, ...rest }) => {
  return (
    <TouchableOpacity style={styles.buttonContainer} {...rest}>
      <Text style={styles.buttonText}>{buttonTitle}</Text>
    </TouchableOpacity>
  );
};

export default FormButton;

const styles = StyleSheet.create({
  buttonContainer: {
    alignItems: 'center',
    backgroundColor: '#69FAA0',
    borderRadius: 30,
    height: windowHeight / 15,
    justifyContent: 'center',
    marginTop: 10,
    padding: 10,
    width: '100%'
  },
  buttonText: {
      color: '#ffffff',
      fontSize: 18,
      fontWeight: 'bold',
  }
});
