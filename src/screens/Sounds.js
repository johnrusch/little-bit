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

  // Use ref to store playbackObj for stable callback access
  const playbackObjRef = useRef(null);

  const onPlaybackStatusUpdate = useCallback(async (playbackStatus) => {
    if (playbackStatus.didJustFinish && !playbackStatus.isLooping && playbackObjRef.current) {
      try {
        await playbackObjRef.current.setStatusAsync({
          shouldPlay: false,
          positionMillis: 0,
        });
        // Update component state to reflect finished audio
        const updatedStatus = await playbackObjRef.current.getStatusAsync();
        setSoundObj(updatedStatus);
      } catch (error) {
        console.log('Error updating finished state:', error);
      }
    }
  }, []); // No dependencies to prevent callback recreation

  // Helper function to check if audio has finished
  const isAudioFinished = (soundStatus) => {
    if (!soundStatus) return false;
    return soundStatus.didJustFinish || 
           (soundStatus.positionMillis >= soundStatus.durationMillis && soundStatus.durationMillis > 0);
  };

  // Helper function to determine if audio should show as "playing" in UI
  const isEffectivelyPlaying = (soundStatus) => {
    if (!soundStatus) return false;
    // Show as playing if actually playing OR if buffering and should play (restart scenario)
    return soundStatus.isPlaying || (soundStatus.isBuffering && soundStatus.shouldPlay);
  };

  const handleAudioPress = async (audio, index) => {
    let status;
    
    
    // playing audio for the first time
    if (soundObj === null) {
      const playbackObject = new Audio.Sound();
      playbackObject.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
      status = await PLAYBACK.play(playbackObject, audio.url);
      setActiveListItem(index);
      setCurrentAudio(audio);
      setPlaybackObj(playbackObject);
      playbackObjRef.current = playbackObject; // Store in ref for callback access
    } else if (soundObj && soundObj.isLoaded) {
      // Fallback detection: check if audio has actually finished but state wasn't updated
      const currentStatus = await playbackObj.getStatusAsync();
      const actuallyFinished = isAudioFinished(currentStatus);
      
      if (actuallyFinished && !isAudioFinished(soundObj)) {
        setSoundObj(currentStatus);
      }
      
      if (currentAudio.id === audio.id) {
        // Handle different audio states (use current status for more accurate detection)
        if (isAudioFinished(currentStatus)) {
          // Audio finished, restart from beginning
          // Optimistic update: immediately show as playing/buffering
          setSoundObj({
            ...soundObj,
            isPlaying: false,
            isBuffering: true,
            shouldPlay: true,
            positionMillis: 0,
            didJustFinish: false
          });
          await playbackObj.setStatusAsync({ positionMillis: 0 });
          status = await PLAYBACK.resume(playbackObj);
        } else if (currentStatus.isPlaying) {
          // Audio is playing, pause it
          // Optimistic update: immediately show as paused
          setSoundObj({
            ...soundObj,
            isPlaying: false,
            shouldPlay: false
          });
          status = await PLAYBACK.pause(playbackObj);
        } else {
          // Audio is paused, resume it
          // Optimistic update: immediately show as playing
          setSoundObj({
            ...soundObj,
            isPlaying: true,
            shouldPlay: true
          });
          status = await PLAYBACK.resume(playbackObj);
        }
      } else {
        // playing new audio
        status = await PLAYBACK.playNext(playbackObj, audio.url);
        setActiveListItem(index);
        setCurrentAudio(audio);
      }
    }

    // Update state with actual status after operation
    if (status) {
      setSoundObj(status);
    }

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
          isPlaying={isEffectivelyPlaying(soundObj)}
          selectedSound={currentAudio}
          unableToLoad={soundObj === null && playbackObj !== null}
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
