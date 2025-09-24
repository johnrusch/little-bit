import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { confirmSignUp } from '../services/auth';
import DigitBox from '../components/DigitBox';
import {CommonActions} from '@react-navigation/native';

const ConfirmSignup = (props) => {
    const digit1Ref = useRef();
    const digit2Ref = useRef();
    const digit3Ref = useRef();
    const digit4Ref = useRef();
    const digit5Ref = useRef();
    const digit6Ref = useRef();

  
    const [loading, setLoading] = useState(false);
    const [confirmationCode, setConfirmationCode] = useState({
      digit1: '',
      digit2: '',
      digit3: '',
      digit4: '',
      digit5: '',
      digit6: '',
    });
    const [displayError, setDisplayError] = useState(false);
    const {username, password} = props.route.params;
  
    useEffect(() => {
      digit1Ref.current.focus();
    }, []);
  
    useEffect(() => {
      let {digit1, digit2, digit3, digit4, digit5, digit6} = confirmationCode;
  
      if (digit1 && digit2 && digit3 && digit4 && digit5 && digit6) {
        handleConfirmSignUp();
      }
    }, [confirmationCode.digit6]);
  
    const navigateUserHome = () => {
      const resetAction = CommonActions.reset({
        index: 0,
        routes: [
          {
            name: 'Home',
          },
        ],
      });
      props.navigation.dispatch(resetAction);
    }

    const showSuccessAndNavigate = () => {
      setLoading(false);
      
      // Brief delay to show success state, then navigate automatically
      setTimeout(() => {
        props.navigation.navigate('Login', { 
          prefillUsername: username,
          fromConfirmation: true
        });
      }, 800); // 800ms delay to let users see the loading state change
    }
  
    const handleConfirmSignUp = async () => {
      let {digit1, digit2, digit3, digit4, digit5, digit6} = confirmationCode;
      let codeToConfirm = digit1 + digit2 + digit3 + digit4 + digit5 + digit6;
      
      setLoading(true);
      try {
        const confirmResult = await Promise.race([
          confirmSignUp({ username, confirmationCode: codeToConfirm }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('confirmSignUp timeout after 10 seconds')), 10000)
          )
        ]);
        
        showSuccessAndNavigate();
        
      } catch (error) {
        
        setLoading(false);
        
        // Show specific error message based on error type
        let errorMessage = "Something went wrong. Please try again.";
        
        if (error.code === 'CodeMismatchException') {
          errorMessage = "Invalid confirmation code. Please check and try again.";
        } else if (error.code === 'ExpiredCodeException') {
          errorMessage = "Confirmation code has expired. Please request a new one.";
        } else if (error.code === 'NotAuthorizedException') {
          errorMessage = "This account has already been confirmed.";
        } else if (error.code === 'UserNotFoundException') {
          errorMessage = "User not found. Please check your username or sign up again.";
        } else if (error.code === 'InvalidParameterException') {
          errorMessage = "Invalid parameters provided. Please try again.";
        } else if (error.message && error.message.includes('timeout')) {
          errorMessage = "Request timed out. Please check your connection and try again.";
        }
        
        // Include technical details in development
        if (__DEV__) {
          errorMessage += `\n\nDev Info: ${error.code || error.name || 'Unknown error'}: ${error.message}`;
        }
        
        Alert.alert(
          "Confirmation Failed",
          errorMessage,
          [{ text: "OK", onPress: () => {
            setConfirmationCode({digit1: '', digit2: '', digit3: '', digit4: '', digit5: '', digit6: ''});
            digit1Ref.current.focus();
          }}]
        );
      }
    };
  
    return (
      loading ? 
      <View style={{flex: 1, backgroundColor: '#343a40', justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#D8D8D8" />
        <Text style={{color: '#D8D8D8', marginTop: 20}}>Confirming your account...</Text>
      </View>
      : 
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={{fontSize: 30, marginLeft: 35, color: '#D8D8D8', fontWeight: '100'}}>Confirmation</Text>
          <Text style={{color: '#D8D8D8', marginLeft: 35, marginTop: 20}}>
            Type in the confirmation code sent to your email address.
          </Text>
        </View>
        <View style={styles.digitCon}>
          <Text style={{ opacity: displayError ? 1 : 0, textAlign: "center", color: "#FF3366", fontWeight: "500"}}>Something went wrong. Please try again.</Text>
          <View style={styles.digitBoxes}>
            <DigitBox
              inputProps={{autoFocus: true}}
              digitInput={confirmationCode.digit1}
              setData={(value) => {
                setDisplayError(false);
                setConfirmationCode({...confirmationCode, digit1: value});
                digit2Ref.current.focus();
              }}
              isFocused={digit1Ref.current ? digit1Ref.current.isFocused() : false}
              forwardedRef={digit1Ref}
            />
  
            <DigitBox
              digitInput={confirmationCode.digit2}
              setData={(value) => {
                setConfirmationCode({...confirmationCode, digit2: value});
                digit3Ref.current.focus();
              }}
              onBack={(event) =>
                event.nativeEvent.key === 'Backspace'
                  ? (setConfirmationCode({...confirmationCode, digit1: ''}),
                    digit1Ref.current.focus())
                  : null
              }
              isFocused={digit2Ref.current ? digit2Ref.current.isFocused() : false}
              forwardedRef={digit2Ref}
            />
  
            <DigitBox
              digitInput={confirmationCode.digit3}
              setData={(value) => {
                setConfirmationCode({...confirmationCode, digit3: value});
                digit4Ref.current.focus();
              }}
              onBack={(event) =>
                event.nativeEvent.key === 'Backspace'
                  ? (setConfirmationCode({...confirmationCode, digit2: ''}),
                    digit2Ref.current.focus())
                  : null
              }
              isFocused={digit3Ref.current ? digit3Ref.current.isFocused() : false}
              forwardedRef={digit3Ref}
            />
  
            <DigitBox
              digitInput={confirmationCode.digit4}
              setData={(value) => {
                setConfirmationCode({...confirmationCode, digit4: value});
                digit5Ref.current.focus();
              }}
              onBack={(event) =>
                event.nativeEvent.key === 'Backspace'
                  ? (setConfirmationCode({...confirmationCode, digit3: ''}),
                    digit3Ref.current.focus())
                  : null
              }
              isFocused={digit4Ref.current ? digit4Ref.current.isFocused() : false}
              forwardedRef={digit4Ref}
            />
  
            <DigitBox
              digitInput={confirmationCode.digit5}
              setData={(value) => {
                setConfirmationCode({...confirmationCode, digit5: value});
                digit6Ref.current.focus();
              }}
              onBack={(event) =>
                event.nativeEvent.key === 'Backspace'
                  ? (setConfirmationCode({...confirmationCode, digit4: ''}),
                    digit4Ref.current.focus())
                  : null
              }
              isFocused={digit5Ref.current ? digit5Ref.current.isFocused() : false}
              forwardedRef={digit5Ref}
            />
  
            <DigitBox
              digitInput={confirmationCode.digit6}
              setData={(value) => {
                setConfirmationCode({...confirmationCode, digit6: value});
                digit6Ref.current.blur();
              }}
              onBack={(event) =>
                event.nativeEvent.key === 'Backspace'
                  ? (setConfirmationCode({...confirmationCode, digit5: ''}),
                    digit5Ref.current.focus())
                  : null
              }
              isFocused={digit6Ref.current ? digit6Ref.current.isFocused() : false}
              forwardedRef={digit6Ref}
            />
          </View>
        </View>
      </View>
    );
  };
  
  export default ConfirmSignup;
  
  const styles = StyleSheet.create({
    container: {
      backgroundColor: '#343a40',
      flex: 1,
      justifyContent: 'center'
    },
    digitBoxes: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 20,
      width: '100%'
    },
    digitCon: {
      backgroundColor: 'rgba(216, 216, 216, 0.25)',
      borderRadius: 20,
      flexDirection: 'column',
      marginTop: 50,
      paddingBottom: 100,
      paddingHorizontal: 20,
      paddingTop: 30,
      width: '100%',
    },
    header: {
      position: "absolute", 
      top: 100,
    }
  });