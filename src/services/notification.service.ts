import admin from "../firebase/firebase";

export const sendNotification = async (
  token: string,
  title: string,
  body: string
): Promise<void> => {
  try {
    const message: admin.messaging.Message = {
      token,
      notification: { title, body },
      android: { priority: "high" },
      apns: {
        payload: { aps: { sound: "default" } },
      },
    };

    const result = await admin.messaging().send(message);
    console.log("Notification sent:", result);
  } catch (err: unknown) {
    console.error("Notification error:", err);
  }
};
