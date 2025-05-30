// firebase.js
import admin from 'firebase-admin';
import serviceAccount from './telemedical-projeect.json' with { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://your-project-id.firebaseio.com'
});

export const db = admin.firestore();
