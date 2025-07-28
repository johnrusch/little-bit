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
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.65)",
    flex: 1,
    justifyContent: "center",
  },
  loadingText: {
    color: "white",
    flex: 1,
    fontSize: 18,
    margin: "auto",
  },
  modalView: {
    flex: 1,
    margin: "auto",
    top: windowHeight / 2.25,
  },
  textInput: {
    backgroundColor: "transparent",
    height: 40,
    margin: 12,
    padding: 12,
  },
});
