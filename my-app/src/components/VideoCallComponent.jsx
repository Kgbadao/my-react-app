import React, { useRef, useEffect, useState } from 'react';
import { Phone, PhoneOff, Copy, Check } from 'lucide-react';

function VideoCallComponent() {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const connRef = useRef(null);
  const callRef = useRef(null);

  const [peerId, setPeerId] = useState('');
  const [remotePeerId, setRemotePeerId] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('idle');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [peerLoaded, setPeerLoaded] = useState(false);
  const [isCaller, setIsCaller] = useState(false);

  // Load PeerJS library
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.4/peerjs.min.js';
    script.onload = () => {
      setPeerLoaded(true);
    };
    script.onerror = () => {
      setError('Failed to load PeerJS library');
    };
    document.head.appendChild(script);
  }, []);

  // Initialize media and PeerJS
  useEffect(() => {
    if (!peerLoaded) return;

    const initMedia = async () => {
      try {
        setError('');
        
        // Get user media
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Create Peer instance
        const peer = new window.Peer({
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
            ],
          },
        });

        peerRef.current = peer;

        // Set peer ID when ready
        peer.on('open', (id) => {
          console.log('Peer ID:', id);
          setPeerId(id);
        });

        // Handle incoming calls
        peer.on('call', (call) => {
          console.log('Incoming call from:', call.peer);
          setConnectionStatus('connecting');
          setIsCaller(false);
          callRef.current = call;

          // Answer the call
          call.answer(stream);

          call.on('stream', (remoteStream) => {
            console.log('Received remote stream');
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = remoteStream;
            }
            setConnectionStatus('connected');
          });

          call.on('error', (err) => {
            console.error('Call error:', err);
            setError(`Call error: ${err.message}`);
            setConnectionStatus('failed');
          });

          call.on('close', () => {
            console.log('Call closed');
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = null;
            }
            setConnectionStatus('idle');
          });
        });

        // Handle errors
        peer.on('error', (err) => {
          console.error('Peer error:', err);
          setError(`Peer error: ${err.message}`);
        });

        return () => {
          stream.getTracks().forEach((track) => track.stop());
          if (callRef.current) {
            callRef.current.close();
          }
          peer.destroy();
        };
      } catch (error) {
        setError(`Media access error: ${error.message}`);
        console.error('Error accessing media devices', error);
      }
    };

    initMedia();
  }, [peerLoaded]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const initiateCall = async () => {
    if (!remotePeerId.trim()) {
      setError('Please enter the remote peer ID');
      return;
    }

    if (!peerRef.current || !localVideoRef.current?.srcObject) {
      setError('Media not ready. Please wait a moment.');
      return;
    }

    try {
      setError('');
      setConnectionStatus('connecting');
      setIsCaller(true);

      const stream = localVideoRef.current.srcObject;
      const call = peerRef.current.call(remotePeerId, stream);
      callRef.current = call;

      call.on('stream', (remoteStream) => {
        console.log('Received remote stream');
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
        setConnectionStatus('connected');
      });

      call.on('error', (err) => {
        console.error('Call error:', err);
        setError(`Call error: ${err.message}`);
        setConnectionStatus('failed');
      });

      call.on('close', () => {
        console.log('Call closed');
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = null;
        }
        setConnectionStatus('idle');
      });
    } catch (error) {
      setError(`Failed to initiate call: ${error.message}`);
      console.error('Error initiating call', error);
      setConnectionStatus('failed');
    }
  };

  const endCall = () => {
    if (callRef.current) {
      callRef.current.close();
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    setConnectionStatus('idle');
    setRemotePeerId('');
    setError('');
    setIsCaller(false);
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'failed':
        return 'Connection Failed';
      default:
        return 'Idle';
    }
  };

  if (!peerLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-2">Loading PeerJS...</p>
          <p className="text-gray-400">Please wait while we initialize the connection library</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex flex-col px-4 py-6">
      <div className="max-w-7xl w-full mx-auto flex flex-col h-full">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-4xl font-bold mb-2">PeerJS Video Call</h1>
          <div className="flex items-center justify-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
            <span className="text-sm text-gray-300">{getStatusText()}</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-900 border border-red-600 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Videos Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8 flex-1">
          {/* Local Video */}
          <div className="relative bg-gray-900 rounded-xl overflow-hidden shadow-2xl h-80 lg:h-auto min-h-96">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
              <p className="text-sm font-medium">You</p>
            </div>
          </div>

          {/* Remote Video */}
          <div className="relative bg-gray-900 rounded-xl overflow-hidden shadow-2xl h-80 lg:h-auto min-h-96">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {!remoteVideoRef.current?.srcObject && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                <span>Waiting for remote video...</span>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
              <p className="text-sm font-medium">Remote</p>
            </div>
          </div>
        </div>

        {/* Setup Section */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8 space-y-6">
          {/* Your Peer ID */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Your Peer ID</h2>
            {peerId ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={peerId}
                  readOnly
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 font-mono text-sm"
                />
                <button
                  onClick={() => copyToClipboard(peerId)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition flex items-center gap-2"
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
            ) : (
              <div className="px-4 py-2 bg-gray-700 text-gray-400 rounded-lg">
                Generating peer ID...
              </div>
            )}
            <p className="text-sm text-gray-400 mt-2">Share this ID with the person you want to call</p>
          </div>

          {/* Connect to Remote */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Connect to Remote Peer</h2>
            <div className="space-y-2">
              <label className="block text-sm text-gray-300">Enter their Peer ID:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste their peer ID here"
                  value={remotePeerId}
                  onChange={(e) => setRemotePeerId(e.target.value)}
                  disabled={connectionStatus === 'connected'}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 placeholder-gray-500 focus:outline-none focus:border-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed"
                />
                <button
                  onClick={initiateCall}
                  disabled={connectionStatus === 'connected' || connectionStatus === 'connecting'}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition flex items-center gap-2"
                >
                  <Phone size={18} />
                  Call
                </button>
              </div>
            </div>
          </div>

          {/* End Call Button */}
          {connectionStatus === 'connected' && (
            <button
              onClick={endCall}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              <PhoneOff size={20} />
              End Call
            </button>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-gray-800 p-4 rounded-lg text-sm text-gray-300">
          <h3 className="font-semibold mb-2">📝 How to use:</h3>
          <ol className="list-decimal list-inside space-y-1 text-xs">
            <li>Your Peer ID appears automatically at the top</li>
            <li>Copy your Peer ID and share it with the person you want to call</li>
            <li>Get their Peer ID and paste it in the "Connect to Remote Peer" field</li>
            <li>Click "Call" to initiate the connection</li>
            <li>They'll receive the call and it should connect automatically</li>
            <li>Video will appear once connected! 🎉</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default VideoCallComponent;