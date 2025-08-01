import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, Image, View } from "react-native";

import FormButton from "../components/FormButton";
import FormInput from "../components/FormInput";
import { AUTH } from "../api";

const Signup = ({ navigation }) => {
  const [newUser, setNewUser] = useState({});
  const [confirmPassword, setConfirmPassword] = useState();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Create an account</Text>
      <FormInput
        labelValue={newUser.email}
        onChangeText={(userName) => setNewUser({...newUser, email: userName})}
        placeholderText="Email"
        iconType="user"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <FormInput
        labelValue={newUser.password}
        onChangeText={(userPassword) => setNewUser({...newUser, password: userPassword})}
        placeholderText="Password"
        iconType="lock"
        secureTextEntry={true}
      />
      <FormInput
        labelValue={confirmPassword}
        onChangeText={(userPassword) => setConfirmPassword(userPassword)}
        placeholderText="Confirm Password"
        iconType="lock"
        secureTextEntry={true}
      />
      <FormButton
        buttonTitle="Sign Up"
        onPress={async () => {
          if (newUser.email && newUser.password && newUser.password === confirmPassword) {
            const signUp = await AUTH.signUp(newUser)
            signUp && navigation.navigate("ConfirmSignup", { username: newUser.email, password: newUser.password });
          } else {
            alert("Please enter all fields to create a new account")
          }}
        }/>

      <TouchableOpacity
        style={styles.navButton}
        onPress={() => navigation.navigate("Login")}
      >
        <Text style={styles.navButtonText}>Have an account? Sign in</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  color_textPrivate: {
    color: "grey",
    fontSize: 13,
    fontWeight: "400",
  },
  container: {
    alignItems: "center",
    backgroundColor: "#D0F7DD",
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  navButton: {
    marginTop: 15,
  },
  navButtonText: {
    color: "#337A4F",
    fontSize: 18,
    fontWeight: "500",
  },
  text: {
    color: "#051d5f",
    fontSize: 28,
    marginBottom: 10,
  },
  textPrivate: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginVertical: 35,
  },
});

export default Signup;
