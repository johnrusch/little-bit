import React, { useState, useRef, useEffect } from "react";
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  Pressable,
  View,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
} from "react-native";
import { windowHeight, windowWidth } from "../../utils/Dimensions";
const NameSoundModal = ({
  text,
  setText,
  saveRecording,
  modalVisible,
  setModalVisible,
}) => {
  const inputRef = useRef(null);

  const handleSubmit = () => {
    if (text.length < 1) {
      Alert.alert("Please enter a name");
    } else {
      saveRecording();
    }
  };

  useEffect(() => {
    inputRef.current && inputRef.current.focus();
  }, []);

  return (
    <Modal
      style={{ margin: 0 }}
      animationType="slide"
      transparent
      visible={modalVisible}
      onRequestClose={() => {
        new Alert.alert("Modal has been closed.");
        setModalVisible(!modalVisible);
      }}
    >
      <View style={styles.modalBackground}>
        <View style={styles.modalView}>
          <Text style={styles.modalText}>Name your new sample!</Text>
          <TextInput
            ref={inputRef}
            style={styles.textInput}
            onChangeText={(text) => setText(text)}
            defaultValue={text}
            autoFocus={true}
            selectTextOnFocus
          />
          <Pressable
            onPress={() => handleSubmit()}
            style={[styles.button, styles.buttonClose]}
          >
            <Text style={styles.buttonTextStyle}>Submit Name</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    position: "absolute",
    top: windowHeight / 2 - 150,
    left: windowWidth / 2 - 150,
    right: windowWidth / 2 - 150,
    alignItems: "center",
    marginTop: 22,
    borderWidth: 1,
  },
  modalView: {
    flex: 1,
    top: windowHeight / 2 - 150,
    left: windowWidth / 2 - 150,
    right: windowWidth / 2 - 150,
    position: "absolute",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    margin: "auto",
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  buttonClose: {
    backgroundColor: "#69FAA1",
  },
  buttonTextStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  modalText: {
    marginBottom: 10,
    textAlign: "center",
    fontWeight: "800",
  },
  textInput: {
    height: 40,
    padding: 12,
    margin: 12,
    backgroundColor: "transparent",
  },
});

export default NameSoundModal;
