import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';

function Chat() {
  const { roomId } = useParams();
  const chatRoomId = roomId || "Welcome";

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  // Load user info from localStorage (adjust keys if needed)
  const user = JSON.parse(localStorage.getItem('user')) || null;

  // Fetch messages from backend
  useEffect(() => {
    if (!chatRoomId) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/chat/${chatRoomId}/messages`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
          scrollToBottom();
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      }
    };

    fetchMessages();

    // Poll every 5 seconds
    const interval = setInterval(fetchMessages, 5000);

    return () => clearInterval(interval);
  }, [chatRoomId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Send new message
  const handleSend = async (e) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    if (!user) {
      alert('You must be logged in to send messages.');
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/chat/${chatRoomId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: user.id || user.email,
          senderName: user.name || user.email || 'Unknown',
          text: newMessage.trim(),
        }),
      });

      if (res.ok) {
        setNewMessage('');
        // Optionally fetch messages immediately after sending
        const updatedMessages = await res.json();
        // Or just wait for the polling to update messages
      } else {
        alert('Failed to send message.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="max-w-xl mx-auto flex flex-col h-screen bg-white shadow-md rounded-md p-4">
      <header className="text-center font-bold text-xl mb-4 border-b pb-2">
        Chat Room: {chatRoomId}
      </header>

      <div
        className="flex-1 overflow-y-auto mb-4 px-2"
        style={{ maxHeight: '70vh' }}
      >
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center mt-10">No messages yet.</p>
        ) : (
          messages.map((msg) => {
            const isOwnMessage = msg.senderId === (user?.id || user?.email);
            return (
              <div
                key={msg.id}
                className={`mb-3 flex flex-col ${
                  isOwnMessage ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`rounded-lg px-4 py-2 max-w-[75%] ${
                    isOwnMessage ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-900'
                  } shadow`}
                >
                  <p className="text-sm font-semibold">{msg.senderName}</p>
                  <p>{msg.text}</p>
                </div>
                <span className="text-xs text-gray-400 mt-1">
                  {new Date(msg.createdAt).toLocaleTimeString()}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-grow border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          className="bg-blue-600 text-white px-5 py-2 rounded-full disabled:opacity-50 hover:bg-blue-700 transition"
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default Chat;
