import { Storage, API, graphqlOperation } from "aws-amplify";
import * as queries from "./graphql/queries";

const listUserSounds = async (userID) => {
  try {
    const sounds = await API.graphql(
      graphqlOperation(queries.listSamples, { user_id: userID })
    );
    console.log("Successfully fetched user sounds", sounds);
    return sounds.data.listSamples.items;
  } catch (err) {
    console.log("Error fetching user sounds", err);
    return null;
  }
};

const getSound = async (model) => {
  const { name, file } = model;
  if (!file || model._deleted) return;
  const key = file.key.split("/").slice(1).join("/");
  try {
    const url = await Storage.get(key);
    const soundObj = { name, url };
    console.log("Successfully fetched sound", soundObj);
    return soundObj;
  } catch (error) {
    console.log("Error fetching sound", error);
    return null;
  }
};

const SOUNDS = {
  loadUserSounds: async (userID) => {
    try {
      const files = await listUserSounds(userID);
      const sounds = [];
      for (const file of files) {
        const sound = await getSound(file);
        if (!sound) continue;
        sounds.push(sound);
      }
      console.log("SOUNDS", sounds);
      return sounds;
    } catch (error) {
      console.log("Error loading user sounds: ", error);
    }
  },
  getSound,
  subscribeToUserSounds: async (userID, setSounds) => {
    try {
      const subscription = API.graphql(
        graphqlOperation(queries.onCreateSample, { user_id: userID })
      ).subscribe({
        next: async (update) => {
          const newSound = update.value.data.onCreateSample;
          const sound = await getSound(newSound);
          if (!sound) return;
          setSounds((prevSounds) => [...prevSounds, sound]);
          console.log("SUBSCRIPTION DATA", update.value);
        },
        error: (error) => console.log("SOMETHING WRONG", error),
      });
      console.log("SUBSCRIPTION", subscription);
      return subscription;
    } catch (error) {
      console.log("Error subscribing to user sounds: ", error);
    }
  }
};

export default SOUNDS;
