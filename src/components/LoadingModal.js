import React, { useState, useEffect, createContext } from "react";
import { View, Button, ActivityIndicator, StyleSheet } from "react-native";

const LoadingModal = ({ size, color }) => {


    return(
        <View style={styles.container}>
            <ActivityIndicator size={size} color={color}/>
        </View>
    )
}

export default LoadingModal;

const styles = StyleSheet.create({
    container: {
      flex: 1,
      position: 'absolute',
      backgroundColor: "rgba(255,255,255,1)",
      margin: 'auto'
    }
  });