const play = async (playbackObj, uri) => {
  try {
    const status = await playbackObj.loadAsync(
      { uri },
      { volume: 0.8, shouldPlay: true },
      true
    );
    return status;
  } catch (error) {
    console.log("Unable to load sound: ", error.message);
    return null;
  }
};

const onPlaybackStatusUpdate = async (playbackStatus) => {
  if (playbackStatus.didJustFinish && !playbackStatus.isLooping) {
    await playbackObject.setStatusAsync({
      shouldPlay: false,
      positionMillis: 0,
    });
  }
};

const PLAYBACK = {
  play,
  pause: async (playbackObj) => {
    try {
      const status = await playbackObj.pauseAsync();
      return status;
    } catch (error) {
      console.log("Unable to pause sound: ", error.message);
      return null;
    }
  },
  resume: async (playbackObj) => {
    try {
      const status = await playbackObj.playAsync();
      return status;
    } catch (error) {
      console.log("Unable to resume sound: ", error.message);
      return null;
    }
  },
  playNext: async (playbackObj, uri) => {
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
