import React, { useState, useEffect, createContext } from "react";
import {
  View,
  Button,
  ActivityIndicator,
  StyleSheet,
  Modal,
  Text,
} from "react-native";
import { windowHeight, windowWidth } from "../../utils/Dimensions";
import { getLoadingText, getLoggingInText } from "../../utils/loading";

const LoadingModal = ({ size, loadingStatus }) => {
  const { loading, processingSound } = loadingStatus;

  const renderText = () => {
    return (
      <Text style={styles.loadingText}>
        {!processingSound ? getLoggingInText() : getLoadingText()}
      </Text>
    )
  };
  
  if (loading) {
    return (
      <Modal visible={loading} transparent>
        <View style={styles.container}>
          <View style={styles.modalView}>
            <ActivityIndicator
              animating={loading}
              size={size}
              color={"#37AD65"}
            />
          </View>
          {renderText()}
        </View>
      </Modal>
    );
  } else {
    return null;
  }
};

export default LoadingModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalView: {
    flex: 1,
    top: windowHeight / 2.25,
    margin: "auto",
  },
  loadingText: {
    flex: 1,
    color: "white",
    margin: 'auto',
    fontSize: 18,
  }
});
