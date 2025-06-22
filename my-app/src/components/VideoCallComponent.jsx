import React, { useRef, useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';

const configuration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

function VideoCallComponent() {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [peerConnection, setPeerConnection] = useState(null);
  const callDocRef = doc(collection(db, 'calls'));

  useEffect(() => {
    const initMediaAndConnection = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        const pc = new RTCPeerConnection(configuration);
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
        setPeerConnection(pc);

        pc.ontrack = (event) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        pc.onicecandidate = async (event) => {
          if (event.candidate) {
            await setDoc(callDocRef, {
              iceCandidate: event.candidate.toJSON(),
            }, { merge: true });
          }
        };

      } catch (error) {
        console.error('Error accessing media devices', error);
      }
    };

    initMediaAndConnection();
  }, []);

  const createOffer = async () => {
    if (!peerConnection) return;
    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      await setDoc(callDocRef, { offer: offer.toJSON() });

      console.log('Offer created: ', offer);
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  const createAnswer = async () => {
    if (!peerConnection) return;
    try {
      const callSnap = await getDoc(callDocRef);
      const callData = callSnap.data();
      await peerConnection.setRemoteDescription(new RTCSessionDescription(callData.offer));

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      await setDoc(callDocRef, { answer: answer.toJSON() }, { merge: true });

      console.log('Answer created: ', answer);
    } catch (error) {
      console.error('Error creating answer:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Live Video Call</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-5xl">
        <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            className="w-full h-64 object-cover rounded-lg"
          />
          <p className="text-center py-2 bg-gray-900 text-sm">You</p>
        </div>
        <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
          <video
            ref={remoteVideoRef}
            autoPlay
            className="w-full h-64 object-cover rounded-lg"
          />
          <p className="text-center py-2 bg-gray-900 text-sm">Remote</p>
        </div>
      </div>

      <div className="mt-6 space-x-4">
        <button
          onClick={createOffer}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-700"
        >
          Start Call
        </button>
        <button
          onClick={createAnswer}
          className="bg-green-600 text-white px-6 py-3 rounded-lg shadow hover:bg-green-700"
        >
          Join Call
        </button>
      </div>
    </div>
  );
}

export default VideoCallComponent;
