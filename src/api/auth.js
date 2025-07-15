import { signIn, signUp, signOut, fetchAuthSession, getCurrentUser } from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";

const getUsername = (userId) => {
    return userId;
};

const AUTH = {
    logIn: async (username, password) => {
        try {
            console.log('🔑 Attempting signIn with AWS Amplify v6 API...');
            const { isSignedIn, nextStep } = await signIn({ 
                username, 
                password,
                options: {
                    authFlowType: 'USER_PASSWORD_AUTH'
                }
            });
            console.log('🔑 SignIn result:', { isSignedIn, nextStep });
            
            if (isSignedIn) {
                // User is fully signed in, get user info
                const user = await getCurrentUser();
                console.log('✅ Login successful, user:', user);
                
                // Manually dispatch Hub event for Amplify v6 compatibility
                Hub.dispatch('auth', {
                    event: 'signedIn',
                    data: user
                });
                console.log('🔊 Manually dispatched signedIn Hub event');
                
                return user.userId || user.username;
            } else {
                // Handle multi-step auth if needed
                console.log('🔄 Additional auth step required:', nextStep);
                return null;
            }
        } catch (err) {
            console.error('❌ Login error:', err);
            console.error('❌ Error details:', err.message, err.code, err.name);
            console.error('❌ Full error object:', JSON.stringify(err, null, 2));
            return null;
        }
    },
    signUp: async (newUser) => {
        try {
            const { userId } = await signUp({
                username: newUser.email,
                password: newUser.password,
                options: {
                    autoSignIn: {
                        authFlowType: 'USER_PASSWORD_AUTH'
                    }
                }
            });
            return { username: newUser.email, userSub: userId };
        } catch (err) {
            console.log("Error signing up", err);
            // Don't expose detailed error messages to user
            return null;
        }
    },
    logOut: async () => {
        try {
            await signOut();
            
            // Manually dispatch Hub event for Amplify v6 compatibility
            Hub.dispatch('auth', {
                event: 'signedOut'
            });
            console.log('🔊 Manually dispatched signedOut Hub event');
            
            return true;
        } catch (error) {
            console.log("Error logging out: ", error.message);
            return false;
        }
    },
    isLoggedIn: async () => {
        try {
            const { userId } = await getCurrentUser();
            return userId;
        } catch (error) {
            console.log("Error checking if user is logged in: ", error.message);
            return null;
        }
    },
    getUsername
};

export default AUTH;