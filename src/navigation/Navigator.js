import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View } from "react-native";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { Hub } from "aws-amplify";

import Login from "../screens/Login";
import Signup from "../screens/Signup";
import Home from "../screens/Home";
import ConfirmSignup from "../screens/ConfirmSignup";
import { AUTH } from "../api";

const Stack = createNativeStackNavigator();

const Navigator = (props) => {
  const [user, setUser] = useState(false);

  const handleUserLoggedIn = async () => {
    const userID = await AUTH.isLoggedIn();
    setUser(userID);
  };

  const removeListeners = () => {
    Hub.remove("auth");
  };

  useEffect(() => {

    Hub.listen("auth", async (data) => {
      const { payload } = data;
      // console.log("HUB EVENT", payload);
      switch (payload.event) {
        case "signIn":
          const username = await AUTH.getUsername(payload.data);
          setUser(username);
          break;
        case "signOut":
          setUser();
          removeListeners();
          break;
      }
    });

    handleUserLoggedIn();

    return removeListeners();
  }, []);

  return (
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
            <Stack.Screen name="Home" options={{ headerShown: false }}>
              {(props) => <Home {...props} user={user} />}
            </Stack.Screen>
          )}
        </Stack.Navigator>
      </NavigationContainer>
  );
};

export default Navigator;
