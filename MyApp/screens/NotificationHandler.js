import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, update } from "firebase/database";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ✅ Register and save the Expo token to Firebase
export async function registerPushToken() {
  if (!Device.isDevice) {
    console.warn("⚠️ Push only works on physical devices.");
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("❌ Push notification permission not granted.");
    return;
  }

  try {
    const tokenResponse = await Notifications.getExpoPushTokenAsync({
  projectId: "9bcf6511-d71b-4425-b400-e709a03b542d", // Copy this from your Expo dashboard
}); 

    const token = tokenResponse.data;
    console.log("✅ Expo Push Token:", token);

    const user = getAuth().currentUser;
    if (user && token) {
      const db = getDatabase();
      await update(ref(db, `users/${user.uid}`), {
        pushToken: token,
      });
      console.log("🔐 Push token saved to Firebase");
    }
  } catch (error) {
    console.error("❌ Failed to get or save push token:", error);
  }
}

// ✅ Send a push notification through Expo server
export async function sendPushNotification(token, message) {
  if (!token || !message) {
    console.warn("⚠️ Missing token or message");
    return;
  }

  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: token,
        sound: "default",
        title: "Sensor Alert",
        body: message,
      }),
    });

    const result = await response.json();
    console.log("📡 Expo push response:", result);
  } catch (err) {
    console.error("❌ Failed to send push notification:", err);
  }
}
