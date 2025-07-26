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
    alignItems: "center",
    flex: 1,
    height: 52,
    justifyContent: "center", 
    width: 57
  },
  inputDigit: {
    backgroundColor: "#ffffff",
    borderColor: "#c3cddc",
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 20,
    fontWeight: "bold",
    height: 50,
    textAlign: "center",
    width: 55
  },
  inputDigitComplete: {
    backgroundColor: '#FF3366',
    borderRadius: 10,
    height: 52,
    position: "absolute",
    width: 57,
    zIndex: 0
  }
});

export default DigitBox;