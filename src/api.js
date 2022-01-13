import { Auth, Storage } from "aws-amplify";
import * as FileSystem from "expo-file-system";

const logIn = async (username, password) => {
  try {
    const logIn = await Auth.signIn(username, password);
    return getUserEmailPrefix(logIn);
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
    return getUserEmailPrefix(user);
  } catch (error) {
    return false;
  }
};

const getUserEmailPrefix = (user) => {
  return user.attributes.email.split("@")[0];
};

const getSounds = async (email) => {
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
  getUserEmailPrefix,
  getSounds,
};
