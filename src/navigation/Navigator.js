import React, { useState, useEffect, createContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Button } from "react-native";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { UserProvider } from "../contexts/UserContext";
import { Hub, API, DataStore } from "aws-amplify";
import { CognitoSyncClient } from "@aws-sdk/client-cognito-sync";
import Sample from "../models/index";
import { AWS_REGION } from '@env';

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
  const [userSounds, setUserSounds] = useState({});
  const [topicSubscription, setTopicSubscription] = useState();

  const removeListeners = () => {
    Hub.remove("auth");
    Hub.remove("storage");
    return;
  };

  useEffect(() => {
    const cognitoSyncClient = new CognitoSyncClient({ region: AWS_REGION })

    const getUser = async () => {
      const username = await api.isLoggedIn();
      setUser(username);
      setUserSounds(await api.getSounds(username));
    };

    Hub.listen("auth", async (data) => {
      const { payload } = data;
      // console.log("HUB EVENT", payload);
      switch (payload.event) {
        case "signIn":
          const username = api.getUsername(payload.data);
          setUser(username);
          setUserSounds(await api.getSounds(username));
          await DataStore.start();
          break;
        case "signOut":
          setUser();
          setUserSounds({});
          await DataStore.stop();
          break;
      }
    });

    Hub.listen(/.*/, data => {
      console.log('EVERYTHING', data)
    })

    getUser();

    return removeListeners();
  }, []);

  useEffect(() => {
    let subscription;
    const subscribe = async () => {
      subscription = await DataStore.observe(
        Sample,
        sample => sample.username('eq', user),
      ).subscribe(data => {
        console.log("DATASTORE", data);
      })
    }
    if (!user) return
    else {
      subscribe()
    }
    
    // return subscription.unsubscribe();
  }, [user])
  console.log(DataStore, user);

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
