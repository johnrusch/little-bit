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

  useEffect(() => {
    inputRef.current && inputRef.current.focus();
  }, []);

  return (
    <View style={styles.centeredView}>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          Alert.alert("Modal has been closed.");
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.centeredView}>
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
              onPress={saveRecording}
              style={[styles.button, styles.buttonClose]}
            >
              <Text style={styles.textStyle}>Submit Name</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    position: "absolute",
    top: windowHeight / 2 - 150,
    left: windowWidth / 2 - 150,
    alignItems: "center",
    marginTop: 22,
  },
  modalView: {
    margin: 20,
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
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  buttonClose: {
    backgroundColor: "#69FAA1",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  modalText: {
    marginBottom: 15,
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
