import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import Spinner from 'react-native-loading-spinner-overlay';

import Amplify, { Auth } from "aws-amplify";
import { DataStore } from "@aws-amplify/datastore";
import awsconfig from "./src/aws-exports";
Amplify.configure(awsconfig);
DataStore.configure(awsconfig);

import Navigator from "./src/navigation/Navigator";
import * as loadingUtils from "./src/utils/loading";

export default function App() {
  const [loading, setLoading] = useState(false);
  const { loadingTexts, getLoadingText } = loadingUtils

  const handleLoading = () => {
    setLoading(true);
    return setTimeout(() => {
      setLoading(false);
      new Alert("oops, i'm sorry it didn't work")
    }, 5000)
  }

  return (
    <>
      <Spinner visible={loading} textContent={loadingTexts[getLoadingText(loadingTexts)]} textStyle={{ color: 'black' }}/>
      <Navigator setLoading={handleLoading} loading={loading}/>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
