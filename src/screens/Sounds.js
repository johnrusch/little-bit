import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { View, StyleSheet, FlatList, RefreshControl, Text } from "react-native";
import Sound from "../components/Sound";
import SoundListHeader from "../components/SoundListHeader";
import EditSoundModal from "../components/modals/EditSoundModal";
import { wait } from "../utils/loading";
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from "expo-av";
import { PLAYBACK, SOUNDS } from "../api";

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
  const [searchText, setSearchText] = useState('');
  const [sortValue, setSortValue] = useState('createdAt-desc');

  // Use ref to store playbackObj for stable callback access
  const playbackObjRef = useRef(null);

  // Cleanup audio objects when component unmounts
  useEffect(() => {
    return () => {
      if (playbackObjRef.current) {
        try {
          // Stop any playing audio and unload to free memory
          // Handle async operations properly to avoid race conditions
          playbackObjRef.current.stopAsync().catch(console.error);
          playbackObjRef.current.unloadAsync().catch(console.error);
          playbackObjRef.current = null;
        } catch (error) {
          console.log('Error during audio cleanup:', error);
        }
      }
      // Reset component state to prevent inconsistencies
      setPlaybackObj(null);
      setSoundObj(null);
      setCurrentAudio({});
      setActiveListItem(null);
    };
  }, []);

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
    
    // Input validation
    if (!audio || !audio.url || typeof index !== 'number') {
      console.error('Invalid audio parameters:', { audio, index });
      return;
    }
    
    // playing audio for the first time
    if (soundObj === null) {
      try {
        // Set high-quality audio mode for playback
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          interruptionModeIOS: InterruptionModeIOS.DuckOthers,
          shouldDuckAndroid: true,
          interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
          playThroughEarpieceAndroid: false,
          staysActiveInBackground: false,
        });
        
        const playbackObject = new Audio.Sound();
        playbackObject.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
        status = await PLAYBACK.play(playbackObject, audio.url);
        setActiveListItem(index);
        setCurrentAudio(audio);
        setPlaybackObj(playbackObject);
        playbackObjRef.current = playbackObject; // Store in ref for callback access
      } catch (error) {
        console.error('Error playing audio:', error);
        return;
      }
    } else if (soundObj && soundObj.isLoaded) {
      try {
        // Fallback detection: check if audio has actually finished but state wasn't updated
        const currentStatus = await playbackObj.getStatusAsync();
        const actuallyFinished = isAudioFinished(currentStatus);
        
        // Only update if state is actually different to avoid unnecessary renders
        if (actuallyFinished && !isAudioFinished(soundObj)) {
          setSoundObj(currentStatus);
        }
        
        if (currentAudio.id === audio.id) {
          // Handle different audio states (use current status for more accurate detection)
          if (isAudioFinished(currentStatus)) {
            // Audio finished, restart from beginning
            const optimisticState = {
              ...soundObj,
              isPlaying: false,
              isBuffering: true,
              shouldPlay: true,
              positionMillis: 0,
              didJustFinish: false
            };
            setSoundObj(optimisticState);
            
            try {
              await playbackObj.setStatusAsync({ positionMillis: 0 });
              status = await PLAYBACK.resume(playbackObj);
            } catch (error) {
              console.error('Error restarting audio:', error);
              // Revert optimistic update on error
              setSoundObj(currentStatus);
              return;
            }
          } else if (currentStatus.isPlaying) {
            // Audio is playing, pause it
            const optimisticState = {
              ...soundObj,
              isPlaying: false,
              shouldPlay: false
            };
            setSoundObj(optimisticState);
            
            try {
              status = await PLAYBACK.pause(playbackObj);
            } catch (error) {
              console.error('Error pausing audio:', error);
              setSoundObj(currentStatus);
              return;
            }
          } else {
            // Audio is paused, resume it
            const optimisticState = {
              ...soundObj,
              isPlaying: true,
              shouldPlay: true
            };
            setSoundObj(optimisticState);
            
            try {
              status = await PLAYBACK.resume(playbackObj);
            } catch (error) {
              console.error('Error resuming audio:', error);
              setSoundObj(currentStatus);
              return;
            }
          }
        } else {
          // playing new audio
          status = await PLAYBACK.playNext(playbackObj, audio.url);
          setActiveListItem(index);
          setCurrentAudio(audio);
        }
      } catch (error) {
        console.error('Error in audio playback operation:', error);
        return;
      }
    }

    // Update state with actual status after operation
    if (status) {
      setSoundObj(status);
    }

  };

  // Debounced search handler
  const [debouncedSearchText, setDebouncedSearchText] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  // Filter and sort sounds
  const filteredAndSortedSounds = useMemo(() => {
    if (!sounds || sounds.length === 0) return [];
    
    let result = [...sounds];
    
    // Apply search filter
    if (debouncedSearchText) {
      result = result.filter(sound => 
        sound.name && sound.name.toLowerCase().includes(debouncedSearchText.toLowerCase())
      );
    }
    
    // Apply sorting
    return SOUNDS.sortSounds(result, sortValue);
  }, [sounds, debouncedSearchText, sortValue]);

  const renderSound = ({ item, index }) => {
    if (!item) return null;
    // Find the original index in the unfiltered array for activeListItem
    const originalIndex = sounds?.findIndex(s => s.id === item.id) ?? index;
    
    return (
      <Sound
        sound={item}
        loading={loading}
        active={activeListItem === originalIndex}
        onAudioPress={() => handleAudioPress(item, originalIndex)}
        setSoundToUpdate={setSoundToUpdate}
        refreshing={refreshing}
        isPlaying={isEffectivelyPlaying(soundObj)}
        selectedSound={currentAudio}
        unableToLoad={soundObj === null && playbackObj !== null}
      />
    );
  };


  const ListEmptyComponent = () => {
    if (searchText && !sounds?.length) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No sounds yet. Record your first sample!</Text>
        </View>
      );
    }
    if (searchText && filteredAndSortedSounds.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No sounds match "{searchText}"</Text>
        </View>
      );
    }
    if (!sounds || sounds.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No sounds yet. Record your first sample!</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredAndSortedSounds}
        renderItem={renderSound}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <SoundListHeader
            searchText={searchText}
            onSearchChange={setSearchText}
            sortValue={sortValue}
            onSortChange={setSortValue}
            resultsCount={filteredAndSortedSounds.length}
            totalCount={sounds?.length || 0}
          />
        }
        ListEmptyComponent={ListEmptyComponent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {}}/>
        }
        contentContainerStyle={filteredAndSortedSounds.length === 0 ? styles.emptyListContainer : null}
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        windowSize={10}
        removeClippedSubviews={true}
      />
      <EditSoundModal
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        soundToUpdate={soundToUpdate}
      />
    </View>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  emptyListContainer: {
    flexGrow: 1,
  },
});
