// CustomScreen.js

import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  AppState
} from "react-native";
import Slider from "@react-native-community/slider";
import { database } from "../Firebase/firebaseConfig";
import { ref, get, update, onValue } from "firebase/database";
import { getAuth } from "firebase/auth";
import { registerPushToken, sendPushNotification } from "./NotificationHandler";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CustomScreen = () => {
  // Rate‑limit globals
  if (global.lastPushSent === undefined) global.lastPushSent = 0;
  if (global.alertShown   === undefined) global.alertShown   = false;

  // Thresholds state
  const [thresholds, setThresholds] = useState({
    temperature: 0,
    humidity:    0,
    noise:       0,
    presence:   24,
    airQuality:  0,
    pressure:    0
  });
  const [loaded, setLoaded] = useState(false);

  // Only show non‑presence readings
  const [sensorValues, setSensorValues] = useState({
    temperature: null,
    humidity:    null,
    pressure:    null,
    airQuality:  null,
    noise:       null
  });

  // Presence state tracking per direction
  const lastState    = useRef({ front:0, back:0, left:0, right:0 });
  const repeatCount  = useRef({ front:0, back:0, left:0, right:0 });

  // Load saved thresholds
  useEffect(() => {
    async function load() {
      try {
        const saved = await AsyncStorage.getItem("thresholds");
        if (saved) setThresholds(JSON.parse(saved));
      } catch (e) {
        console.error("Load thresholds error", e);
      } finally {
        setLoaded(true);
      }
    }
    load();
  }, []);

  // Register push token
  useEffect(() => {
    const user = getAuth().currentUser;
    if (user) registerPushToken();
  }, []);

  // Reset alert flag on background
  useEffect(() => {
    const sub = AppState.addEventListener("change", state => {
      if (state === "background") global.alertShown = false;
    });
    return () => sub.remove();
  }, []);

  // Pack & upload thresholds
  const uploadPackedThresholds = async thr => {
    const { temperature, humidity, noise, presence, airQuality, pressure } = thr;
    try {
      const packed =
        (BigInt(temperature) << 0n) |
        (BigInt(humidity)    << 7n) |
        (BigInt(noise)       << 14n) |
        (BigInt(presence)    << 21n) |
        (BigInt(airQuality)  << 30n) |
        (BigInt(pressure)    << 39n);
      await update(ref(database, "sentrylink"), { user_config: packed.toString() });
      await update(ref(database, "/sentry/alerts"), {
        temperature: false,
        humidity:    false,
        pressure:    false,
        airQuality:  false,
        noise:       false
      });
    } catch (e) {
      console.error("Upload/clear error:", e);
    }
  };

  // Slider change handler
  const handleThresholdChange = async (label, value) => {
    const v = Math.round(value);
    const newThr = { ...thresholds, [label]: v };
    setThresholds(newThr);
    await AsyncStorage.setItem("thresholds", JSON.stringify(newThr));
    uploadPackedThresholds(newThr);
  };

  // Decode presence into individual bit‑fields
  const decodePresence = raw => {
    const b = raw & 0xff;
    return {
      front: (b >> 6) & 0b11,
      back:  (b >> 4) & 0b11,
      left:  (b >> 2) & 0b11,
      right: b & 0b11
    };
  };

  // Poll the other five sensors every 2s
  const fetchAndCheck = async () => {
    if (!loaded) return;
    const user = getAuth().currentUser;
    if (!user) return;

    let alerts = [];
    try {
      const keys = ["temperature","humidity","pressure","airQuality","noise"];
      const newVals = {};
      for (const key of keys) {
        const snap = await get(ref(database, `/sentry/readings/${key}`));
        newVals[key] = snap.exists() ? snap.val() : null;
      }
      setSensorValues(newVals);

      // noise alert
      const noiseSnap = await get(ref(database, `/sentry/alerts/noise`));
      if (noiseSnap.exists() && noiseSnap.val() >= 2) {
        const msgs = [
          null,
          "⚠️ Noise: Weak spike",
          "⚠️ Noise: Moderate spike",
          "⚠️ Noise: Strong spike"
        ];
        alerts.push(msgs[noiseSnap.val()]);
      }

      // threshold checks
      const flags = {};
      for (const sensor of keys) {
        const val = newVals[sensor];
        if (val != null) {
          const above = val > thresholds[sensor];
          flags[sensor] = above;
          if (above) alerts.push(`⚠️ ${sensor[0].toUpperCase()+sensor.slice(1)} above threshold: ${val}`);
        }
      }

      // write back
      await update(ref(database, "/sentry/alerts"), {
        temperature: flags.temperature || false,
        humidity:    flags.humidity    || false,
        pressure:    flags.pressure    || false,
        airQuality:  flags.airQuality  || false,
        noise:       flags.noise       || false
      });

      // push/alert if any
      const msg = alerts.filter(Boolean).join("\n");
      if (msg) {
        const now = Date.now();
        if (now - global.lastPushSent >= 10000) {
          const tok = (await get(ref(database, `users/${user.uid}/pushToken`))).val();
          if (typeof tok === "string") {
            await sendPushNotification(tok, msg);
            global.lastPushSent = now;
          }
        }
        if (!global.alertShown) {
          global.alertShown = true;
          Alert.alert("Sensor Alerts", msg, [
            { text:"OK", onPress:() => { global.alertShown = false; } }
          ]);
          setTimeout(() => global.alertShown = false, 3000);
        }
      }
    } catch (e) {
      console.error("fetchAndCheck error:", e);
    }
  };

  // Subscribe to presence changes and alert per‑direction after 2 repeats
  useEffect(() => {
    const presRef = ref(database, "/sentry/alerts/presence");
    const unsub = onValue(presRef, snap => {
      const raw = snap.val() || 0;
      console.log("🔔 presence raw byte:", raw, "(", raw.toString(2).padStart(8,"0"), ")");
      const states = decodePresence(raw);
      console.log("    decoded states:", states);

      for (const dir of ["front","back","left","right"]) {
        const st = states[dir];
        console.log(`    [${dir}] last=${lastState.current[dir]}  new=${st}`);

        if (st > 0 && st === lastState.current[dir]) {
          repeatCount.current[dir] += 1;
          console.log(`      repeatCount[${dir}] →`, repeatCount.current[dir]);
        } else {
          lastState.current[dir]   = st;
          repeatCount.current[dir] = st > 0 ? 1 : 0;
          console.log(`      reset repeatCount[${dir}] →`, repeatCount.current[dir]);
        }

        if (repeatCount.current[dir] >= 2 && !global.alertShown) {
          const lvl = st === 1 ? "Weak" : st === 2 ? "Moderate" : "Strong";
          console.log(`🚨 Triggering presence alert for ${dir}: ${lvl}`);
          global.alertShown = true;
          Alert.alert(
            "Presence Alert",
            `⚠️ ${dir[0].toUpperCase()+dir.slice(1)}: ${lvl} presence`,
            [{ text:"OK", onPress:() => { global.alertShown = false; } }],
            { cancelable:false }
          );
          repeatCount.current[dir] = 0;
        }
      }
    });
    return () => unsub();
  }, []);

  // start polling non‑presence sensors
  useEffect(() => {
    fetchAndCheck();
    const iv = setInterval(fetchAndCheck, 2000);
    return () => clearInterval(iv);
  }, [loaded, thresholds]);

  const capitalize = s => s[0].toUpperCase() + s.slice(1);
  const renderSensor = (label, unit, min, max, color) => {
    const val = sensorValues[label];
    const thr = thresholds[label];
    const dispVal = val != null
      ? label === "temperature"
        ? `${Math.round(val*9/5+32)} °F`
        : `${val} ${unit}`
      : "Loading…";
    const dispThr = label === "temperature"
      ? `${Math.round(thr*9/5+32)} °F`
      : `${thr} ${unit}`;

      return (
        <View style={styles.sensorContainer} key={label}>
          {label !== "presence" && (
            <Text style={styles.sensorLabel}>
              {`${capitalize(label)}: ${dispVal}`}
            </Text>
          )}
          <Text style={styles.sensorLabel}>
            {label === "presence"
              ? `Presence Threshold: ${dispThr}`
              : `Threshold: ${dispThr}`}
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={min}
            maximumValue={max}
            value={thr}
            onSlidingComplete={v => handleThresholdChange(label, v)}
            minimumTrackTintColor={color}
            maximumTrackTintColor="#000"
            thumbTintColor={color}
          />
        </View>
      );
    };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Custom Sensor Settings</Text>
      {renderSensor("temperature","°F",-20,80,"red")}
      {renderSensor("humidity","%",0,100,"#00BFFF")}
      {renderSensor("pressure","hPa",300,1300,"grey")}
      {renderSensor("airQuality","AQI",50,500,"#32CD32")}
      {renderSensor("noise","dB",70,120,"yellow")}
      {renderSensor("presence","in",24,150,"#FFA500")}

      <TouchableOpacity
        style={styles.button}
        onPress={() => { global.alertShown = false; fetchAndCheck(); }}
      >
        <Text style={styles.buttonText}>Manual Check Now</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container:      { flex: 1, padding: 18, backgroundColor: "#25292e" },
  header:         { fontSize: 24, color: "#fff", fontWeight: "bold", marginBottom: 12, textAlign: "center" },
  sensorContainer:{ marginBottom: 18 },
  sensorLabel:    { fontSize: 18, color: "#fff", marginBottom: 8 },
  slider:         { width: "100%", height: 30 },
  button:         { marginTop: 10, backgroundColor: "#1e90ff", padding: 15, borderRadius: 10, alignItems: "center" },
  buttonText:     { color: "#fff", fontWeight: "bold", fontSize: 16 }
});

export default CustomScreen;
