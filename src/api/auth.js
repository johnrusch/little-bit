import { Auth } from "aws-amplify";

const getUsername = (user) => {
    return user.attributes.sub;
  };

const AUTH = {
    logIn: async (username, password) => {
        try {
            const logIn = await Auth.signIn(username, password);
            return getUsername(logIn);
        } catch (err) {
            console.log(`Error signing in: ${err.message}`, err);
            return null;
        }
    },
    signUp: async (newUser) => {
        try {
            const { user } = await Auth.signUp({
                username: newUser.email,
                password: newUser.password,
            });
            console.log(user);
            return user;
        } catch (err) {
            console.log("Error signing up", err);
            alert("Error creating account:", err.message);
            return null;
        }
    },
    logOut: async () => {
        try {
            await Auth.signOut();
        } catch (error) {
            console.log("Error logging out: ", error.message);
        }
    },
    isLoggedIn: async () => {
        try {
            const user = await Auth.currentAuthenticatedUser();
            return getUsername(user);
        } catch (error) {
            console.log("Error checking if user is logged in: ", error.message);
            return false;
        }
    },
    getUsername
};

export default AUTH;