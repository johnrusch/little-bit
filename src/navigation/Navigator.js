import React, { useState, useEffect, createContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Button, ActivityIndicator, Alert } from "react-native";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { UserProvider } from "../contexts/UserContext";
import { Hub, API, graphqlOperation } from "aws-amplify";
import { DataStore } from "@aws-amplify/datastore";
import * as subscriptions from "../graphql/subscriptions";
import { CognitoSyncClient } from "@aws-sdk/client-cognito-sync";
import Sample from "../models/index";
import { AWS_REGION } from "@env";
import Spinner from "react-native-loading-spinner-overlay";

import NavBar from "../components/NavBar";
import Login from "../screens/Login";
import Signup from "../screens/Signup";
import Home from "../screens/Home";
import Recorder from "../screens/Recorder";
import Sounds from "../screens/Sounds";
import ConfirmSignup from "../screens/ConfirmSignup";
import LoadingModal from "../components/LoadingModal";
import api from "../api";
import * as loadingUtils from "../utils/loading";

const Stack = createNativeStackNavigator();

const Navigator = (props) => {
  const subscription = React.useRef();
  const [user, setUser] = useState(false);
  const [userSounds, setUserSounds] = useState('no sounds loaded');
  const [loading, setLoading] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const { loadingTexts, loggingInTexts, getLoadingText } = loadingUtils;

  const onStartUp = async (userID) => {
    setUser(userID);
    setUserSounds(await api.loadUserSounds(userID));
    setLoggingIn(false);
    // await DataStore.clear();
    // await DataStore.start();
  };

  const addSounds = (newSound) => {
    const currentSounds = Array.from(userSounds);
    currentSounds.push(newSound);
    console.log("ADDED A SOUND", currentSounds.length);
    setUserSounds(currentSounds);
  };

  const removeListeners = () => {
    Hub.remove("auth");
  };

  const handleLoading = (loading) => {
    setLoading(loading);
    return setTimeout(() => {
      setLoading(false);
      new Alert.alert(
        "Unable to process sound",
        "oops, i'm sorry it didn't work"
      );
    }, 7000);
  };
  

  useEffect(() => {
    setLoading(true);
    const getUser = async () => {
      const userID = await api.isLoggedIn();
      if (userID) {
        await onStartUp(userID);
      }
    };

    Hub.listen("auth", async (data) => {
      const { payload } = data;
      // console.log("HUB EVENT", payload);
      switch (payload.event) {
        case "signIn":
          const username = await api.getUsername(payload.data);
          await onStartUp(username);
          break;
        case "signOut":
          setUser();
          setUserSounds([]);
          // DataStore.clear();
          // await DataStore.stop();
          removeListeners();
          // subscription.current && subscription.current.unsubscribe();
          break;
      }
    });

    getUser();

    return removeListeners();
  }, []);

  useEffect(() => {
    console.log("clearing subscription");

    const unsubscribe = async (subscription) => {
      await subscription.unsubscribe();
    };

    subscription.current && unsubscribe(subscription.current);

    const subscribe = () => {
      subscription.current = API.graphql(
        graphqlOperation(subscriptions.onCreateSample, { user_id: user })
      ).subscribe({
        next: async (update) => {
          // add new sound to user's sounds
          
          console.log("subscription data", update.value);
          console.log('USER SOUNDS', userSounds);
          const newSound = update.value.data.onCreateSample;
          const sound = await api.getSound(newSound);
          addSounds(sound);
          // setUserSounds(currentSounds);
          setLoading(false);
        },
        error: (error) => console.log("SOMETHING WRONG", error),
      });
    };

    // subscribe if user is logged in and user sounds have been loaded
    if (user && userSounds !== 'no sounds loaded') { 
      console.log("SUBSCRIBING");
      subscribe();
    }

    setLoading(false);
  }, [user, userSounds]);

  if (loading)
    return (
      <Spinner
        visible={loading}
        textContent={
          loggingIn
            ? loggingInTexts[getLoadingText(loggingInTexts)]
            : loadingTexts[getLoadingText(loadingTexts)]
        }
        textStyle={{ color: "black" }}
      />
    );

  return (
    <UserProvider
      value={{
        user,
        sounds: userSounds,
        loading: loading,
        setLoading: setLoading,
      }}
    >
      <NavigationContainer>
        {/* <Spinner
          visible={loading}
          textContent={
            loggingIn
              ? loggingInTexts[getLoadingText(loggingInTexts)]
              : loadingTexts[getLoadingText(loadingTexts)]
          }
          textStyle={{ color: "black" }}
        /> */}
        <Stack.Navigator>
          {!user ? (
            <>
              <Stack.Screen
                name="Login"
                component={Login}
                options={{
                  title: "",
                  headerShadowVisible: false,
                  headerStyle: { backgroundColor: "#D0F7DD" },
                }}
              />
              <Stack.Screen
                name="Signup"
                component={Signup}
                options={({ navigation }) => ({
                  title: "",
                  headerStyle: {
                    backgroundColor: "#D0F7DD",
                    shadowColor: "#f9fafd",
                    elevation: 0,
                  },
                  headerShadowVisible: false,
                  headerLeft: () => (
                    <View style={{ marginLeft: 10 }}>
                      <FontAwesome.Button
                        name="long-arrow-left"
                        size={25}
                        backgroundColor="#D0F7DD"
                        color="#333"
                        onPress={() => navigation.navigate("Login")}
                      />
                    </View>
                  ),
                })}
              />
              <Stack.Screen name="ConfirmSignup" component={ConfirmSignup} />
            </>
          ) : (
            <Stack.Screen
              name="Home"
              component={Home}
              options={{ headerShown: false }}
            />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </UserProvider>
  );
};

export default Navigator;
