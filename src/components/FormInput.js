import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';

import AntDesign from 'react-native-vector-icons/AntDesign';
import { windowHeight, windowWidth } from '../utils/Dimensions';

const FormInput = ({labelValue, placeholderText, iconType, ...rest}) => {
    return (
        <View style={styles.inputContainer}>
            <View style={styles.iconStyle}>
                <AntDesign name={iconType} size={25} color="#666" />
            </View>
            <TextInput style={styles.input} value={labelValue} placeholder={placeholderText} numberOfLines={1} placeholderTextColor="#666" {...rest}/>
        </View>
    )
}

export default FormInput;

const styles = StyleSheet.create({
    iconStyle: {
        alignItems: 'center',
        borderRightColor: '#ccc',
        borderRightWidth: 1,
        height: '100%',
        justifyContent: 'center',
        padding: 10,
        width: 50
    },
    input: {
        alignItems: 'center',
        color: '#333',
        flex: 1,
        fontSize: 16,
        justifyContent: 'center',
        padding: 10
    },
    inputContainer: {
        alignItems: 'center',
        backgroundColor: '#fff',
        borderColor: '#ccc',
        borderRadius: 30,
        borderWidth: 1,
        flexDirection: 'row',
        height: windowHeight / 15,
        marginBottom: 10,
        marginTop: 5,
        width: '100%'
    },
    inputField: {
        borderRadius: 8,
        borderWidth: 1,
        fontSize: 16,
        height: windowHeight / 15,
        marginBottom: 10,
        marginTop: 5,
        padding: 10,
        width: windowWidth / 1.5
    }
})