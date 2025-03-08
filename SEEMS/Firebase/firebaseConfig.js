// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database"; // Import the function to access the database
import { initializeAuth,getAuth, getReactNativePersistence } from 'firebase/auth';  
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDSD4lviODfZnlkr5ezigM6qWrX9mqba7o",
  authDomain: "seems-hub.firebaseapp.com",
  databaseURL: "https://seems-hub-default-rtdb.firebaseio.com",
  projectId: "seems-hub",
  storageBucket: "seems-hub.firebasestorage.app",
  messagingSenderId: "364476906922",
  appId: "1:364476906922:web:7dc0d8f58d34354d67bfd3"
};

// Initialize Firebase
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

let auth;
try {
  auth = getAuth(app);
} catch (error) {
  if (error.code === 'auth/already-initialized') {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage)
    });
  } else {
    throw error;
  }
}

const database = getDatabase(app); // Add database reference

export { app, auth, database };