import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

function Chat() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  // Set up a listener for messages in the "messages" collection ordered by creation time
  useEffect(() => {
    const messagesQuery = query(
      collection(db, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesArray = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(messagesArray);
    });

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  // Handler for submitting a new message
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;

    try {
      await addDoc(collection(db, 'messages'), {
        text: newMessage,
        createdAt: serverTimestamp(),
        user: 'Anonymous', // Replace this with authenticated user data if available
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Chat Room</h1>

      {/* Chat messages container */}
      <div className="border rounded p-4 h-80 overflow-y-auto mb-4">
        {messages.length > 0 ? (
          messages.map((msg) => (
            <div key={msg.id} className="mb-2">
              <strong>{msg.user}: </strong>
              <span>{msg.text}</span>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No messages yet.</p>
        )}
      </div>

      {/* Message submission form */}
      <form onSubmit={handleSubmit} className="flex">
        <input
          type="text"
          placeholder="Type your message here..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-grow border rounded-l p-2"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 rounded-r transition hover:bg-blue-700"
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default Chat;
