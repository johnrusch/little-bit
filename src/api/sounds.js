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
  
  // Validate file.key before processing
  if (!file.key || typeof file.key !== 'string') {
    console.log("Invalid file key - not a string:", file.key);
    return null;
  }
  
  // Check for basic S3 key format (should have at least one slash and valid characters)
  if (!file.key.includes('/') || file.key.length < 3) {
    console.log("Invalid S3 key format:", file.key);
    return null;
  }
  
  // Validate key doesn't contain dangerous patterns
  if (file.key.includes('..') || file.key.startsWith('/') || file.key.endsWith('/')) {
    console.log("Unsafe S3 key pattern detected:", file.key);
    return null;
  }
  
  const keyParts = file.key.split("/");
  if (keyParts.length < 2) {
    console.log("S3 key must have at least two path segments:", file.key);
    return null;
  }
  
  const key = keyParts.slice(1).join("/");
  
  // Ensure we have a valid key after processing
  if (!key || key.trim() === '') {
    console.log("Empty key after processing file.key:", file.key);
    return null;
  }
  
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
      return [];
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
          
          // Clear the loading timeout if it exists
          if (window.loadingTimeout) {
            clearTimeout(window.loadingTimeout);
            window.loadingTimeout = null;
          }
          
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
