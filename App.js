import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import Spinner from "react-native-loading-spinner-overlay";

import Amplify, { Auth } from "aws-amplify";
import { DataStore } from "@aws-amplify/datastore";
import awsconfig from "./src/aws-exports";
Amplify.configure(awsconfig);
DataStore.configure(awsconfig);

import Navigator from "./src/navigation/Navigator";
import * as loadingUtils from "./src/utils/loading";

export default function App() {

  return (
    <>
      <Navigator />
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
