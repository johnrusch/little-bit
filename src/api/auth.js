import { signIn, signUp, signOut, fetchAuthSession, getCurrentUser } from "aws-amplify/auth";

const getUsername = (userId) => {
    return userId;
};

const AUTH = {
    logIn: async (username, password) => {
        try {
            const { userId } = await signIn({ username, password });
            return userId;
        } catch (err) {
            console.log(`Error signing in: ${err.message}`, err);
            return null;
        }
    },
    signUp: async (newUser) => {
        try {
            const { userId } = await signUp({
                username: newUser.email,
                password: newUser.password,
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