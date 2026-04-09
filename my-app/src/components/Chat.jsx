import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Paperclip, 
  Search, 
  User, 
  Circle, 
  FileText, 
  Image as ImageIcon, 
  MoreVertical,
  ChevronLeft,
  Loader2,
  AlertCircle,
  X,
  Clock
} from 'lucide-react';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'https://telemed-seel.onrender.com';

function Chat({ roomId, currentUser, onBack }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fallback user check - In production, this should come from your Auth Context
  const user = currentUser || JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (!user || !roomId) {
      setError("Session expired or invalid consultation room.");
      return;
    }

    const token = localStorage.getItem('authToken');
    
    // Initialize Socket
    socketRef.current = io(API_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join-room', roomId);
      fetchHistory();
    });

    socket.on('new-message', (message) => {
      if (message.roomId === roomId) {
        setMessages((prev) => [...prev, message]);
      }
    });

    socket.on('user-typing', ({ userId, userName }) => {
      if (userId !== user.id) {
        setTypingUsers((prev) => [...new Set([...prev, userName])]);
      }
    });

    socket.on('user-stop-typing', ({ userName }) => {
      setTypingUsers((prev) => prev.filter(name => name !== userName));
    });

    socket.on('connect_error', () => setError("Lost connection to server..."));

    return () => {
      socket.disconnect();
    };
  }, [roomId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/api/chat/${roomId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error("History fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = (e) => {
    e?.preventDefault();
    if (!newMessage.trim() || !isConnected) return;

    socketRef.current.emit('send-message', {
      roomId,
      text: newMessage.trim(),
      senderId: user.id,
      senderName: user.name,
      createdAt: new Date().toISOString()
    });

    setNewMessage('');
    socketRef.current.emit('stop-typing', roomId);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingFile(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('roomId', roomId);

    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/api/chat/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      
      if (res.ok) {
        const { message } = await res.json();
        socketRef.current.emit('send-message', message);
      }
    } catch (err) {
      setError("File upload failed.");
    } finally {
      setUploadingFile(false);
    }
  };

  const filteredMessages = messages.filter(m => 
    m.text?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <div className="flex h-full items-center justify-center bg-white">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC]">
      {/* --- Chat Header --- */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition md:hidden">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="relative">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
              <User className="w-6 h-6" />
            </div>
            <Circle className={`w-3 h-3 absolute bottom-0 right-0 fill-current ${isConnected ? 'text-green-500' : 'text-slate-300'} border-2 border-white rounded-full`} />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 leading-tight">Medical Consultation</h2>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              {typingUsers.length > 0 ? (
                <span className="italic text-indigo-500 font-medium">{typingUsers[0]} is typing...</span>
              ) : (
                isConnected ? 'Active Now' : 'Connecting...'
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setShowSearch(!showSearch)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
            <Search className="w-5 h-5" />
          </button>
          <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* --- Search Bar --- */}
      {showSearch && (
        <div className="bg-white border-b px-4 py-2 animate-in slide-in-from-top duration-200">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              placeholder="Search conversation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* --- Messages Area --- */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-40">
            <div className="bg-slate-100 p-6 rounded-full mb-4">
              <FileText className="w-12 h-12 text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium">No messages yet. Say hello!</p>
          </div>
        ) : (
          filteredMessages.map((msg, idx) => {
            const isMe = msg.senderId === user.id;
            return (
              <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] md:max-w-[60%] ${isMe ? 'order-1' : 'order-2'}`}>
                  <div className={`px-4 py-2.5 rounded-2xl shadow-sm ${
                    isMe 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                  }`}>
                    {/* File Attachment UI */}
                    {msg.fileUrl && (
                      <div className={`mb-2 p-2 rounded-lg flex items-center gap-3 ${isMe ? 'bg-indigo-700' : 'bg-slate-50'}`}>
                        {msg.fileType?.includes('image') ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                        <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="text-xs underline truncate font-medium">
                          View Attachment
                        </a>
                      </div>
                    )}
                    <p className="text-[14px] leading-relaxed">{msg.text}</p>
                    <div className={`text-[10px] mt-1 flex items-center gap-1 opacity-70 ${isMe ? 'justify-end' : ''}`}>
                      <Clock className="w-3 h-3" />
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* --- Message Input --- */}
      <footer className="p-4 bg-white border-t border-slate-200">
        {error && (
          <div className="mb-3 p-2 bg-red-50 text-red-600 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
            <button onClick={() => setError(null)} className="ml-auto"><X className="w-3 h-3" /></button>
          </div>
        )}
        
        <form onSubmit={handleSend} className="flex items-end gap-2 max-w-6xl mx-auto">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept=".pdf,.jpg,.png,.doc" 
          />
          <button 
            type="button"
            onClick={() => fileInputRef.current.click()}
            className="p-3 text-slate-500 hover:bg-slate-100 rounded-xl transition"
          >
            {uploadingFile ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
          </button>

          <div className="flex-1 relative">
            <textarea
              rows="1"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                socketRef.current?.emit('typing', roomId);
              }}
              placeholder="Type your health concern..."
              className="w-full bg-slate-100 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
          </div>

          <button 
            type="submit"
            disabled={!newMessage.trim() || !isConnected}
            className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-md transition disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </footer>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
      `}</style>
    </div>
  );
}

export default Chat;