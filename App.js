import { StatusBar } from 'expo-status-bar';
import React, { useContext } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';

import Amplify, { Auth } from 'aws-amplify';
import { DataStore } from '@aws-amplify/datastore';
import awsconfig from './src/aws-exports';
Amplify.configure(awsconfig);
DataStore.configure(awsconfig);

import Navigator from './src/navigation/Navigator';

export default function App() {

  return (
      <Navigator />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
