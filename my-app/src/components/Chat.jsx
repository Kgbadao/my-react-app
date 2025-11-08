import React, { useState, useEffect, useRef } from 'react';
import { Send, Phone, Video, MoreVertical, Paperclip, Smile, ArrowLeft, User, Search, Trash2, Volume2, VolumeX, Settings, Edit2, Reply, Check, CheckCheck, AlertCircle, Loader, X, Download } from 'lucide-react';
import { io } from 'socket.io-client';

function Chat({ roomId = 'default-room', userToken, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [roomUsers, setRoomUsers] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isAuthValid, setIsAuthValid] = useState(false);
  
  const messagesEndRef = useRef(null);
  const dropdownRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const chatRoomName = "Doctor Consultation";
  const user = currentUser || JSON.parse(localStorage.getItem('user')) || { 
    id: 'test-user-' + Date.now(), 
    name: 'Test User',
    email: 'test@example.com'
  };

  // Initialize authentication and socket
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        let token = userToken || localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        
        if (!token) {
          console.warn('⚠️ No token found. Attempting test login...');
          
          try {
            const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                email: 'test@example.com', 
                password: 'test123456' 
              })
            });

            if (loginResponse.ok) {
              const loginData = await loginResponse.json();
              token = loginData.token;
              localStorage.setItem('authToken', token);
              localStorage.setItem('user', JSON.stringify({
                id: loginData.userId,
                name: loginData.name,
                email: loginData.email
              }));
              console.log('✅ Test login successful');
            } else {
              const registerResponse = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  name: 'Test User',
                  email: 'test@example.com', 
                  password: 'test123456' 
                })
              });

              if (registerResponse.ok) {
                const registerData = await registerResponse.json();
                token = registerData.token;
                localStorage.setItem('authToken', token);
                localStorage.setItem('user', JSON.stringify({
                  id: registerData.userId,
                  name: registerData.name,
                  email: registerData.email
                }));
                console.log('✅ Test registration successful');
              } else {
                throw new Error('Both login and registration failed');
              }
            }
          } catch (authError) {
            console.error('❌ Authentication setup failed:', authError);
            setError('Backend not running. Start it with: node server.js');
            setIsAuthValid(false);
            return;
          }
        }

        setIsAuthValid(true);
        initializeSocket(token);
      } catch (error) {
        console.error('Initialization error:', error);
        setError('Failed to initialize chat');
      }
    };

    initializeAuth();
  }, []);

  const initializeSocket = (token) => {
    try {
      const socket = io('http://localhost:5000', {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('✅ Connected to chat server');
        setIsConnected(true);
        setError(null);
        socket.emit('join-room', roomId);
        loadMessages();
      });

      socket.on('disconnect', (reason) => {
        console.log('❌ Disconnected:', reason);
        setIsConnected(false);
      });

      socket.on('connect_error', (err) => {
        console.error('Socket error:', err);
        setError(`Connection error: ${err.message}`);
      });

      socket.on('new-message', (message) => {
        setMessages(prev => [...prev, message]);
        if (message.senderId !== user.id) {
          setUnreadCount(prev => prev + 1);
        }
      });

      socket.on('user-typing', ({ userId, userName }) => {
        setTypingUsers(prev => [...prev.filter(u => u.userId !== userId), { userId, userName }]);
      });

      socket.on('user-stop-typing', ({ userId }) => {
        setTypingUsers(prev => prev.filter(u => u.userId !== userId));
      });

      socket.on('message-edited', ({ messageId, newText, edited }) => {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, text: newText, edited } : msg
        ));
      });

      socket.on('message-deleted', ({ messageId }) => {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, deleted: true, text: '[Message deleted]' } : msg
        ));
      });

      socket.on('message-read', ({ messageId, userId }) => {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, readBy: [...(msg.readBy || []), userId] } : msg
        ));
      });

      socket.on('room-users', (users) => {
        setRoomUsers(users);
      });

      socket.on('message-delivered', ({ messageId }) => {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, status: 'delivered' } : msg
        ));
      });

      socket.on('error', ({ message }) => {
        setError(message);
        setTimeout(() => setError(null), 5000);
      });

    } catch (error) {
      console.error('Socket error:', error);
      setError('Failed to connect socket');
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`http://localhost:5000/api/chat/${roomId}/messages`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleTyping = () => {
    if (!socketRef.current || !isConnected) return;
    if (!isTyping) {
      setIsTyping(true);
      socketRef.current.emit('typing', roomId);
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketRef.current.emit('stop-typing', roomId);
    }, 1000);
  };

  const handleSend = () => {
    if (!newMessage.trim() || !socketRef.current || !isConnected) return;

    socketRef.current.emit('send-message', {
      roomId,
      text: newMessage.trim(),
      replyTo: replyTo?.id
    });
    
    setNewMessage('');
    setReplyTo(null);
    setIsTyping(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || file.size > 10 * 1024 * 1024) {
      setError('File too large (max 10MB)');
      return;
    }

    try {
      setUploadingFile(true);
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('authToken');

      const response = await fetch(`http://localhost:5000/api/chat/${roomId}/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, data.message]);
      }
    } catch (error) {
      setError('Upload failed');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteMessage = (messageId) => {
    if (window.confirm('Delete this message?') && socketRef.current) {
      socketRef.current.emit('delete-message', { roomId, messageId });
    }
  };

  const filteredMessages = searchQuery
    ? messages.filter(msg => msg.text?.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  const getMessageStatus = (message) => {
    if (message.senderId !== user.id) return null;
    if (message.readBy?.length > 1) return <CheckCheck className="w-3 h-3 text-blue-500" />;
    return <Check className="w-3 h-3" />;
  };

  if (!isAuthValid) {
    return (
      <div className="flex h-screen bg-red-50 items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Backend Connection Failed</h2>
          <p className="text-gray-600">Make sure your backend is running on http://localhost:5000</p>
          <p className="text-sm text-gray-500 mt-2">Run: node server.js</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {!isConnected && (
        <div className="bg-yellow-500 text-white px-4 py-2 text-center text-sm flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Connecting...
        </div>
      )}

      {error && (
        <div className="bg-red-500 text-white px-4 py-2 text-center text-sm flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
          <button onClick={() => setError(null)} className="ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-gray-900">{chatRoomName}</h1>
              <p className="text-xs text-gray-600">
                {roomUsers.length > 0 && `${roomUsers.length} online`}
                {typingUsers.length > 0 && ` • typing...`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <button onClick={() => setSearchOpen(!searchOpen)} className="p-2.5 hover:bg-gray-100 rounded-xl">
              <Search className="w-5 h-5 text-gray-600" />
            </button>
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setShowDropdown(!showDropdown)} className="p-2.5 hover:bg-gray-100 rounded-xl">
                <MoreVertical className="w-5 h-5 text-gray-600" />
              </button>
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-20">
                  <button onClick={() => setIsMuted(!isMuted)} className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm text-gray-700">
                    {isMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    {isMuted ? 'Unmute' : 'Mute'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {searchOpen && (
          <div className="border-t border-gray-200/50 px-4 py-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              className="w-full bg-gray-100 border-0 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}
      </header>

      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-6">
        {loading ? (
          <div className="text-center"><Loader className="w-6 h-6 animate-spin mx-auto text-indigo-600" /></div>
        ) : filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <User className="w-12 h-12 text-indigo-200 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800">Start a conversation</h3>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMessages.map((msg, index) => {
              const isOwn = msg.senderId === user.id;
              return (
                <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}>
                  <div className={`max-w-xs rounded-2xl px-4 py-2.5 ${isOwn ? 'bg-indigo-600 text-white' : 'bg-white text-gray-800 border border-gray-200'}`}>
                    {!isOwn && <p className="text-xs font-medium text-gray-600 mb-1">{msg.senderName}</p>}
                    <p className="text-sm">{msg.text}</p>
                    <div className={`text-xs mt-1 flex items-center gap-1 ${isOwn ? 'text-indigo-100' : 'text-gray-400'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {getMessageStatus(msg)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white/80 backdrop-blur-lg border-t border-gray-200/50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-end gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingFile || !isConnected}
              className="p-2.5 hover:bg-gray-100 rounded-xl text-gray-600 disabled:opacity-50"
            >
              {uploadingFile ? <Loader className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
            </button>
            
            <textarea
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type a message..."
              rows="1"
              disabled={!isConnected}
              className="flex-1 bg-gray-100 border-0 rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm disabled:opacity-50"
            />
            
            <button
              onClick={handleSend}
              disabled={!newMessage.trim() || !isConnected}
              className="bg-indigo-600 text-white p-3 rounded-xl disabled:opacity-50 hover:shadow-lg transition"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chat;