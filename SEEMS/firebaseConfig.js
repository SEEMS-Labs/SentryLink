// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database"; // Import the function to access the database
import { getAuth } from "firebase/auth"; // Import Firebase Authentication
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
const app = initializeApp(firebaseConfig);
const auth = getAuth(app); // Initialize Firebase Authentication
const database = getDatabase(app); // Add database reference

export { auth, database }; // Export the database reference