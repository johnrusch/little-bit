import React, { useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import Sound from "../components/Sound";
import EditSoundModal from "../components/modals/EditSoundModal";

const Sounds = (props) => {
  const { user, sounds } = props;
  const [modalVisible, setModalVisible] = useState(false);
  const [updateSound, setUpdateSound] = useState({});

  const renderSounds = (sounds) => {
    return sounds.map((sound, i) => {
      if (!sound) return;
      return (
        <Sound
          name={sound.name || "untitled"}
          url={sound.url}
          key={i}
          setUpdateSound={setUpdateSound}
        />
      );
    });
  };

  return (
    <ScrollView style={styles.container}>
      {sounds && renderSounds(sounds)}
      <EditSoundModal modalVisible={modalVisible} setModalVisible={setModalVisible} updateSound={updateSound} />
    </ScrollView>
  );
};

export default Sounds;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,1)",
  },
  recordButton: {
    alignSelf: "center",
    width: "50%",
  },
});
