import { getUrl } from "aws-amplify/storage";
import { generateClient } from "aws-amplify/api";
import * as subscriptions from "../graphql/subscriptions";
import * as queries from "../graphql/queries";

const client = generateClient();

const listUserSounds = async (userID) => {
  try {
    const sounds = await client.graphql({
      query: queries.listSamples,
      variables: { user_id: userID }
    });
    return sounds.data.listSamples.items;
  } catch (err) {
    console.log("Error fetching user sounds", err);
    return null;
  }
};

const getSound = async (model) => {
  const { file } = model;
  if (!file || model._deleted) return;
  const key = file.key.split("/").slice(1).join("/");
  try {
    const result = await getUrl({ key });
    const soundObj = { ...model, url: result.url.toString() };
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
      return sounds;
    } catch (error) {
      console.log("Error loading user sounds: ", error);
    }
  },
  getSound,
  subscribeToUserSounds: (userID, setSounds, setLoadingStatus) => {
    try {
      const subscription = client.graphql({
        query: subscriptions.onCreateSample,
        variables: { user_id: userID }
      }).subscribe({
        next: async (update) => {
          setLoadingStatus({ loading: true, processingSound: true });
          const newSound = update.data.onCreateSample;
          const sound = await getSound(newSound);
          if (!sound) return;
          setSounds((prevSounds) => [...prevSounds, sound]);
          console.log("SUBSCRIPTION DATA", update);
          setLoadingStatus({ loading: false, processingSound: false });
        },
        error: (error) => console.log("SOMETHING WRONG", error),
      });
      console.log("SUBSCRIPTION", subscription);
      return subscription;
    } catch (error) {
      console.log("Error subscribing to user sounds: ", error);
    }
  },
};

export default SOUNDS;
