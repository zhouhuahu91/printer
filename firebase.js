require("dotenv").config({ path: "./.env.local" });

// firebase admin can only be used on the server.
const admin = require("firebase-admin");

let privateKey = process.env.FIREBASE_PRIVATE_KEY;
// If there is a private key we replace remove the blanks.
if (privateKey) {
  privateKey = privateKey.replace(/\\n/g, "\n");
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      project_id: process.env.PROJECTID,
      private_key: privateKey,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
}

module.exports = admin.firestore();
