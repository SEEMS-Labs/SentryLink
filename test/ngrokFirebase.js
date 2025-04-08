
const { exec } = require('child_process');
const firebase = require('firebase');

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

firebase.initializeApp(firebaseConfig);

const database = firebase.database();

// Start ngrok and capture the URL
exec('ngrok http 192.168.25.13:80', (err, stdout, stderr) => {
  if (err) {
    console.error("Error starting ngrok:", err);
    return;
  }

  // Parse the ngrok public URL from the output
  const ngrokUrl = stdout.match(/https:\/\/[a-z0-9]+\.ngrok-free\.app/)[0];

  // Save ngrok URL to Firebase
  database.ref('camera/ip').set(ngrokUrl)
    .then(() => {
      console.log("ngrok URL saved to Firebase:", ngrokUrl);
    })
    .catch(error => {
      console.error("Error saving ngrok URL to Firebase:", error);
    });
});
