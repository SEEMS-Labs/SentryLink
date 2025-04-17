import express from "express";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";
import { createProxyMiddleware } from "http-proxy-middleware";
import { exec } from "child_process";
import { set, ref as dbRef } from "firebase/database"; // optional, if you ever want to save it later

// 🔐 Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDSD4lviODfZnlkr5ezigM6qWrX9mqba7o",
  authDomain: "seems-hub.firebaseapp.com",
  databaseURL: "https://seems-hub-default-rtdb.firebaseio.com",
  projectId: "seems-hub",
  storageBucket: "seems-hub.firebasestorage.app",
  messagingSenderId: "364476906922",
  appId: "1:364476906922:web:7dc0d8f58d34354d67bfd3"
};

// 🔧 App and Firebase init
const app = express();
const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);

// 🔁 Variables
let currentIP = null;
let serverStarted = false;
let tunnelProcess = null;
let publicTunnelURL = null; // 🌍 Store the current Cloudflare public URL

// 🔁 Watch Firebase for ESP32 IP updates
onValue(ref(database, "/sentry/camera/ip"), (snapshot) => {
  const rawValue = String(snapshot.val()).trim();
  const cleanIP = rawValue.replace(/^https?:\/\//, "");

  console.log(`🔥 Cleaned IP: [[${cleanIP}]] (length: ${cleanIP.length})`);

  if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(cleanIP)) {
    console.error("❌ Invalid IP format:", cleanIP);
    return;
  }

  if (cleanIP === currentIP) return;

  currentIP = cleanIP;
  console.log(`📡 Updated ESP32 IP: ${currentIP}`);

  if (!serverStarted) {
    serverStarted = true;
    startProxyServer();
  } else {
    launchTunnel(3000); // Restart tunnel if IP changes
  }
});

// 🚀 Start Proxy Server
function startProxyServer() {
    const PORT = 3000;
  
    // ✅ Add this BEFORE the proxy middleware
    app.get("/tunnel-url", (req, res) => {
      if (publicTunnelURL) return res.send(publicTunnelURL);
      res.status(404).send("Tunnel URL not available yet");
    });
  
    // Proxy all traffic to ESP32
    app.use((req, res, next) => {
      if (!currentIP) {
        console.log("🚫 No ESP32 IP yet");
        return res.status(500).send("No ESP32 IP set");
      }
  
      console.log(`🔁 Proxying: ${req.method} ${req.url} → http://${currentIP}${req.url}`);
      createProxyMiddleware({
        target: `http://${currentIP}`,
        changeOrigin: true,
      })(req, res, next);
    });
  
    app.listen(PORT, () => {
      console.log("✅ Proxy server running at http://localhost:3000");
      launchTunnel(PORT);
    });
  }  

// 🚀 Launch or Restart Cloudflare Tunnel
function launchTunnel(port) {
  if (tunnelProcess) {
    console.log("🛑 Killing previous Cloudflare tunnel...");
    tunnelProcess.kill();
  }

  const cmd = `cloudflared tunnel --url http://localhost:${port}`;
  console.log(`🚀 Launching new Cloudflare tunnel → localhost:${port}`);
  tunnelProcess = exec(cmd);

  tunnelProcess.stderr.on("data", (data) => {
    const msg = data.toString();
    console.error(`[cloudflared ERROR]: ${msg}`);
  
    const match = msg.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
    if (match) {
      publicTunnelURL = match[0];
      console.log("✅ Tunnel URL stored in variable (from stderr):", publicTunnelURL);
  
      // 🔥 PUSH IT TO FIREBASE HERE TOO
      set(dbRef(database, "/sentry/camera/tunnel"), publicTunnelURL)
        .then(() => console.log("📡 Pushed tunnel URL to Firebase"))
    }
  });

  tunnelProcess.stderr.on("data", (data) => {
    const msg = data.toString();
    console.error(`[cloudflared ERROR]: ${msg}`);
  
    const match = msg.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
    if (match) {
      publicTunnelURL = match[0];
      console.log("✅ Tunnel URL stored in variable (from stderr):", publicTunnelURL);
    }
  });  
}
