import { Auth } from 'aws-amplify';

const logIn = async (user) => {
    try {
        const logIn = await Auth.signIn(user.username, user.password);
        console.log(logIn);
    } catch (err) {
        console.log(`Error signing in: ${err.message}`, err)
    }
}

const signUp = async (newUser) => {
    try {
        const { user } = await Auth.signUp({
            username: newUser.username,
            password: newUser.password
        });
        console.log(user);
    } catch (err) {
        console.log("Error signing up", err)
    }
}

export default {
    logIn,
    signUp
};