import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Send, Paperclip, User, ChevronLeft, Loader2,
  AlertCircle, X, FileText, Image as ImageIcon, Check, CheckCheck
} from 'lucide-react';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'https://telemed-seel.onrender.com';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'long', day: 'numeric' });
}

function groupByDate(messages) {
  const groups = [];
  let lastDate = null;
  messages.forEach((msg) => {
    const date = formatDate(msg.createdAt);
    if (date !== lastDate) {
      groups.push({ type: 'date', label: date, key: `date-${msg.createdAt}` });
      lastDate = date;
    }
    groups.push({ type: 'message', ...msg });
  });
  return groups;
}

// ─── File Preview Bubble ────────────────────────────────────────────────────

function FileBubble({ file, isMine }) {
  const isImage = file.mimeType?.startsWith('image/');
  return isImage ? (
    <img
      src={file.url}
      alt={file.name}
      className="max-w-[220px] rounded-xl border border-white/20 shadow"
    />
  ) : (
    <a
      href={file.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium underline-offset-2 hover:underline ${
        isMine ? 'text-white' : 'text-sky-700'
      }`}
    >
      <FileText className="w-4 h-4 shrink-0" />
      <span className="truncate max-w-[160px]">{file.name}</span>
    </a>
  );
}

// ─── Message Bubble ─────────────────────────────────────────────────────────

function MessageBubble({ msg, isMine }) {
  return (
    <div className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      {!isMine && (
        <div className="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center shrink-0 mb-1">
          <User className="w-4 h-4 text-sky-600" />
        </div>
      )}

      <div className={`flex flex-col gap-1 max-w-[72%] ${isMine ? 'items-end' : 'items-start'}`}>
        {/* Sender name (for non-mine messages) */}
        {!isMine && (
          <span className="text-[11px] font-semibold text-sky-600 px-1">{msg.senderName || 'User'}</span>
        )}

        <div
          className={`px-4 py-2.5 rounded-2xl shadow-sm ${
            isMine
              ? 'bg-sky-600 text-white rounded-br-sm'
              : 'bg-white text-slate-800 border border-slate-100 rounded-bl-sm'
          }`}
        >
          {msg.file && <FileBubble file={msg.file} isMine={isMine} />}
          {msg.text && <p className="text-sm leading-relaxed">{msg.text}</p>}
        </div>

        {/* Timestamp + read receipt */}
        <div className={`flex items-center gap-1 px-1 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-[10px] text-slate-400">{formatTime(msg.createdAt)}</span>
          {isMine && (
            msg.read
              ? <CheckCheck className="w-3 h-3 text-sky-500" />
              : <Check className="w-3 h-3 text-slate-400" />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Typing Indicator ───────────────────────────────────────────────────────

function TypingIndicator({ names }) {
  if (!names.length) return null;
  return (
    <div className="flex items-center gap-2 px-2">
      <div className="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
        <User className="w-4 h-4 text-sky-500" />
      </div>
      <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm">
        <div className="flex gap-1 items-center">
          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

// ─── File Preview Strip ─────────────────────────────────────────────────────

function FilePreviewStrip({ files, onRemove }) {
  if (!files.length) return null;
  return (
    <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 flex gap-2 flex-wrap">
      {files.map((f, i) => (
        <div key={i} className="relative flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 shadow-sm">
          {f.file.type.startsWith('image/') ? (
            <ImageIcon className="w-3.5 h-3.5 text-sky-500" />
          ) : (
            <FileText className="w-3.5 h-3.5 text-sky-500" />
          )}
          <span className="max-w-[120px] truncate">{f.file.name}</span>
          <button onClick={() => onRemove(i)} className="ml-1 text-slate-400 hover:text-red-500">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Main Chat Component ────────────────────────────────────────────────────

export default function Chat({ currentUser }) {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [roomJoined, setRoomJoined] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingFiles, setPendingFiles] = useState([]); // [{ file, previewUrl }]
  const [uploadingFile, setUploadingFile] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeout = useRef(null);

  const user = currentUser || JSON.parse(localStorage.getItem('user') || 'null');

  // ── Fetch history ───────────────────────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/api/chat/${roomId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load messages');
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  // ── Socket setup ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !roomId) {
      setError('Invalid session or chat room.');
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('authToken');
    const socket = io(API_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      // Join the SPECIFIC room — server must isolate messages per room
      socket.emit('join-room', { roomId }, (ack) => {
        // Some servers use an ack callback; if yours does, use it
        setRoomJoined(true);
        fetchHistory();
      });
      // Fallback: if server doesn't ack, still load history after a tick
      setTimeout(() => {
        setRoomJoined(true);
        fetchHistory();
      }, 200);
    });

    // Only accept messages that belong to THIS room
    socket.on('new-message', (message) => {
      if (String(message.roomId) !== String(roomId)) return;
      setMessages((prev) => {
        // Deduplicate by tempId or _id
        const id = message._id || message.tempId;
        if (id && prev.some((m) => (m._id || m.tempId) === id)) return prev;
        return [...prev, message];
      });
    });

    socket.on('user-typing', ({ userId, userName }) => {
      if (userId === user.id) return;
      setTypingUsers((prev) => (prev.includes(userName) ? prev : [...prev, userName]));
    });

    socket.on('user-stop-typing', ({ userId, userName }) => {
      setTypingUsers((prev) => prev.filter((n) => n !== userName));
    });

    socket.on('message-read', ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, read: true } : m))
      );
    });

    socket.on('connect_error', () => {
      setError('Connection failed. Retrying…');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setRoomJoined(false);
    });

    return () => {
      socket.emit('leave-room', { roomId });
      socket.disconnect();
    };
  }, [roomId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-scroll ─────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // ── Typing indicator ────────────────────────────────────────────────────
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!socketRef.current || !isConnected) return;
    socketRef.current.emit('typing', { roomId, userId: user.id, userName: user.name });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socketRef.current?.emit('stop-typing', { roomId, userId: user.id, userName: user.name });
    }, 1500);
  };

  // ── File selection ──────────────────────────────────────────────────────
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const previews = files.map((file) => ({
      file,
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
    }));
    setPendingFiles((prev) => [...prev, ...previews]);
    e.target.value = '';
  };

  const removeFile = (index) => {
    setPendingFiles((prev) => {
      const copy = [...prev];
      if (copy[index].previewUrl) URL.revokeObjectURL(copy[index].previewUrl);
      copy.splice(index, 1);
      return copy;
    });
  };

  // ── Upload a single file to the server ─────────────────────────────────
  const uploadFile = async (fileObj) => {
    const token = localStorage.getItem('authToken');
    const formData = new FormData();
    formData.append('file', fileObj.file);
    formData.append('roomId', roomId);

    const res = await fetch(`${API_URL}/api/chat/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json(); // expects { url, name, mimeType }
  };

  // ── Send ────────────────────────────────────────────────────────────────
  const handleSend = async (e) => {
    e?.preventDefault();
    const text = newMessage.trim();
    if ((!text && !pendingFiles.length) || !isConnected || !roomJoined) return;

    // Stop typing indicator
    clearTimeout(typingTimeout.current);
    socketRef.current?.emit('stop-typing', { roomId, userId: user.id, userName: user.name });
    setNewMessage('');

    // Handle file uploads first
    if (pendingFiles.length) {
      setUploadingFile(true);
      try {
        for (const fileObj of pendingFiles) {
          const uploaded = await uploadFile(fileObj);
          socketRef.current.emit('send-message', {
            roomId,
            text: '',
            file: uploaded,
            senderId: user.id,
            senderName: user.name,
            createdAt: new Date().toISOString(),
            tempId: `tmp-${Date.now()}-${Math.random()}`,
          });
        }
      } catch (err) {
        setError('File upload failed. Please try again.');
      } finally {
        setUploadingFile(false);
        setPendingFiles([]);
      }
    }

    // Send text message
    if (text) {
      socketRef.current.emit('send-message', {
        roomId,
        text,
        senderId: user.id,
        senderName: user.name,
        createdAt: new Date().toISOString(),
        tempId: `tmp-${Date.now()}`,
      });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
          <span className="text-sm font-medium">Loading conversation…</span>
        </div>
      </div>
    );
  }

  if (error && !messages.length) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="bg-white border border-red-100 rounded-2xl p-6 shadow flex flex-col items-center gap-3 max-w-sm text-center">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <p className="text-slate-700 font-medium">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-2 px-4 py-2 bg-sky-600 text-white rounded-xl text-sm font-semibold hover:bg-sky-700 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const grouped = groupByDate(messages);

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans">

      {/* ── Header ── */}
      <header className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 rounded-full transition"
          >
            <ChevronLeft className="w-5 h-5 text-slate-500" />
          </button>

          {/* Avatar */}
          <div className="relative">
            <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-sky-600" />
            </div>
            <span
              className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                isConnected ? 'bg-emerald-400' : 'bg-slate-300'
              }`}
            />
          </div>

          <div>
            <h2 className="font-bold text-slate-800 text-[15px] leading-tight">Consultation</h2>
            <p className={`text-[11px] font-medium ${isConnected ? 'text-emerald-500' : 'text-slate-400'}`}>
              {isConnected ? 'Connected' : 'Reconnecting…'}
            </p>
          </div>
        </div>

        {/* Error pill */}
        {error && (
          <div className="flex items-center gap-1.5 bg-red-50 text-red-500 text-xs font-medium px-3 py-1.5 rounded-full">
            <AlertCircle className="w-3.5 h-3.5" />
            {error}
          </div>
        )}
      </header>

      {/* ── Messages ── */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {grouped.map((item) =>
          item.type === 'date' ? (
            <div key={item.key} className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">{item.label}</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
          ) : (
            <MessageBubble
              key={item._id || item.tempId || item.createdAt}
              msg={item}
              isMine={String(item.senderId) === String(user?.id)}
            />
          )
        )}

        <TypingIndicator names={typingUsers} />
        <div ref={messagesEndRef} />
      </main>

      {/* ── File preview strip ── */}
      <FilePreviewStrip files={pendingFiles} onRemove={removeFile} />

      {/* ── Input bar ── */}
      <footer className="bg-white border-t border-slate-100 px-4 py-3">
        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          {/* Attach button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingFile}
            className="shrink-0 p-2.5 rounded-xl text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition disabled:opacity-40"
            title="Attach file"
          >
            {uploadingFile ? (
              <Loader2 className="w-5 h-5 animate-spin text-sky-500" />
            ) : (
              <Paperclip className="w-5 h-5" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Text input */}
          <textarea
            value={newMessage}
            onChange={handleTyping}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            rows={1}
            className="flex-1 resize-none bg-slate-100 rounded-2xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 transition max-h-32 leading-relaxed"
            style={{ overflowY: newMessage.split('\n').length > 4 ? 'auto' : 'hidden' }}
          />

          {/* Send button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={(!newMessage.trim() && !pendingFiles.length) || !isConnected || !roomJoined || uploadingFile}
            className="shrink-0 w-10 h-10 flex items-center justify-center bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl transition shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </div>
  );
}