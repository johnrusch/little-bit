import React from "react";
import { StyleSheet, View, TextInput } from "react-native";

const DigitBox = ({inputProps, onBack, digitInput, isFocused, setData, forwardedRef}) => {
  return(
    <View style={styles.digitBox}>
      {isFocused ? <View style={styles.inputDigitComplete}/> : null}
      <TextInput
        value={digitInput}
        onChangeText={setData}
        keyboardType="number-pad"
        onKeyPress={onBack}
        maxLength={1}
        ref={forwardedRef}
        {...inputProps}
        style={styles.inputDigit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  digitBox: {
    flex: 1,
    width: 57,
    height: 52,
    justifyContent: "center", 
    alignItems: "center"
  },
  inputDigitComplete: {
    position: "absolute",
    borderRadius: 10,
    width: 57,
    height: 52,
    zIndex: 0,
    backgroundColor: '#FF3366'
  },
  inputDigit: {
    borderWidth: 1,
    borderColor: "#c3cddc",
    borderRadius: 10,
    backgroundColor: "#ffffff",
    width: 55,
    height: 50,
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center"
  }
});

export default DigitBox;