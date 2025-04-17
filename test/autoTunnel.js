import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";
import { exec } from "child_process";

// 🔐 Replace this with your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDSD4lviODfZnlkr5ezigM6qWrX9mqba7o",
  authDomain: "seems-hub.firebaseapp.com",
  databaseURL: "https://seems-hub-default-rtdb.firebaseio.com",
  projectId: "seems-hub",
  storageBucket: "seems-hub.firebasestorage.app",
  messagingSenderId: "364476906922",
  appId: "1:364476906922:web:7dc0d8f58d34354d67bfd3"
};

// 🔌 Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

let currentIP = null;

// 🔁 Listen to IP changes from /sentry/camera/ip
const ipRef = ref(database, "/sentry/camera/ip");

onValue(ipRef, (snapshot) => {
  const ip = snapshot.val();

  // Skip if empty or same as before
  if (!ip || ip === currentIP) return;

  currentIP = ip;
  console.log("📡 New IP from ESP32-CAM:", ip);

  // 🌀 Launch Cloudflare Tunnel
  const cleanIP = ip.replace(/^https?:\/\//, ''); // remove any http:// or https://
  const cmd = `cloudflared tunnel --url http://${cleanIP}`;
  console.log("🚀 Launching Cloudflare tunnel...");

  const tunnel = exec(cmd);

  tunnel.stdout.on("data", (data) => console.log(`[cloudflared]: ${data}`));
  tunnel.stderr.on("data", (data) => console.error(`[cloudflared ERROR]: ${data}`));
});
