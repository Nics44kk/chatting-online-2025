// src/VideoCall.js

import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

// Connect to the backend
const socket = io("http://localhost:3000");

const VideoCall = () => {
  const [partnerSocket, setPartnerSocket] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const [stream, setStream] = useState(null);
  const [connected, setConnected] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false); // Track permission status

  useEffect(() => {
    // Request permissions for camera and microphone
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((userStream) => {
        // If permissions are granted, show the user's video
        localVideoRef.current.srcObject = userStream;
        setStream(userStream);
        setPermissionGranted(true); // Mark permission as granted
      })
      .catch((error) => {
        // Handle permission denial or errors
        console.error("Permission denied or error in getting media:", error);
        setPermissionGranted(false); // Mark permission as denied
        alert("Please grant permission for the camera and microphone.");
      });

    socket.on("paired", (data) => {
      setPartnerSocket(data.partner);
      startVideoCall(data.partner);
    });

    socket.on("chat_message", (message) => {
      setChatMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => {
      socket.off("paired");
      socket.off("chat_message");
    };
  }, []);

  const startVideoCall = (partnerSocket) => {
    setConnected(true);

    const peerConnection = new RTCPeerConnection();

    // Add local stream to the peer connection
    stream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, stream);
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice_candidate", {
          candidate: event.candidate,
          partner: partnerSocket,
        });
      }
    };

    peerConnection.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    // Create offer and send to the partner (via server)
    peerConnection
      .createOffer()
      .then((offer) => peerConnection.setLocalDescription(offer))
      .then(() => {
        socket.emit("offer", { offer: peerConnection.localDescription, partner: partnerSocket });
      });

    // Handle answer from the partner
    socket.on("answer", (answer) => {
      peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    });

    // Handle ICE candidates from the partner
    socket.on("ice_candidate", (candidate) => {
      peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    });
  };

  const sendMessage = (message) => {
    socket.emit("chat_message", message);
  };

  return (
    <div className="video-call">
      <h2>Valentine's Video Call</h2>

      {/* Show message if permission is not granted */}
      {!permissionGranted && <p>Please allow access to your microphone and camera to start the video call.</p>}

      <div className="video-container">
        {/* Show the local video if permission is granted */}
        {permissionGranted && (
          <video ref={localVideoRef} autoPlay muted />
        )}
        {connected && <video ref={remoteVideoRef} autoPlay />}
      </div>

      <div className="chat-box">
        {chatMessages.map((msg, idx) => (
          <p key={idx}>{msg}</p>
        ))}
        <input
          type="text"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              sendMessage(e.target.value);
              e.target.value = "";
            }
          }}
          placeholder="Type a message"
        />
      </div>
    </div>
  );
};

export default VideoCall;
