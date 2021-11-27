import React, {useState} from 'react';
import { StyleSheet, Text, TouchableOpacity, Image, View } from 'react-native';

import FormButton from '../components/FormButton';
import FormInput from '../components/FormInput';
import api from '../api';
import { NavigationContainer } from '@react-navigation/native';

const Login = ({navigation}) => {
    const [username, setUsername] = useState();
    const [password, setPassword] = useState();

    const handleLogin = async (username, password) => {
      if (username && password) {
        try {
          const login = await api.logIn(username, password)
          navigation.navigate('Home')
        } catch (error) {
          alert("Invalid Login:", error.message)
        }
      }
    }

    return (
        <View style={styles.container}>
            <Text style={styles.text}>
                Sample Maker
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
      marginVertical: 35,
    },
    navButtonText: {
      fontSize: 18,
      fontWeight: '500',
      color: '#2e64e5',
    },
  });

export default Login;
