import React, { useRef, useEffect, useState } from 'react';

const configuration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

function VideoCallComponent() {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [peerConnection, setPeerConnection] = useState(null);

  useEffect(() => {
    const initMediaAndConnection = async () => {
      try {
        // Access user's media devices
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        
        // Display local video stream
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        // Initialize RTCPeerConnection and add local tracks
        const pc = new RTCPeerConnection(configuration);
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
        setPeerConnection(pc);
  
        // When a remote track is received, display it
        pc.ontrack = (event) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };
  
        // ICE candidate listener – send candidates over your signaling mechanism (e.g., Firebase)
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            console.log("New ICE candidate:", event.candidate);
            // Send the candidate to the remote peer via your signaling server.
          }
        };
  
      } catch (error) {
        console.error("Error accessing media devices", error);
      }
    };

    initMediaAndConnection();
  }, []);

  // Placeholder functions for offer/answer exchange
  const createOffer = async () => {
    if (!peerConnection) return;
    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      console.log("Offer created: ", offer);
      // TODO: Send this offer to the remote peer via your signaling channel
    } catch (error) {
      console.error("Error creating offer:", error);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <h1 className="text-2xl font-bold">Video Call</h1>
      <div className="flex space-x-4">
        <video ref={localVideoRef} autoPlay muted style={{ width: '300px' }} />
        <video ref={remoteVideoRef} autoPlay style={{ width: '300px' }} />
      </div>
      <button
        onClick={createOffer}
        className="bg-blue-600 text-white px-4 py-2 rounded-md transition hover:bg-blue-700"
      >
        Create Offer
      </button>
    </div>
  );
}

export default VideoCallComponent;
