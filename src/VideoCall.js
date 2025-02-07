// src/VideoCall.js
import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:3000");

const VideoCall = () => {
  const [partnerSocket, setPartnerSocket] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const [stream, setStream] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    socket.on("paired", (data) => {
      setPartnerSocket(data.partner);
      startVideoCall(data.partner);
    });

    socket.on("chat_message", (message) => {
      setChatMessages((prevMessages) => [...prevMessages, message]);
    });

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((userStream) => {
        localVideoRef.current.srcObject = userStream;
        setStream(userStream);
      });

    return () => {
      socket.off("paired");
      socket.off("chat_message");
    };
  }, []);

  const startVideoCall = (partnerSocket) => {
    setConnected(true);
    // Setup WebRTC connection and handle peer-to-peer connection and stream
    const peerConnection = new RTCPeerConnection();
    stream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, stream);
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice_candidate", event.candidate);
      }
    };

    peerConnection.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    peerConnection.createOffer().then((offer) => {
      return peerConnection.setLocalDescription(offer);
    }).then(() => {
      socket.emit("offer", { offer: peerConnection.localDescription, partner: partnerSocket });
    });

    socket.on("answer", (answer) => {
      peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on("ice_candidate", (candidate) => {
      peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    });
  };

  const sendMessage = (message) => {
    socket.emit("chat_message", message);
  };

  return (
    <div className="video-call">
      <div className="video-container">
        <video ref={localVideoRef} autoPlay muted />
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
