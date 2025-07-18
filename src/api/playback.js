const play = async (playbackObj, uri) => {
  if (!playbackObj) {
    console.log("Unable to load sound: playback object is null or undefined");
    return null;
  }
  
  try {
    const status = await playbackObj.loadAsync(
      { uri },
      { 
        volume: 0.8, 
        shouldPlay: true,
        // High-quality playback settings
        rate: 1.0,
        shouldCorrectPitch: true,
      },
      true
    );
    return status;
  } catch (error) {
    console.log("Unable to load sound: ", error.message);
    return null;
  }
};

const onPlaybackStatusUpdate = async (playbackStatus, playbackObj) => {
  if (playbackStatus && playbackStatus.didJustFinish && !playbackStatus.isLooping && playbackObj) {
    await playbackObj.setStatusAsync({
      shouldPlay: false,
      positionMillis: 0,
    });
  }
};

const PLAYBACK = {
  play,
  onPlaybackStatusUpdate,
  pause: async (playbackObj) => {
    if (!playbackObj) {
      console.log("Unable to pause sound: playback object is null or undefined");
      return null;
    }
    
    try {
      const status = await playbackObj.pauseAsync();
      return status;
    } catch (error) {
      console.log("Unable to pause sound: ", error.message);
      return null;
    }
  },
  resume: async (playbackObj) => {
    if (!playbackObj) {
      console.log("Unable to resume sound: playback object is null or undefined");
      return null;
    }
    
    try {
      const status = await playbackObj.playAsync();
      return status;
    } catch (error) {
      console.log("Unable to resume sound: ", error.message);
      return null;
    }
  },
  playNext: async (playbackObj, uri) => {
    if (!playbackObj) {
      console.log("Unable to play next sound: playback object is null or undefined");
      return null;
    }
    
    try {
      await playbackObj.stopAsync();
      await playbackObj.unloadAsync();
      return await play(playbackObj, uri);
    } catch (error) {
      console.log("Unable to play next sound: ", error.message);
      return null;
    }
  },
};

export default PLAYBACK;
