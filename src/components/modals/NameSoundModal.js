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
  button: {
    borderRadius: 20,
    elevation: 2,
    padding: 10,
  },
  buttonClose: {
    backgroundColor: "#69FAA1",
  },
  buttonTextStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  centeredView: {
    alignItems: "center",
    borderWidth: 1,
    flex: 1,
    left: windowWidth / 2 - 150,
    marginTop: 22,
    position: "absolute",
    right: windowWidth / 2 - 150,
    top: windowHeight / 2 - 150,
  },
  modalBackground: {
    alignItems: 'center',
    backgroundColor: "rgba(0,0,0,0.5)",
    flex: 1,
    justifyContent: 'center',
  },
  modalText: {
    fontWeight: "800",
    marginBottom: 10,
    textAlign: "center",
  },
  modalView: {
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 20,
    elevation: 5,
    maxWidth: 400,
    padding: 35,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    width: '90%',
  },
  textInput: {
    backgroundColor: "#f0f0f0",
    borderColor: "#ddd",
    borderRadius: 5,
    borderWidth: 1,
    height: 40,
    margin: 12,
    padding: 12,
    width: '100%',
  },
});

export default NameSoundModal;
