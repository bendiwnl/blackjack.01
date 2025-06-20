// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBXPxs6SlEKVn-Cd_a6exozG_91CJsGxt4",
  authDomain: "blackjack-royal-25a94.firebaseapp.com",
  projectId: "blackjack-royal-25a94",
  storageBucket: "blackjack-royal-25a94.appspot.com",
  messagingSenderId: "939743568367",
  appId: "1:939743568367:web:0aca54098197dd061e161a",
  measurementId: "G-B524NK3NMN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };