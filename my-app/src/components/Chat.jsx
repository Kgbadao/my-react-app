// src/components/Chat.jsx

import React, { useEffect, useRef, useState } from 'react';
import {
  doc, onSnapshot, updateDoc, addDoc, collection,
  serverTimestamp, getDoc
} from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { useParams } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';

function Chat() {
  const { roomId } = useParams();
  const [messages, setMessages] = useState([]);
  const [room, setRoom] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!roomId) return;
    const roomRef = doc(db, 'chatRooms', roomId);

    getDoc(roomRef).then(docSnap => {
      if (docSnap.exists()) {
        setRoom(docSnap.data());
      }
    });

    const messagesRef = collection(roomRef, 'messages');
    const unsubscribe = onSnapshot(messagesRef, (snapshot) => {
      const msgs = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => a.createdAt?.seconds - b.createdAt?.seconds);
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !userRole) return;

    const roomRef = doc(db, 'chatRooms', roomId);
    const messagesRef = collection(roomRef, 'messages');

    await addDoc(messagesRef, {
      text: newMessage,
      sender: currentUser.displayName || currentUser.email,
      senderId: currentUser.uid,
      senderRole: userRole,
      createdAt: serverTimestamp(),
    });

    setNewMessage('');
    clearTyping(roomRef);
  };

  const handleTyping = async () => {
    if (!currentUser) return;
    const roomRef = doc(db, 'chatRooms', roomId);
    await updateDoc(roomRef, { typing: currentUser.displayName });

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => clearTyping(roomRef), 1500);
  };

  const clearTyping = async (roomRef) => {
    await updateDoc(roomRef, { typing: '' });
  };

  const renderMessage = (msg) => {
    const isCurrentUser = msg.senderId === currentUser?.uid;
    const alignment = isCurrentUser ? 'items-end' : 'items-start';
    const bubbleColor = isCurrentUser ? 'bg-blue-500 text-white' : 'bg-gray-100 text-black';
    const senderStyle = isCurrentUser ? 'text-blue-700 font-semibold text-xs mb-1' : 'text-gray-600 font-semibold text-xs mb-1';

    return (
      <div key={msg.id} className={`flex flex-col ${alignment} mb-2`}>
        <p className={`${senderStyle}`}>{msg.sender}</p>
        <div className={`rounded-2xl px-4 py-2 max-w-[75%] ${bubbleColor} shadow-sm`}> 
          <p>{msg.text}</p>
        </div>
        <p className="text-[10px] text-gray-400 mt-1">
          {msg.createdAt?.toDate().toLocaleTimeString()}
        </p>
      </div>
    );
  };

  if (!roomId) {
    return <div className="text-center mt-10 text-red-600">❌ No chat room ID provided.</div>;
  }

  return (
    <div className="flex flex-col h-screen max-w-xl mx-auto bg-white">
      <div className="px-4 py-3 border-b shadow text-center font-bold text-lg">
        Chat with {userRole === 'doctor' ? room?.patientName : 'Dr. Smith'}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 bg-gray-50">
        {messages.length === 0 ? (
          <p className="text-gray-400 text-center">No messages yet.</p>
        ) : (
          messages.map(renderMessage)
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 border-t flex gap-2 bg-white">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onInput={handleTyping}
          placeholder="Type a message..."
          className="flex-grow border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition"
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default Chat;
