import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {View} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import Login from "./screens/Login";
import Signup from "./screens/Signup";
import Home from "./screens/Home";
import ConfirmSignup from "./screens/ConfirmSignup";

const Stack = createNativeStackNavigator();

const Navigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Signup" component={Signup} options={({navigation}) => ({
            title: '',
            headerStyle: {
                backgroundColor: '#f9fafd',  
                shadowColor: '#f9fafd',
                elevation: 0,
              },
              headerLeft: () => (
                <View style={{marginLeft: 10}}>
                  <FontAwesome.Button 
                    name="long-arrow-left"
                    size={25}
                    backgroundColor="#f9fafd"
                    color="#333"
                    onPress={() => navigation.navigate('Login')}
                  />
                </View>
              )
        })}/>
        <Stack.Screen name="ConfirmSignup" component={ConfirmSignup} />
        <Stack.Screen name="Home" component={Home} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigator;
