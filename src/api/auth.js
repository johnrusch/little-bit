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
            console.log(userId);
            return { username: newUser.email, userSub: userId };
        } catch (err) {
            console.log("Error signing up", err);
            alert("Error creating account:", err.message);
            return null;
        }
    },
    logOut: async () => {
        try {
            await signOut();
        } catch (error) {
            console.log("Error logging out: ", error.message);
        }
    },
    isLoggedIn: async () => {
        try {
            const { userId } = await getCurrentUser();
            return userId;
        } catch (error) {
            console.log("Error checking if user is logged in: ", error.message);
            return false;
        }
    },
    getUsername
};

export default AUTH;