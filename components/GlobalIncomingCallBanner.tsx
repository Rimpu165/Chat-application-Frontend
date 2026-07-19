"use client";

import { useEffect, useRef, useState } from "react";
import { useSocket } from "@/context/SocketContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Phone, Video, PhoneOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import API from "@/lib/api";
import { resolveMediaUrl } from "@/lib/utils";

export default function GlobalIncomingCallBanner() {
  const { socket, globalIncomingCall, clearGlobalIncomingCall } = useSocket();
  const { user } = useAuth();
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [callerPhoto, setCallerPhoto] = useState<string | null>(null);

  // Fetch caller's profile photo
  useEffect(() => {
    if (!globalIncomingCall?.from) return;
    API.get(`/users/${globalIncomingCall.from}`)
      .then((res) => setCallerPhoto(resolveMediaUrl(res.data?.profilePhoto) || null))
      .catch(() => setCallerPhoto(null));
  }, [globalIncomingCall?.from]);

  // Play ringtone
  useEffect(() => {
    if (globalIncomingCall) {
      // Use Web Audio API to generate a ringtone (no file needed)
      const ctx = new AudioContext();
      let stopped = false;

      const playTone = () => {
        if (stopped) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(660, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      };

      playTone();
      const interval = setInterval(playTone, 1200);

      return () => {
        stopped = true;
        clearInterval(interval);
        ctx.close();
      };
    }
  }, [globalIncomingCall]);

  const handleAccept = () => {
    if (!globalIncomingCall) return;
    // Navigate to the chat page; ChatWindow will handle the actual WebRTC accept
    // We pass the callerId via URL so ChatWindow can open the right room
    clearGlobalIncomingCall();
    router.push(`/chat?incomingFrom=${globalIncomingCall.from}`);
  };

  const handleReject = () => {
    if (!globalIncomingCall || !socket) return;
    socket.emit("rejectCall", { to: globalIncomingCall.from });
    clearGlobalIncomingCall();
  };

  return (
    <AnimatePresence>
      {globalIncomingCall && (
        <motion.div
          initial={{ y: -120, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -120, opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          style={{
            position: "fixed",
            top: "16px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
            width: "min(92vw, 380px)",
            background: "linear-gradient(135deg, #0f0f1a 0%, #1a0a2e 100%)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "20px",
            padding: "16px 20px",
            boxShadow: "0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(99,102,241,0.2)",
            backdropFilter: "blur(20px)",
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          {/* Pulsing ring animation */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <motion.div
              animate={{ scale: [1, 1.25, 1] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
              style={{
                position: "absolute",
                inset: "-8px",
                borderRadius: "50%",
                background: "rgba(99,102,241,0.2)",
              }}
            />
            <div style={{
              width: "52px",
              height: "52px",
              borderRadius: "50%",
              overflow: "hidden",
              border: "2px solid rgba(99,102,241,0.7)",
              background: "#1e1e2e",
              position: "relative",
            }}>
              {callerPhoto ? (
                <img src={callerPhoto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", fontWeight: 700, color: "white" }}>
                  {globalIncomingCall.name[0]?.toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: "15px", color: "white", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {globalIncomingCall.name}
            </p>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginTop: "2px" }}>
              {globalIncomingCall.isVideo ? "📹 Incoming video call..." : "📞 Incoming voice call..."}
            </p>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: "10px", flexShrink: 0 }}>
            {/* Reject */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleReject}
              title="Reject"
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "#dc2626",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 16px rgba(220,38,38,0.5)",
              }}
            >
              <PhoneOff style={{ width: "18px", height: "18px", color: "white" }} />
            </motion.button>

            {/* Accept */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleAccept}
              title="Accept"
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "#16a34a",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 16px rgba(22,163,74,0.5)",
              }}
            >
              {globalIncomingCall.isVideo
                ? <Video style={{ width: "18px", height: "18px", color: "white" }} />
                : <Phone style={{ width: "18px", height: "18px", color: "white" }} />
              }
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
