import { Auth } from 'aws-amplify';

const logIn = async (username, password) => {
    try {
        const logIn = await Auth.signIn(username, password);
        // console.log(logIn);
        return logIn;
    } catch (err) {
        console.log(`Error signing in: ${err.message}`, err)
        return null;
    }
}

const signUp = async (newUser) => {
    console.log(newUser)
    try {
        const { user } = await Auth.signUp({
            username: newUser.email,
            password: newUser.password
        });
        console.log(user);
        return user;
    } catch (err) {
        console.log("Error signing up", err)
        alert("Error creating account:", err.message)
        return null;
    }
}

export default {
    logIn,
    signUp
};