import React, { useState, useCallback } from "react";
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native";
import Sound from "../components/Sound";
import EditSoundModal from "../components/modals/EditSoundModal";
import { wait } from "../utils/loading";

const Sounds = (props) => {
  const { user, sounds, setLoadingStatus, setSounds, setRefreshing, refreshing } = props;
  const [modalVisible, setModalVisible] = useState(false);
  const [soundToUpdate, setSoundToUpdate] = useState({});

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    wait(1500).then(() => {
      setRefreshing(false);
    });
  }, []);

  const renderSounds = (sounds) => {
    return sounds.map((sound, i) => {
      if (!sound) return;
      return (
        <Sound
          name={sound.name || "untitled"}
          url={sound.url}
          key={i}
          setSoundToUpdate={setSoundToUpdate}
          refreshing={refreshing}
        />
      );
    });
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {sounds && renderSounds(sounds)}
      <EditSoundModal
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        soundToUpdate={soundToUpdate}
      />
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
