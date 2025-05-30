import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";

// Send a message to Firestore
export const sendMessage = async (chatId, senderId, text) => {
  const messageRef = collection(db, `chats/${chatId}/messages`);
  await addDoc(messageRef, {
    senderId,
    text,
    timestamp: serverTimestamp()
  });
};

// Listen to messages in real-time
export const listenToMessages = (chatId, callback) => {
  const q = query(
    collection(db, `chats/${chatId}/messages`),
    orderBy("timestamp", "asc")
  );
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(messages);
  });
};
