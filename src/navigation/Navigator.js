import React, { useState, useEffect, createContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { View } from "react-native";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { UserProvider } from "../contexts/UserContext";

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
  const [user, setUser] = useState(false);
  const [userSounds, setUserSounds] = useState({});

  const Tabs = createBottomTabNavigator();

  useEffect(() => {
    const getUser = async () => {
      setUser(await api.isLoggedIn());
    };

    getUser();
  }, []);

  useEffect(() => {
    const getUserSounds = async () => {
      setUserSounds(await api.getSounds(user))
    }

    getUserSounds();
  }, [user])

  return (
    <NavigationContainer>
      {!user ? (
        <Stack.Navigator>
          <Stack.Screen name="Login" component={Login} />
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
        </Stack.Navigator>
      ) : (
        <>
          <UserProvider value={{ user: user, sounds: userSounds}}>
            <Tabs.Navigator
              tabBar={(props) => <NavBar {...props}/>}
              screenOptions={{
                tabBarStyle: { backgroundColor: "#69FAA0" },
                tabBarActiveTintColor: '#FFA164'
              }}>
              <Tabs.Screen name="Recorder" component={Recorder} />
              <Tabs.Screen name="Sounds" component={Sounds} />
              {/* <Stack.Screen name="Home" component={Home} /> */}
            </Tabs.Navigator>
            {/* <NavBar /> */}
          </UserProvider>
        </>
      )}
    </NavigationContainer>
  );
};

export default Navigator;
