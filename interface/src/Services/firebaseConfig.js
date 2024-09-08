// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyA_l3BoKrvL2IzbAwWdiaeBGt5BRE4NfpQ",
    authDomain: "optimus-6fcd1.firebaseapp.com",
    projectId: "optimus-6fcd1",
    storageBucket: "optimus-6fcd1.appspot.com",
    messagingSenderId: "894041630433",
    appId: "1:894041630433:web:45887d70d255876345b9a0",
    measurementId: "G-5TKG2W6EGX",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// const analytics = getAnalytics(app);

// Export the Firebase services you'll use
export { auth, app };
