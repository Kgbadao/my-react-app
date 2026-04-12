import React, { useRef, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Phone, PhoneOff, Copy, Check, Mic, MicOff, Video, VideoOff, ChevronLeft } from 'lucide-react';

/**
 * VideoCallComponent
 *
 * THE KEY CHANGE: This component now reads the appointmentId from the URL
 * (e.g. /video-call/abc123) and uses it as the PeerJS peer ID seed.
 *
 * This means:
 * - The patient navigates to /video-call/abc123 (from their appointment card)
 * - The doctor navigates to /video-call/abc123 (from their dashboard)
 * - Both automatically share the same "room" ID — no manual peer ID copy-paste needed
 *
 * How it works under the hood:
 * - Patient creates a Peer with ID "patient-abc123"
 * - Doctor creates a Peer with ID "doctor-abc123"
 * - Patient auto-calls the doctor's peer ID (derived from the same appointment ID)
 * - They connect without either person having to exchange anything manually
 *
 * For this to work, you need a way to know who is the "doctor" vs "patient"
 * in the appointment. We read that from localStorage user data.
 */

function VideoCallComponent() {
  const { appointmentId } = useParams(); // from route: /video-call/:appointmentId
  const navigate = useNavigate();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const callRef = useRef(null);

  const [peerId, setPeerId] = useState('');
  const [remotePeerId, setRemotePeerId] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('idle');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [peerLoaded, setPeerLoaded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [localStream, setLocalStream] = useState(null);

  // Determine user role from localStorage
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  // We use a convention: "patient-{appointmentId}" and "doctor-{appointmentId}"
  // You can adjust this logic based on how your backend stores role info
  const role = user?.role === 'doctor' ? 'doctor' : 'patient';
  const myPeerId = appointmentId ? `${role}-${appointmentId}` : null;
  const theirPeerId = appointmentId
    ? `${role === 'doctor' ? 'patient' : 'doctor'}-${appointmentId}`
    : null;

  // Load PeerJS from CDN
  useEffect(() => {
    if (window.Peer) { setPeerLoaded(true); return; }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.4/peerjs.min.js';
    script.onload = () => setPeerLoaded(true);
    script.onerror = () => setError('Failed to load video library. Please refresh.');
    document.head.appendChild(script);
  }, []);

  // Initialize media + PeerJS once library is loaded
  useEffect(() => {
    if (!peerLoaded) return;

    let cleanup;

    const init = async () => {
      try {
        setError('');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        // Use appointment-derived ID if available, else let PeerJS generate one
        const peerConfig = {
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
            ],
          },
        };
        const peer = myPeerId
          ? new window.Peer(myPeerId, peerConfig)
          : new window.Peer(peerConfig);

        peerRef.current = peer;

        peer.on('open', (id) => {
          setPeerId(id);
          // If we have an appointment ID and we're the "caller" role (patient),
          // auto-call the doctor after a short delay to let the other side connect
          if (theirPeerId && role === 'patient') {
            setTimeout(() => autoCall(stream, theirPeerId), 2000);
          }
        });

        peer.on('call', (call) => {
          setConnectionStatus('connecting');
          callRef.current = call;
          call.answer(stream);
          call.on('stream', (remoteStream) => {
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
            setConnectionStatus('connected');
          });
          call.on('close', () => {
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
            setConnectionStatus('idle');
          });
          call.on('error', (err) => {
            setError(`Call error: ${err.message}`);
            setConnectionStatus('failed');
          });
        });

        peer.on('error', (err) => {
          // "peer-unavailable" means the other person hasn't joined yet — that's okay
          if (err.type === 'peer-unavailable') {
            setError('Waiting for the other participant to join...');
            setTimeout(() => setError(''), 3000);
          } else {
            setError(`Connection error: ${err.message}`);
          }
        });

        cleanup = () => {
          stream.getTracks().forEach((t) => t.stop());
          callRef.current?.close();
          peer.destroy();
        };
      } catch (err) {
        setError(`Camera/microphone access error: ${err.message}`);
      }
    };

    init();
    return () => cleanup?.();
  }, [peerLoaded]);

  const autoCall = (stream, targetId) => {
    if (!peerRef.current) return;
    setConnectionStatus('connecting');
    const call = peerRef.current.call(targetId, stream);
    if (!call) return;
    callRef.current = call;
    call.on('stream', (remoteStream) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
      setConnectionStatus('connected');
    });
    call.on('close', () => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      setConnectionStatus('idle');
    });
    call.on('error', (err) => {
      setError(`Call error: ${err.message}`);
      setConnectionStatus('failed');
    });
  };

  const initiateCall = () => {
    const target = remotePeerId.trim() || theirPeerId;
    if (!target) { setError('No peer ID to call'); return; }
    if (!localStream) { setError('Camera not ready'); return; }
    autoCall(localStream, target);
  };

  const endCall = () => {
    callRef.current?.close();
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setConnectionStatus('idle');
    setError('');
  };

  const toggleMute = () => {
    localStream?.getAudioTracks().forEach((t) => (t.enabled = isMuted));
    setIsMuted(!isMuted);
  };

  const toggleCamera = () => {
    localStream?.getVideoTracks().forEach((t) => (t.enabled = isCameraOff));
    setIsCameraOff(!isCameraOff);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusColors = {
    connected: 'bg-green-500',
    connecting: 'bg-yellow-500 animate-pulse',
    failed: 'bg-red-500',
    idle: 'bg-gray-400',
  };
  const statusLabels = {
    connected: 'Connected',
    connecting: 'Connecting...',
    failed: 'Connection Failed',
    idle: appointmentId ? 'Waiting for other participant...' : 'Ready',
  };

  if (!peerLoaded) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Setting up video call...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex flex-col px-4 py-6">
      <div className="max-w-6xl w-full mx-auto flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white transition">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </button>
          <div className="text-center">
            <h1 className="text-2xl font-bold">Video Consultation</h1>
            {appointmentId && (
              <p className="text-gray-400 text-xs mt-1">Appointment #{appointmentId.slice(-6).toUpperCase()}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${statusColors[connectionStatus]}`} />
            <span className="text-sm text-gray-300">{statusLabels[connectionStatus]}</span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-900/60 border border-red-600 rounded-xl text-red-200 text-sm text-center">
            {error}
          </div>
        )}

        {/* Videos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="relative bg-gray-900 rounded-2xl overflow-hidden aspect-video">
            <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            {isCameraOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <VideoOff className="w-12 h-12 text-gray-500" />
              </div>
            )}
            <div className="absolute bottom-3 left-3 bg-black/50 px-2 py-1 rounded-lg text-xs font-medium">
              You {isMuted && '(muted)'}
            </div>
          </div>

          <div className="relative bg-gray-900 rounded-2xl overflow-hidden aspect-video">
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center text-gray-500 pointer-events-none">
              {connectionStatus !== 'connected' && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Video className="w-8 h-8 text-gray-500" />
                  </div>
                  <p className="text-sm">
                    {connectionStatus === 'connecting' ? 'Connecting...' : 'Waiting for other participant'}
                  </p>
                </div>
              )}
            </div>
            <div className="absolute bottom-3 left-3 bg-black/50 px-2 py-1 rounded-lg text-xs font-medium">
              {role === 'patient' ? 'Doctor' : 'Patient'}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={toggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition shadow-lg ${isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'}`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          {connectionStatus !== 'connected' ? (
            <button
              onClick={initiateCall}
              disabled={connectionStatus === 'connecting'}
              className="w-16 h-16 rounded-full bg-green-600 hover:bg-green-500 disabled:bg-gray-600 flex items-center justify-center transition shadow-lg"
              title="Start call"
            >
              <Phone className="w-7 h-7" />
            </button>
          ) : (
            <button
              onClick={endCall}
              className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition shadow-lg"
              title="End call"
            >
              <PhoneOff className="w-7 h-7" />
            </button>
          )}

          <button
            onClick={toggleCamera}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition shadow-lg ${isCameraOff ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'}`}
            title={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
          >
            {isCameraOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
          </button>
        </div>

        {/* Manual fallback — only show if no appointment ID */}
        {!appointmentId && (
          <div className="bg-gray-800 rounded-xl p-6 space-y-4">
            <h3 className="font-semibold text-gray-200">Manual Connection</h3>
            {peerId && (
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Your ID (share this)</label>
                <div className="flex gap-2">
                  <input value={peerId} readOnly className="flex-1 px-3 py-2 bg-gray-700 rounded-lg font-mono text-sm border border-gray-600 text-gray-200" />
                  <button onClick={() => copyToClipboard(peerId)} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Their Peer ID</label>
              <div className="flex gap-2">
                <input
                  value={remotePeerId}
                  onChange={(e) => setRemotePeerId(e.target.value)}
                  placeholder="Paste their ID..."
                  className="flex-1 px-3 py-2 bg-gray-700 rounded-lg text-sm border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={initiateCall}
                  disabled={!remotePeerId.trim() || connectionStatus === 'connected'}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg transition text-sm font-medium"
                >
                  Call
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default VideoCallComponent;