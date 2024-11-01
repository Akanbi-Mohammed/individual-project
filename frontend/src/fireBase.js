// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; ;
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBq_-5M_ccC_pTdYTP3_xJOrGT9Nb9wZu8",
    authDomain: "level4-project.firebaseapp.com",
    projectId: "level4-project",
    storageBucket: "level4-project.appspot.com",
    messagingSenderId: "666575572595",
    appId: "1:666575572595:web:c1fe4003db96bfc065e406",
    measurementId: "G-G18HLBHN9E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);