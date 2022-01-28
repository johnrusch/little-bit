import React, { useState, useEffect, useContext } from "react";
import {
  View,
  StatusBar,
  StyleSheet,
  ImageBackground,
  Image,
  Keyboard,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Button,
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faMicrophone } from "@fortawesome/free-solid-svg-icons";
import { Audio } from "expo-av";
import { Storage, Auth } from "aws-amplify";
import RecordIcon from "../../svgs/RecordIcon";
import NavBar from "../components/NavBar";
import Recorder from "./Recorder";
import Sounds from "./Sounds";
import * as FileSystem from "expo-file-system";
import UserContext from "../contexts/UserContext";
import api from "../api";
import LogOutButton from "../components/LogOutButton";
import LoadingModal from "../components/LoadingModal";

const Home = (props) => {
  const Tabs = createBottomTabNavigator();

  const context = useContext(UserContext);

    // if (loading)
  //   return (
  //     <Spinner
  //       visible={loading}
  //       textContent={
  //         loggingIn
  //           ? loggingInTexts[getLoadingText(loggingInTexts)]
  //           : loadingTexts[getLoadingText(loadingTexts)]
  //       }
  //       textStyle={{ color: "black" }}
  //     />
  //   );

  return (
    <>
      <Tabs.Navigator
        tabBar={(props) => <NavBar {...props} />}
        screenOptions={{
          tabBarStyle: { backgroundColor: "#69FAA0" },
          tabBarActiveTintColor: "#FFA164",
          headerShadowVisible: false,
          headerStyle: { backgroundColor: "rgba(255,255,255,1)" },
          headerRight: () => (
            <LogOutButton
              buttonTitle="Log Out"
              onPress={async () => await api.logOut()}
            />
          ),
        }}
      >
        <Tabs.Screen
          name="Recorder"
          options={{ title: "" }}
          component={Recorder}
        />
        <Tabs.Screen name="Sounds" options={{ title: "" }} component={Sounds} />
      </Tabs.Navigator>
    </>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,1)",
  },
  recordButton: {
    alignSelf: "center",
    width: "50%",
  },
  logOutButton: {
    marginRight: 20,
    padding: 10,
  },
});
