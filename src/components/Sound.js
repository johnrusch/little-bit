import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faPlay, faPause, faFrown } from "@fortawesome/free-solid-svg-icons";
import { Audio } from "expo-av";
import { wait } from "../utils/loading";

const Sound = (props) => {
  const {
    active,
    setSoundToUpdate,
    selectedSound,
    sound,
    isPlaying,
    loading,
    unableToLoad,
    onAudioPress
  } = props;
  const { name } = sound;
  const isSelected = selectedSound && selectedSound.id === sound.id;

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
      <>
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
      </>
    );
  };

  const renderSampleNumber = () => {
    return <Text style={{ fontSize: 12, color: "#aaa" }}>{sampleNumber}</Text>;
  };

  const renderIcon = () => {
    let icon;
    if (!isSelected) {
      icon = faPlay;
    } else {
      icon = unableToLoad ? faFrown : isPlaying ? faPause : faPlay;
    }

    if (loading && isSelected) {
      return (
        <ActivityIndicator size="small" color="#37AD65" animating={loading} />
      );
    } else {
      return (
        <FontAwesomeIcon
          icon={icon}
          size={30}
          color={unableToLoad ? "#AD2D26" : "black"}
        />
      );
    }
  };

  useEffect(() => {
    console.log('reloading from sound...');
  }, [selectedSound, isPlaying, loading, unableToLoad]);
    

  return (
    <View
      style={{
        flexDirection: "row",
        padding: 15,
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,1)",
      }}
    >
      <View
        style={{ flex: 1, flexDirection: "row", justifyContent: "flex-start" }}
      >
        <TouchableOpacity
          style={{ marginRight: 15, flex: 1, alignItems: "flex-start" }}
          onPress={onAudioPress}
        >
          {renderIcon()}
        </TouchableOpacity>
        <View
          style={{
            flex: 2,
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          {renderName()}
        </View>
      </View>
      <View style={{ flex: 1, alignItems: "flex-end" }}>
        {renderSampleNumber()}
      </View>
    </View>
  );
};

export default Sound;
