import React, { useState, useEffect, createContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Button } from "react-native";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { UserProvider } from "../contexts/UserContext";
import { Hub, API, graphqlOperation } from "aws-amplify";
import { DataStore } from "@aws-amplify/datastore";
import * as subscriptions from "../graphql/subscriptions";
import { CognitoSyncClient } from "@aws-sdk/client-cognito-sync";
import Sample from "../models/index";
import { AWS_REGION } from "@env";

import NavBar from "../components/NavBar";
import Login from "../screens/Login";
import Signup from "../screens/Signup";
import Home from "../screens/Home";
import Recorder from "../screens/Recorder";
import Sounds from "../screens/Sounds";
import ConfirmSignup from "../screens/ConfirmSignup";
import api from "../api";

const Stack = createNativeStackNavigator();

const Navigator = () => {
  const subscription = React.useRef();
  const [user, setUser] = useState(false);
  const [userSounds, setUserSounds] = useState([]);
  const [topicSubscription, setTopicSubscription] = useState();

  const onStartUp = async (userID) => {
    setUser(userID);
    setUserSounds(await api.loadUserSounds(userID));
    await DataStore.clear();
    await DataStore.start();
  };

  const removeListeners = () => {
    Hub.remove("auth");
  };

  useEffect(() => {
    const getUser = async () => {
      const username = await api.isLoggedIn();
      if (username) {
        await onStartUp(username);
      }
    };

    Hub.listen("auth", async (data) => {
      const { payload } = data;
      // console.log("HUB EVENT", payload);
      switch (payload.event) {
        case "signIn":
          const username = api.getUsername(payload.data);
          await onStartUp(username);
          break;
        case "signOut":
          setUser();
          setUserSounds([]);
          DataStore.clear();
          await DataStore.stop();
          removeListeners();
          subscription.current && subscription.current.unsubscribe();
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

    // const subscribe = async () => {
    //   subscription.current = await API.graphql(graphqlOperation(subscriptions.onCreateSample, {user_id: user})).subscribe({
    //     next: async (update) => {
    //       console.log("subscription data", update.value);
    //       const newSound = update.value.data.onCreateSample;
    //       const sound = await api.getSound(newSound);
    //       const newUserSounds = [...userSounds, sound];
    //       setUserSounds(newUserSounds);
    //     },
    //     error: (error) => console.log("SOMETHING WRONG", error),
    //   });
    // };

    const subscribe = () => {
      subscription.current = DataStore.observeQuery(Sample, (sample) =>
        sample.user_id("eq", user)
      ).subscribe((data) => {
        console.log("Data Store observer", data);
      });
    };
    if (!user) return;
    else {
      console.log("SUBSCRIBING");
      subscribe();
    }
  }, [user]);

  console.log(DataStore);

  return (
    <UserProvider value={{ user: user, sounds: userSounds }}>
      <NavigationContainer>
        <Stack.Navigator>
          {!user ? (
            <>
              <Stack.Screen
                name="Login"
                component={Login}
                options={{
                  title: "",
                  headerShadowVisible: false,
                  headerStyle: { backgroundColor: "#f9fafd" },
                }}
              />
              <Stack.Screen
                name="Signup"
                component={Signup}
                options={({ navigation }) => ({
                  title: "",
                  headerStyle: {
                    backgroundColor: "#f9fafd",
                    shadowColor: "#f9fafd",
                    elevation: 0,
                  },
                  headerShadowVisible: false,
                  headerLeft: () => (
                    <View style={{ marginLeft: 10 }}>
                      <FontAwesome.Button
                        name="long-arrow-left"
                        size={25}
                        backgroundColor="#f9fafd"
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
