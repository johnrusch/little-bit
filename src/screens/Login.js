import React, {useState, useContext} from 'react';
import { StyleSheet, Text, TouchableOpacity, Image, View } from 'react-native';

import FormButton from '../components/FormButton';
import FormInput from '../components/FormInput';
import { AUTH } from '../api';
import { NavigationContainer } from '@react-navigation/native';
import UserContext from '../contexts/UserContext';

const Login = ({navigation}) => {
    const [username, setUsername] = useState();
    const [password, setPassword] = useState();

    const context = useContext(UserContext);

    const handleLogin = async (username, password) => {
      context.setLoading(true);
      if (username && password) {
        try {
          const login = await AUTH.logIn(username, password);
        } catch (error) {
          alert("Invalid Login:", error.message);
        }
      }
    }

    return (
        <View style={styles.container}>
            <Text style={styles.text}>
                little bit
            </Text>
            <FormInput
                labelValue={username}
                onChangeText={(userName) => setUsername(userName)}
                placeholderText="Username"
                iconType="user"
                autoCapitalize="none"
                autoCorrect={false}
            />
            <FormInput
                labelValue={password}
                onChangeText={(userPassword) => setPassword(userPassword)}
                placeholderText="Password"
                iconType="lock"
                secureTextEntry={true}
            />
            <FormButton buttonTitle="Sign In" onPress={() => handleLogin(username, password)}/>

            <TouchableOpacity style={styles.forgotButton} onPress={() => {}}>
                <Text style={styles.navButtonText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Signup')}>
                <Text style={styles.navButtonText}>Create an account</Text>
            </TouchableOpacity>
        </View>
    )
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#D0F7DD",
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      paddingTop: 50
    },
    logo: {
      height: 150,
      width: 150,
      resizeMode: 'cover',
    },
    text: {
      fontSize: 28,
      marginBottom: 10,
      color: '#051d5f',
    },
    navButton: {
      marginTop: 15,
    },
    forgotButton: {
      marginTop: 15,
    },
    navButtonText: {
      fontSize: 18,
      fontWeight: '500',
      color: '#337A4F',
    },
  });

export default Login;
