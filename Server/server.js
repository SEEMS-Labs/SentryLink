const express = require('express');
const admin = require('firebase-admin');
const app = express();

app.use(express.json());

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json'); // Update with the correct path

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

app.post('/send-notification', async (req, res) => {
  const { token, title, body } = req.body;

  const message = {
    notification: {
      title,
      body,
    },
    token: token,
  };

  try {
    const response = await admin.messaging().send(message);
    res.status(200).send(`Notification sent successfully: ${response}`);
  } catch (error) {
    res.status(500).send(`Error sending notification: ${error}`);
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
