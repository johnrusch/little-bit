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
    alignItems: 'center',
    backgroundColor: "rgba(0,0,0,0.65)",
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: {
    color: "white",
    flex: 1,
    fontSize: 18,
    margin: 'auto',
  },
  modalView: {
    flex: 1,
    margin: "auto",
    top: windowHeight / 2.25,
  }
});
