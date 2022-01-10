import { Auth, Storage } from "aws-amplify";
import * as FileSystem from "expo-file-system";

const logIn = async (username, password) => {
  try {
    const logIn = await Auth.signIn(username, password);
    // console.log(logIn);
    return logIn;
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

const isLoggedIn = async () => {
    try {
        const user = await Auth.currentAuthenticatedUser();
        return user.attributes.email.split("@")[0];
    } catch (error) {
        return false;
    }
}

const getUser = async () => {
  const user = await Auth.currentAuthenticatedUser();
  // console.log('GETTING USER', user.attributes.email)
  return user.attributes.email.split("@")[0];
};

const getSounds = async (email) => {
    const files = await Storage.list(`/${email}`, {
      bucket: "sample-maker-sounds",
      customPrefix: {
        public: "",
        protected: "",
        private: "",
      },
    //   level: "public",
      cacheControl: 'no-cache'
    });
    const sounds = [];
    for (const file of files) {
      const soundURL = await Storage.get(file.key, {bucket: 'sample-maker-sounds'});
      const newURL = soundURL.replace('public//', '')
      const fileName = file.key.split('/')[2].split('.')[0];
      const downloadResumable = FileSystem.createDownloadResumable(
        newURL,
        FileSystem.documentDirectory + fileName + '.wav',
        {}
      );
      let localPath
      try {
        const { uri } = await downloadResumable.downloadAsync();
        console.log('Finished downloading to ', uri);
        localPath = uri;
      } catch (e) {
        console.error(e);
      }
      sounds.push({ name: fileName, url: localPath });
    }
    return sounds;
  };

export default {
  logIn,
  signUp,
  isLoggedIn,
  getUser,
  getSounds
};
