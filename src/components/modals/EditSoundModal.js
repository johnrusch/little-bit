import React, { useRef, useState } from "react";
import {
  View,
  Button,
  ActivityIndicator,
  StyleSheet,
  Modal,
  Text,
  TextInput,
} from "react-native";
import { windowHeight, windowWidth } from "../../utils/Dimensions";

const EditSoundModal = ({ modalVisible, updateSound }) => {
  const inputRef = useRef(null);
  const [text, setText] = useState("");

  if (modalVisible) {
    return (
      <Modal
        visible={modalVisible}
        transparent
        onRequestClose={() => {
          Alert.alert("Modal has been closed.");
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.container}>
          <View style={styles.modalView}>
            <TextInput
              ref={inputRef}
              style={styles.textInput}
              onChangeText={(text) => setText(text)}
              defaultValue={text}
              autoFocus={true}
              selectTextOnFocus
            />
          </View>
        </View>
      </Modal>
    );
  } else {
    return null;
  }
};

export default EditSoundModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalView: {
    flex: 1,
    top: windowHeight / 2.25,
    margin: "auto",
  },
  loadingText: {
    flex: 1,
    color: "white",
    margin: "auto",
    fontSize: 18,
  },
  textInput: {
    height: 40,
    padding: 12,
    margin: 12,
    backgroundColor: "transparent",
  },
});
