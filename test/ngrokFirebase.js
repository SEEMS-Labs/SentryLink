import { initializeApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";

// Initialize Firebase with your config
const firebaseConfig = {
  apiKey: "AIzaSyDSD4lviODfZnlkr5ezigM6qWrX9mqba7o",
  authDomain: "seems-hub.firebaseapp.com",
  databaseURL: "https://seems-hub-default-rtdb.firebaseio.com",
  projectId: "seems-hub",
  storageBucket: "seems-hub.firebasestorage.app",
  messagingSenderId: "364476906922",
  appId: "1:364476906922:web:7dc0d8f58d34354d67bfd3"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Example of writing to Firebase
set(ref(database, 'camera/ip'), 'https://e327-2603-9001-8000-27b5-e86f-cdfb-a8ae-7315.ngrok-free.app ')
  .then(() => {
    console.log('Data saved successfully!');
  })
  .catch((error) => {
    console.error('Error saving data: ', error);
  });