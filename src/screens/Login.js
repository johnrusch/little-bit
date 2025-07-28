import React, {useState, useContext, useEffect, useRef} from 'react';
import { StyleSheet, Text, TouchableOpacity, Image, View } from 'react-native';

import FormButton from '../components/FormButton';
import FormInput from '../components/FormInput';
import { AUTH } from '../api';
import { NavigationContainer } from '@react-navigation/native';
import UserContext from '../contexts/UserContext';

const Login = ({navigation, route}) => {
    // Add better route params handling
    const routeParams = route?.params || {};
    const { prefillUsername, fromConfirmation, successMessage } = routeParams;
    const [username, setUsername] = useState(prefillUsername || '');
    const [password, setPassword] = useState();
    const [showSuccessMessage, setShowSuccessMessage] = useState(fromConfirmation || false);

    
    const context = useContext(UserContext);

    useEffect(() => {
        // Debug: Log route params to see what we're receiving
        console.log('📱 Login screen mounted');
        console.log('📱 Route object:', route);
        console.log('📱 Route params:', routeParams);
        console.log('📱 Pre-filled username:', prefillUsername);
        console.log('📱 From confirmation:', fromConfirmation);
        
        // Update username state if it comes from route params
        if (prefillUsername && prefillUsername !== username) {
            console.log('📱 Updating username from route params:', prefillUsername);
            setUsername(prefillUsername);
        }
    }, [prefillUsername, fromConfirmation]);

    const handleLogin = async (username, password) => {
      if (username && password) {
        try {
          const login = await AUTH.logIn(username, password);
          
          if (login) {
            // Navigation should happen automatically via UserContext
          } else {
            alert("Login failed. Please check your credentials and try again.");
          }
        } catch (error) {
          alert("Login failed: " + error.message);
        }
      } else {
        alert("Please enter both username and password");
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
      alignItems: 'center',
      backgroundColor: "#D0F7DD",
      flex: 1,
      justifyContent: 'center',
      padding: 20,
      paddingTop: 50
    },
    forgotButton: {
      marginTop: 15,
    },
    logo: {
      height: 150,
      resizeMode: 'cover',
      width: 150,
    },
    navButton: {
      marginTop: 15,
    },
    navButtonText: {
      color: '#337A4F',
      fontSize: 18,
      fontWeight: '500',
    },
    successContainer: {
      backgroundColor: 'rgba(51, 122, 79, 0.1)',
      borderColor: '#337A4F',
      borderRadius: 10,
      borderWidth: 1,
      marginBottom: 20,
      padding: 15,
    },
    successText: {
      color: '#337A4F',
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
    text: {
      color: '#051d5f',
      fontSize: 28,
      marginBottom: 10,
    },
  });

export default Login;
