import React, { useState, useCallback, useRef, useEffect } from "react";
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native";
import Sound from "../components/Sound";
import EditSoundModal from "../components/modals/EditSoundModal";
import { wait } from "../utils/loading";
import { Audio } from "expo-av";

const Sounds = (props) => {
  const [playbackObject, setPlaybackObject] = useState(new Audio.Sound());
  const [selectedSound, setSelectedSound] = useState(null);
  const {
    user,
    sounds,
    setLoadingStatus,
    setSounds,
    setRefreshing,
    refreshing,
  } = props;
  const [modalVisible, setModalVisible] = useState(false);
  const [soundToUpdate, setSoundToUpdate] = useState({});
  const [unableToLoad, setUnableToLoad] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    wait(1500).then(() => {
      setRefreshing(false);
    });
  }, []);

  const onPlaybackStatusUpdate = async (playbackStatus) => {
    if (!playbackStatus.isLoaded) {
      await loadSound();
      if (playbackStatus.error) {
        console.log(
          `Encountered a fatal error during playback: ${playbackStatus.error}`
        );
        // Send Expo team the error on Slack or the forums so we can help you debug!
      }
    } else {
      setUnableToLoad(false);
    }

    if (playbackStatus.didJustFinish && !playbackStatus.isLooping) {
      setIsPlaying(false);
      await playbackObject.setStatusAsync({
        shouldPlay: false,
        positionMillis: 0,
      });
    }
  };

  const loadSound = useCallback(async (sound, retries = 0) => {
    console.log("loading sound");
    if (retries > 5) {
      setUnableToLoad(true);
      return;
    }
    try {
      if (!playbackObject._loading) {
        await playbackObject.loadAsync(
          { uri: sound.url },
          { volume: 0.8, shouldPlay: true },
          true
        );
      }
      playbackObject.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
      setIsPlaying(true);
    } catch (error) {
      console.log("Unable to load sound: ", error.message);
      setUnableToLoad(true);
    }

    const status = await playbackObject.getStatusAsync();
    console.log(Object.keys(playbackObject));
    if (!status.isLoaded) {
      loadSound(retries + 1);
    } else {
      setIsLoaded(true);
    }
  }, []);

  const renderSounds = (sounds) => {
    return sounds.map((sound, i) => {
      if (!sound) return;
      return (
        <Sound
          sound={sound}
          key={i}
          isPlaying={isPlaying}
          loading={loading}
          unableToLoad={unableToLoad}
          selectedSound={selectedSound}
          setSelectedSound={setSelectedSound}
          setSoundToUpdate={setSoundToUpdate}
          refreshing={refreshing}
        />
      );
    });
  };

  useEffect(() => {
    setLoading(true);
    if (selectedSound) {
      console.log('sound selected');
      if (playbackObject) {
        console.log('playback object exists');
        playbackObject.unloadAsync().then(() => {
          loadSound()
            .catch((error) => {
              console.log('error loading sound', error);
            });
        });
      } else {
        console.log("no playback object");
        loadSound()
          .catch((error) => {
            console.log('error loading sound', error);
          });
      }
    }
    setLoading(false);
    return () => {
      playbackObject?.unloadAsync().then(() => {});
    };
  }, [selectedSound]);

  return (
    <ScrollView
      
      contentContainerStyle={styles.container}
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
