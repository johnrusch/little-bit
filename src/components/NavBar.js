import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faMicrophone, faPlay } from "@fortawesome/free-solid-svg-icons";

const NavBar = ({ state, descriptors, navigation }) => {
  // Map route names to icons
  const routeIcons = {
    Recorder: faMicrophone,
    Sounds: faPlay,
  };

  return (
    <View style={styles.container}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        // Get colors from options or use defaults
        const color = isFocused
          ? options.tabBarActiveTintColor || "#FFA164"
          : options.tabBarInactiveTintColor || "#37AD65";

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            // The `merge: true` option makes sure that the params inside the tab screen are preserved
            navigation.navigate({ name: route.name, merge: true });
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabButton}
          >
            <View>
              <FontAwesomeIcon
                icon={routeIcons[route.name] || faMicrophone}
                size={40}
                color={color}
              />
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default NavBar;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#69FAA0",
    padding: 25,
    justifyContent: "space-around",
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
  },
});