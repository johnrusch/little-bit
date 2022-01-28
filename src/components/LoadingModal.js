import React, { useState, useEffect, createContext } from "react";
import {
  View,
  Button,
  ActivityIndicator,
  StyleSheet,
  Modal,
} from "react-native";

const LoadingModal = ({ size, color }) => {
  const [loading, setLoading] = useState(false);

  return (
    <Modal visible={loading}>
      <View style={styles.container}>
        <ActivityIndicator animating={loading} size={size} color={color} />
      </View>
    </Modal>
  );
};

export default LoadingModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "absolute",
    backgroundColor: "rgba(255,255,255,1)",
    margin: "auto",
  },
});
