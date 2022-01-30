import React, { useState, useEffect, useRef } from "react";
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
import { AUTH, SOUNDS } from "../api";
import LogOutButton from "../components/LogOutButton";
import LoadingModal from "../components/modals/LoadingModal";

const Home = (props) => {
  const subscription = useRef();
  const { user, navigation } = props;
  const [sounds, setSounds] = useState([]);
  const [loadingStatus, setLoadingStatus] = useState({
    loading: true,
    processingSound: false,
  });
  const [refreshing, setRefreshing] = useState(false);

  const Tabs = createBottomTabNavigator();

  const renderTabs = () => {
    return (
      <Tabs.Navigator
        tabBar={(props) => <NavBar {...props} />}
        initialRouteName="Recorder"
        screenOptions={{
          tabBarStyle: { backgroundColor: "#69FAA0" },
          tabBarActiveTintColor: "#FFA164",
          headerShadowVisible: false,
          headerStyle: { backgroundColor: "rgba(255,255,255,1)" },
          headerRight: () => (
            <LogOutButton
              buttonTitle="Log Out"
              onPress={async () => await AUTH.logOut()}
            />
          ),
        }}
      >
        <Tabs.Screen
          name="Recorder"
          options={{
            title: "",
            tabBarLabel: "Record",
            tabBarIcon: ({ color }) => (
              <FontAwesomeIcon icon={faMicrophone} color={color} size={24} />
            ),
          }}
        >
          {(props) => (
            <Recorder
              {...props}
              user={user}
              setLoadingStatus={setLoadingStatus}
            />
          )}
        </Tabs.Screen>
        <Tabs.Screen
          name="Sounds"
          options={{
            title: "",
            tabBarLabel: "Sounds",
            tabBarIcon: ({ color }) => (
              <FontAwesomeIcon icon={faMicrophone} color={color} size={24} />
            ),
          }}
        >
          {(props) => (
            <Sounds
              {...props}
              user={user}
              setLoadingStatus={setLoadingStatus}
              sounds={sounds}
              setSounds={setSounds}
              setRefreshing={setRefreshing}
              refreshing={refreshing}
            />
          )}
        </Tabs.Screen>
      </Tabs.Navigator>
    );
  };

  useEffect(() => {
    setLoadingStatus({ loading: true, processingSound: false });
    SOUNDS.loadUserSounds(user)
      .then((sounds) => {
        setSounds(sounds);
      })
      .then(() => {
        console.log(sounds.length, "sounds length");
        subscription.current = SOUNDS.subscribeToUserSounds(
          user,
          setSounds,
          setLoadingStatus
        );
        setLoadingStatus({ loading: false, processingSound: false });
      });

    return () => {
      if (subscription.current) {
        subscription.current.unsubscribe();
      }
    };
  }, [refreshing]);

  return (
    <>
      {renderTabs()}
      <LoadingModal size="large" loadingStatus={loadingStatus} />
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
