import { Auth, Storage, API, graphqlOperation } from "aws-amplify";
import * as FileSystem from "expo-file-system";
import * as queries from './graphql/queries';

const logIn = async (username, password) => {
  try {
    const logIn = await Auth.signIn(username, password);
    return getUsername(logIn);
  } catch (err) {
    console.log(`Error signing in: ${err.message}`, err);
    return null;
  }
};

const signUp = async (newUser) => {
  console.log(newUser);
  try {
    const { user } = await Auth.signUp({
      username: newUser.email,
      password: newUser.password,
    });
    console.log(user);
    return user;
  } catch (err) {
    console.log("Error signing up", err);
    alert("Error creating account:", err.message);
    return null;
  }
};

const logOut = async () => {
  try {
    await Auth.signOut();
  } catch (error) {
    console.log("Error logging out: ", error.message);
  }
};

const isLoggedIn = async () => {
  try {
    const user = await Auth.currentAuthenticatedUser();
    return getUsername(user);
  } catch (error) {
    return false;
  }
};

const getUsername = (user) => {
  return user.attributes.sub;
};

const listUserSounds = async (userID) => {
  const sounds = await API.graphql(graphqlOperation(queries.listSamples, {user_id: userID}))
  return sounds.data.listSamples.items
}

const getSound = async (model) => {
  const { name, file } = model;
  if (!file) return;
  const key = file.key.split("/").slice(1).join("/")
  const url = await Storage.get(key);
  const soundObj = { name, url }
  // console.log(soundObj, 'FROM GET SOUND');
  return soundObj;
}

const loadUserSounds = async (userID) => {
  const files = await listUserSounds(userID);
  const sounds = [];
  for (const file of files) {
    const sound = await getSound(file);
    sounds.push(sound);
  }
  return sounds;
}

const getSoundsFromS3 = async (email) => {
  if (!email) return;
  const files = await Storage.list(`processed/${email}`);
  const sounds = [];
  const bucket = "sample-maker-sounds";
  for (const file of files) {
    const soundURL = await Storage.get(file.key);
    const newURL = soundURL.replace("public//", "");
    const fileName = file.key.split("/")[2].split(".")[0];
    sounds.push({ name: fileName, url: soundURL });
  }
  return sounds;
};

export default {
  logIn,
  signUp,
  logOut,
  isLoggedIn,
  getUsername,
  getSoundsFromS3,
  loadUserSounds,
  getSound
};
