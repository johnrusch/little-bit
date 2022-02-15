import React, { useState, useCallback, useRef, useEffect } from "react";
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native";
import Sound from "../components/Sound";
import EditSoundModal from "../components/modals/EditSoundModal";
import { wait } from "../utils/loading";
import { Audio } from "expo-av";
import { PLAYBACK } from "../api";

const Sounds = (props) => {
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
  const [loading, setLoading] = useState(false);
  const [playbackObj, setPlaybackObj] = useState(null);
  const [soundObj, setSoundObj] = useState(null);
  const [currentAudio, setCurrentAudio] = useState({});
  const [activeListItem, setActiveListItem] = useState(null);


  const onPlaybackStatusUpdate = async (playbackStatus) => {
    console.log(playbackStatus, 'BIG HEY');
    if (playbackStatus.didJustFinish && !playbackStatus.isLooping) {
      await playbackStatus.setStatusAsync({
        shouldPlay: false,
        positionMillis: 0,
      });
    }
  };

  const handleAudioPress = async (audio, index) => {
    let status;
    
    // playing audio for the first time
    if (soundObj === null) {
      const playbackObject = new Audio.Sound();
      playbackObject.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
      console.log(Object.keys(playbackObject));
      status = await PLAYBACK.play(playbackObject, audio.url);
      setActiveListItem(index);
      setCurrentAudio(audio);
      setPlaybackObj(playbackObject);
    }

    if (soundObj.isLoaded) {
      if (currentAudio.id === audio.id) {
        // pausing and resuming audio
        if (soundObj.isPlaying) {
          console.log("pausing");
          status = PLAYBACK.pause(playbackObj);
        } else {
          status = PLAYBACK.resume(playbackObj);
        }
      } else {
        // playing new audio
        status = await PLAYBACK.playNext(playbackObj, audio.url);
        setActiveListItem(index);
        setCurrentAudio(audio);
      }
    }

    // pausing audio
    // if (soundObj.isLoaded && soundObj.isPlaying && currentAudio.id === audio.id) {
    //   status = await PLAYBACK.pause(playbackObject);
    //   return setSoundObj(status);
    // }

    // resume audio
    // if (
    //   soundObj.isLoaded &&
    //   !soundObj.isPlaying &&
    //   currentAudio.id === audio.id
    // ) {
    //   status = await PLAYBACK.resume(playbackObject);
    //   return setSoundObj(status);
    // }

    // playing new audio
    // if (soundObj.isLoaded && currentAudio.id !== audio.id) {
    //   status = await PLAYBACK.playNext(playbackObject, audio.url);
    //   setCurrentAudio(audio);
    //   return setSoundObj(status);
    // }

    return setSoundObj(status);

  };

  const renderSounds = (sounds) => {
    return sounds.map((sound, i) => {
      if (!sound) return;
      return (
        <Sound
          sound={sound}
          key={sound.id}
          loading={loading}
          active={activeListItem === i}
          onAudioPress={() => handleAudioPress(sound, i)}
          setSoundToUpdate={setSoundToUpdate}
          refreshing={refreshing}
        />
      );
    });
  };

  // useEffect(() => {
  //   return () => {
  //     if (playbackObj && soundObj.isLoaded) {
  //       playbackObj?.unloadAsync().then(() => {});
  //     }
  //   };
  // });

  return (
    <ScrollView>
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
