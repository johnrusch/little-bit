import { Auth, Storage } from "aws-amplify";
import * as FileSystem from "expo-file-system";
import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";
import {
    S3Client,
    GetObjectCommand,
    ListObjectsCommand
  } from "@aws-sdk/client-s3";
import { AWS_REGION, IDENTITY_POOL_ID } from '@env';

const region = AWS_REGION;
const s3Client = new S3Client({
    region,
    credentials: fromCognitoIdentityPool({
      client: new CognitoIdentityClient({ region }),
      identityPoolId: IDENTITY_POOL_ID
    }),
  });

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
};

const getUser = async () => {
  const user = await Auth.currentAuthenticatedUser();
  // console.log('GETTING USER', user.attributes.email)
  return user.attributes.email.split("@")[0];
};

const getSounds = async (email) => {
  const files = await Storage.list(`processed/${email}`);
  console.log(files);
  const sounds = [];
  const bucket = "sample-maker-sounds";
  for (const file of files) {
    const soundURL = await Storage.get(file.key);
    const newURL = soundURL.replace("public//", "");
    console.log(soundURL);
      const fileName = file.key.split('/')[2].split('.')[0];
      sounds.push({ name: fileName, url: soundURL });
  }
  return sounds;
};

export default {
  logIn,
  signUp,
  isLoggedIn,
  getUser,
  getSounds,
};
