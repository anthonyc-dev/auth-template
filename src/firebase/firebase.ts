import admin from "firebase-admin";
import { readFileSync } from "fs";
import path from "path";

const serviceAccountPath = path.resolve(
  "src/firebase/ascs-dd799-firebase-adminsdk-fbsvc-631be91ffc.json"
);

admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(readFileSync(serviceAccountPath, "utf8"))
  ),
});

export default admin;
