import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faPlay, faPause, faFrown } from "@fortawesome/free-solid-svg-icons";
import { Audio } from "expo-av";
import { wait } from "../utils/loading";

const Sound = ({ name, url, setUpdatedSound, handleLoading, refreshing }) => {
  const soundObject = React.useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState();
  const [duration, setDuration] = useState();
  const [unableToLoad, setUnableToLoad] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  

  const toggleAudioPlayback = () => {
    if (!soundObject.current._loaded) {
      setUnableToLoad(true);
      return;
    }
    !isPlaying
      ? soundObject.current.playAsync()
      : soundObject.current.pauseAsync();
    setIsPlaying(!isPlaying);
  };

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

    setPosition(playbackStatus.positionMillis);
    setDuration(playbackStatus.durationMillis);

    if (playbackStatus.didJustFinish && !playbackStatus.isLooping) {
      setIsPlaying(false);
      await soundObject.current.setStatusAsync({
        shouldPlay: false,
        positionMillis: 0,
      });
    }
  };

  const loadSound = async (retries = 0) => {
    if (retries > 5) {
      setUnableToLoad(true);
      return;
    }
    if (soundObject.current) {
      try {
        if (!soundObject.current._loading) {
          await soundObject.current.loadAsync(
            { uri: url },
            { volume: 0.8 },
            true
          );
        }
        await soundObject.current.setOnPlaybackStatusUpdate(
          onPlaybackStatusUpdate
        );
      } catch (error) {
        console.log("Unable to load sound: ", error.message);
        setUnableToLoad(true);
      }

      const status = await soundObject.current.getStatusAsync();
      console.log(Object.keys(soundObject.current));
      if (!status.isLoaded) {
        wait(1000).then(() => loadSound(retries + 1));
      } else {
        setIsLoaded(true);
      }
    }
  };

  const unloadSound = () => {
    soundObject.current && soundObject.current.unloadAsync().then();
  };

  const formatName = (name) => {
    let formattedName;
    let sampleNumber;
    if (name.length > 20) {
      formattedName = name.slice(0, 20) + "...";
    } else {
      formattedName = name;
    }

    for (let i = name.length - 1; i >= 0; i--) {
      if (name[i] === "-") {
        formattedName = name.slice(0, i);
        sampleNumber = name.slice(i + 1);
        break;
      }
    }

    return [formattedName, sampleNumber];
  };

  const [formattedName, sampleNumber] = formatName(name);

  const renderName = () => {
    return (
      <View
        style={{
          flexDirection: "column",
          alignItems: "flex-start",
          borderWidth: 1,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "bold" }}>
          {formattedName}
        </Text>

        {unableToLoad && (
          <Text
            style={{
              color: "#AD2D26",
              borderWidth: 1,
              alignSelf: "flex-end",
            }}
          >
            Unable to load sound
          </Text>
        )}
      </View>
    );
  };

  const renderSampleNumber = () => {
    return <Text style={{ fontSize: 12, color: "#aaa" }}>{sampleNumber}</Text>;
  };

  const renderIcon = () => {
    if (loading) {
      return (
        <ActivityIndicator size="small" color="#37AD65" animating={loading} />
      );
    } else {
      return (
        <FontAwesomeIcon
          icon={unableToLoad ? faFrown : !isPlaying ? faPlay : faPause}
          size={30}
          color={unableToLoad ? "#AD2D26" : "black"}
        />
      );
    }
  };

  useEffect(() => {
    setLoading(true);

    soundObject.current = new Audio.Sound();

    loadSound().then(() => {
      setLoading(false);
    });

    return unloadSound();
  }, [refreshing]);

  return (
    <View
      style={{
        flexDirection: "row",
        padding: 15,
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,1)",
      }}
    >
      <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-start' }}>
        <TouchableOpacity
          style={{ marginRight: 15, flex: 1, alignItems: "flex-start" }}
          onPress={() => toggleAudioPlayback()}
        >
          {renderIcon()}
        </TouchableOpacity>
        {renderName()}
      </View>
      <View style={{ flex: 1, alignItems: "flex-end" }}>
        {renderSampleNumber()}
      </View>
    </View>
  );
};

export default Sound;
