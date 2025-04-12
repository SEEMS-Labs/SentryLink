import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

export async function registerForPushNotificationsAsync(message) {
  if (!Device.isDevice) {
    alert('Must use physical device for push notifications');
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    alert('Failed to get push token for notifications!');
    return;
  }

  const tokenResponse = await Notifications.getExpoPushTokenAsync({
    projectId: Constants.expoConfig.extra.eas.projectId
  });

  const token = tokenResponse.data;
  console.log('Expo Push Token:', token);

  // Only send notification if message is valid
  if (token && message) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Sensor Alert",
        body: message.trim(),
        sound: "default",
      },
      trigger: null,
    });
  } else if (token) {
      console.warn(" No valid message provided for push notification.");
    }
    else{
      console.warn(" No valid token provided for push notification.");
    }
  }
