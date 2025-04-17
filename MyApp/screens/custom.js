import React, { useEffect, useState } from "react";
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
import { ref, get, update } from "firebase/database";
import { getAuth } from "firebase/auth";
import { registerPushToken, sendPushNotification } from "./NotificationHandler";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CustomScreen = () => {
  if (global.lastPushSent === undefined) global.lastPushSent = 0;
  if (global.alertShown  === undefined) global.alertShown  = false;

  const [thresholds, setThresholds] = useState({
    temperature: 0,  // bits [0..6]
    humidity:    0,  // bits [7..13]
    noise:       0,  // bits [14..20]
    presence:   24,  // bits [21..29]
    airQuality:  0,  // bits [30..38]
    pressure:    0   // bits [39..49]
  });
  const [loaded, setLoaded] = useState(false);

  const [sensorValues, setSensorValues] = useState({
    temperature: null,
    humidity:    null,
    pressure:    null,
    airQuality:  null,
    noise:       null,
    presence:    null
  });

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem("thresholds");
        if (saved) setThresholds(JSON.parse(saved));
      } catch (e) {
        console.log("Load thresholds error", e);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    const user = getAuth().currentUser;
    if (user) registerPushToken();
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener("change", state => {
      if (state === "background") global.alertShown = false;
    });
    return () => sub.remove();
  }, []);

  const uploadPackedThresholds = async (thr = thresholds) => {
    const { temperature, humidity, noise, presence, airQuality, pressure } = thr;
    try {
      const packed =
        (BigInt(temperature) << 0n) |
        (BigInt(humidity)    << 7n) |
        (BigInt(noise)       << 14n) |
        (BigInt(presence)    << 21n) |
        (BigInt(airQuality)  << 30n) |
        (BigInt(pressure)    << 39n);

      await update(ref(database, "sentrylink"), {
        user_config: packed.toString()
      });

      // clear only the four sensor alert flags
      await update(ref(database, "/sentry/alerts"), {
        temperature: false,
        humidity:    false,
        pressure:    false,
        airQuality:  false
      });

      console.log("✅ thresholds uploaded & cleared alerts for 4 sensors:", packed.toString());
    } catch (e) {
      console.error("Upload/clear error:", e);
    }
  };

  const handleThresholdChange = async (label, value) => {
    const v = Math.round(value);
    const newThr = { ...thresholds, [label]: v };
    setThresholds(newThr);
    await AsyncStorage.setItem("thresholds", JSON.stringify(newThr));
    uploadPackedThresholds(newThr);
  };

  const decodePresence = (value, alerts) => {
    const b = value & 0xff;
    const states = {
      right:  b & 0b11,
      left:  (b >> 2) & 0b11,
      back:  (b >> 4) & 0b11,
      front: (b >> 6) & 0b11
    };
    for (const [sensor, st] of Object.entries(states)) {
      const name = sensor[0].toUpperCase() + sensor.slice(1);
      if (st === 1) alerts.push(`⚠️ ${name} Sensor: Weak presence`);
      else if (st === 2) alerts.push(`⚠️ ${name} Sensor: Moderate motion`);
      else if (st === 3) alerts.push(`⚠️ ${name} Sensor: Strong motion`);
    }
  };

  const fetchAndCheck = async () => {
    if (!loaded) return;
    const user = getAuth().currentUser;
    if (!user) return;

    let alerts = [];
    try {
      // Read sensor readings including presence
      const keys = ["temperature","humidity","pressure","airQuality","noise","presence"];
      const newVals = {};
      for (const key of keys) {
        const snap = await get(ref(database, `/sentry/readings/${key}`));
        newVals[key] = snap.exists() ? snap.val() : null;
      }

      // Noise alert logic
      const noiseStateSnap = await get(ref(database, `/sentry/alerts/noise`));
      if (noiseStateSnap.exists() && noiseStateSnap.val() >= 2) {
        const msgs = [
          null,
          "⚠️ Noise: Weak spike",
          "⚠️ Noise: Moderate spike",
          "⚠️ Noise: Strong spike"
        ];
        alerts.push(msgs[noiseStateSnap.val()]);
      }

      // Presence alert logic (decode from /sentry/alerts/presence)
      const presAlertSnap = await get(ref(database, `/sentry/alerts/presence`));
      if (presAlertSnap.exists()) {
        decodePresence(presAlertSnap.val(), alerts);
      }

      setSensorValues(newVals);

      // Compare only the numeric sensors
      const flags = {};
      for (const sensor of ["temperature","humidity","pressure","airQuality","noise","presence"]) {
        if (newVals[sensor] != null) {
          const above = newVals[sensor] > thresholds[sensor];
          console.log(`🔍 ${sensor}: ${newVals[sensor]} vs ${thresholds[sensor]} -> ${above}`);
          flags[sensor] = above;
          if (above) {
            alerts.push(`⚠️ ${sensor[0].toUpperCase()+sensor.slice(1)} above threshold: ${newVals[sensor]}`);
          }
        }
      }

      await update(ref(database, "/sentry/alerts"), {
        temperature: flags.temperature  || false,
        humidity:    flags.humidity     || false,
        pressure:    flags.pressure     || false,
        airQuality:  flags.airQuality   || false
      });

      const msg = alerts.filter(m => m).join("\n");
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
          Alert.alert("Sensor Alerts", msg, [{
            text: "OK", 
            onPress: () => { global.alertShown = false; }
          }]);
          setTimeout(() => (global.alertShown = false), 2000);
        }
      }
    } catch (e) {
      console.error("fetchAndCheck error:", e);
    }
  };

  useEffect(() => {
    fetchAndCheck();
    const iv = setInterval(fetchAndCheck, 2000);
    return () => clearInterval(iv);
  }, [loaded, thresholds]);

  const capitalize = s => s[0].toUpperCase() + s.slice(1);

  const renderSensor = (label, unit, min, max, color) => {
    const val = sensorValues[label], thr = thresholds[label];
    const dispVal = val != null
      ? (label === "temperature"
         ? `${Math.round(val*9/5+32)} °F`
         : `${val} ${unit}`)
      : "Loading…";
    const dispThr = label === "temperature"
      ? `${Math.round(thr*9/5+32)} °F`
      : `${thr} ${unit}`;

    return (
      <View style={styles.sensorContainer} key={label}>
        <Text style={styles.sensorLabel}>{`${capitalize(label)}: ${dispVal}`}</Text>
        <Text style={styles.sensorLabel}>{`Threshold: ${dispThr}`}</Text>
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
