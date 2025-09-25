import { signIn, signUp, signOut, getCurrentUser, Hub } from "../services/auth";

const getUsername = (userId) => {
    return userId;
};

const AUTH = {
    logIn: async (username, password) => {
        try {
            const { isSignedIn } = await signIn({ 
                username, 
                password,
                options: {
                    authFlowType: 'USER_PASSWORD_AUTH'
                }
            });
            
            if (isSignedIn) {
                // User is fully signed in, get user info
                const user = await getCurrentUser();
                
                // Manually dispatch Hub event for Amplify v6 compatibility
                Hub.dispatch('auth', {
                    event: 'signedIn',
                    data: user
                });
                
                return user.userId || user.username;
            } else {
                // Handle multi-step auth if needed
                return null;
            }
        } catch (err) {
            console.error('Login error:', err.message);
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
            
            return true;
        } catch (error) {
            console.error("Error logging out:", error.message);
            return false;
        }
    },
    isLoggedIn: async () => {
        try {
            const user = await getCurrentUser();
            return user?.userId || user?.username || user;
        } catch (error) {
            // User is not logged in
            return null;
        }
    },
    getUsername
};

export default AUTH;