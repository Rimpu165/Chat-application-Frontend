"use client";

import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import API from "@/lib/api";
import { formatChatTime, formatLastSeen } from "@/lib/format";
import { cn, resolveMediaUrl } from "@/lib/utils";
import { 
  Phone, 
  Video, 
  Send, 
  Paperclip, 
  MoreVertical, 
  ArrowLeft,
  Check,
  CheckCheck,
  Reply,
  Pencil,
  Trash2,
  X,
  UserX,
  PhoneCall
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface ChatWindowProps {
  room: any;
  onClose: () => void;
}

export default function ChatWindow({ room, onClose }: ChatWindowProps) {
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [replyTo, setReplyTo] = useState<any>(null);
  const [editingId, setEditingId] = useState("");
  const [editingText, setEditingText] = useState("");
  const [sendStatus, setSendStatus] = useState({
    canSend: true,
    message: "",
    blockedByMe: false,
    blockedByOther: false,
  });
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [callActive, setCallActive] = useState(false);
  const [activeCallIsVideo, setActiveCallIsVideo] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showCallHistory, setShowCallHistory] = useState(false);
  const [activeCallDirection, setActiveCallDirection] = useState<"incoming" | "outgoing">("outgoing");
  const [callDurationSec, setCallDurationSec] = useState(0);
  const [callStartedAtMs, setCallStartedAtMs] = useState<number | null>(null);
  const [callHistory, setCallHistory] = useState<
    Array<{
      _id: string;
      type: "audio" | "video";
      direction: "incoming" | "outgoing";
      status: "started" | "answered" | "rejected" | "missed" | "ended";
      createdAt: string;
      durationSec?: number;
      peer?: { name?: string };
    }>
  >([]);

  const otherParticipant = room.participants.find((p: any) => p._id !== user?._id);
  const isOnline = otherParticipant && onlineUsers.includes(otherParticipant._id);
  const roomName = room.isGroup ? room.name : (otherParticipant?.name || "Deleted User");
  const isBlockedChat = Boolean(sendStatus.blockedByMe || sendStatus.blockedByOther || room?.isBlocked);
  const otherAvatarUrl = room.isGroup
    ? undefined
    : resolveMediaUrl(otherParticipant?.profilePhoto);

  const senderIdOf = (msg: { sender: { _id?: string } | string }) =>
    typeof msg.sender === "object" && msg.sender ? msg.sender._id : (msg.sender as string);

  const formatDuration = (seconds: number) => {
    const s = Math.max(0, Math.floor(seconds || 0));
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  };

  useEffect(() => {
    fetchMessages();
    fetchSendStatus();
    markSeen();
    
    if (socket) {
      socket.emit("joinRoom", room._id);
      
      const handleNewMessage = (msg: { room?: string | { _id?: string } }) => {
        const rid = typeof msg.room === "object" ? msg.room?._id : msg.room;
        if (String(rid) === String(room._id)) {
          setMessages((prev) => [...prev, msg]);
          const senderId =
            typeof (msg as { sender?: string | { _id?: string } }).sender === "object"
              ? (msg as { sender?: { _id?: string } }).sender?._id
              : (msg as { sender?: string }).sender;
          // If I receive someone else's message while this chat is open, mark it seen immediately.
          if (String(senderId || "") !== String(user?._id || "")) {
            void API.put(`/messages/${room._id}/seen`);
          }
        }
      };
      const handleEdited = ({ messageId, newText, isEdited }: any) => {
        setMessages((prev) => prev.map((m) => (m._id === messageId ? { ...m, message: newText, isEdited } : m)));
      };
      const handleDeleted = ({ messageId }: any) => {
        setMessages((prev) => prev.map((m) => (m._id === messageId ? { ...m, isDeleted: true, message: "This message was deleted" } : m)));
      };
      const handleReaction = ({ messageId, reactions }: any) => {
        setMessages((prev) => prev.map((m) => (m._id === messageId ? { ...m, reactions } : m)));
      };
      const handleIncomingCall = (data: any) => setIncomingCall(data);
      const handleCallEnded = () => endCall(false);
      const handleChatCleared = ({ roomId }: { roomId: string }) => {
        if (String(roomId) === String(room._id)) {
          setMessages([]);
        }
      };

      const handleTyping = ({ userId }: { userId: string }) => {
        if (userId === otherParticipant?._id) setOtherUserTyping(true);
      };

      const handleStopTyping = ({ userId }: { userId: string }) => {
        if (userId === otherParticipant?._id) setOtherUserTyping(false);
      };

      socket.on("receiveMessage", handleNewMessage);
      socket.on("userTyping", handleTyping);
      socket.on("userStoppedTyping", handleStopTyping);
      socket.on("messageEdited", handleEdited);
      socket.on("messageDeleted", handleDeleted);
      socket.on("messageReaction", handleReaction);
      socket.on("incomingCall", handleIncomingCall);
      socket.on("callEnded", handleCallEnded);
      socket.on("chatCleared", handleChatCleared);
      const handleMessagesSeen = ({
        roomId,
        byUser,
        seenAt,
      }: {
        roomId: string;
        byUser: string;
        seenAt?: string;
      }) => {
        if (String(roomId) !== String(room._id) || byUser === user?._id) return;
        const seenAtMs = seenAt ? new Date(seenAt).getTime() : Number.POSITIVE_INFINITY;
        setMessages((prev) =>
          prev.map((m) => {
            const sid = senderIdOf(m);
            const msgTime = m?.createdAt ? new Date(m.createdAt).getTime() : 0;
            return sid === user?._id && msgTime <= seenAtMs ? { ...m, status: "seen" } : m;
          })
        );
      };
      socket.on("messagesSeen", handleMessagesSeen);

      return () => {
        socket.emit("leaveRoom", room._id);
        socket.off("receiveMessage", handleNewMessage);
        socket.off("userTyping", handleTyping);
        socket.off("userStoppedTyping", handleStopTyping);
        socket.off("messageEdited", handleEdited);
        socket.off("messageDeleted", handleDeleted);
        socket.off("messageReaction", handleReaction);
        socket.off("incomingCall", handleIncomingCall);
        socket.off("callEnded", handleCallEnded);
        socket.off("chatCleared", handleChatCleared);
        socket.off("messagesSeen", handleMessagesSeen);
      };
    }
  }, [room._id, socket, otherParticipant?._id, user?._id]);

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    });
  }, [messages, otherUserTyping]);

  const fetchMessages = async () => {
    try {
      const res = await API.get(`/messages/${room._id}`);
      setMessages(res.data);
    } catch (err) {
      console.error("Failed to fetch messages");
    }
  };

  const markSeen = async () => {
    try {
      await API.put(`/messages/${room._id}/seen`);
    } catch {
      // silent
    }
  };

  const fetchSendStatus = async () => {
    try {
      const res = await API.get(`/rooms/${room._id}/send-status`);
      setSendStatus(res.data);
    } catch (err) {
        console.error("Failed to fetch send status");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const formData = new FormData();
      formData.append("roomId", room._id);
      formData.append("message", newMessage);
      if (replyTo?._id) formData.append("replyTo", replyTo._id);
      if (file) formData.append("file", file);
      await API.post("/messages/send", formData);
      setNewMessage("");
      setFile(null);
      setReplyTo(null);
      fetchSendStatus(); // Refresh status after sending
      if (socket) socket.emit("stopTyping", { roomId: room._id });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to send message");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (socket) {
      if (e.target.value && !isTyping) {
        setIsTyping(true);
        socket.emit("typing", { roomId: room._id });
      } else if (!e.target.value && isTyping) {
        setIsTyping(false);
        socket.emit("stopTyping", { roomId: room._id });
      }
    }
  };

  const startCall = async (isVideo: boolean) => {
    if (!socket || !otherParticipant?._id || !user) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: isVideo });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
      peerRef.current = pc;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
      };
      pc.onicecandidate = (event) => {
        if (event.candidate) socket.emit("iceCandidate", { to: otherParticipant._id, candidate: event.candidate });
      };

      socket.on("callAccepted", async (payload: RTCSessionDescriptionInit | { signal: RTCSessionDescriptionInit; answeredAt?: number }) => {
        try {
          if (!peerRef.current || pc.signalingState === "closed") return;
          const signal =
            payload && typeof payload === "object" && "signal" in payload
              ? payload.signal
              : (payload as RTCSessionDescriptionInit);
          const answeredAt =
            payload && typeof payload === "object" && "answeredAt" in payload
              ? Number(payload.answeredAt || 0)
              : 0;
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
          setCallStartedAtMs(answeredAt || Date.now());
          setCallDurationSec(0);
          setCallActive(true);
        } catch {
          // Ignore late/duplicate callAccepted packets after call teardown.
        }
      });
      socket.on("iceCandidate", async (candidate) => {
        try {
          if (!peerRef.current || pc.signalingState === "closed") return;
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch {}
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("callUser", {
        userToCall: otherParticipant._id,
        signalData: offer,
        from: user._id,
        name: user.name,
        isVideo,
      });
      void logCallEvent("started", isVideo, "outgoing");
      setActiveCallIsVideo(isVideo);
      setActiveCallDirection("outgoing");
      setCallActive(true);
    } catch {
      toast.error("Unable to start call");
    }
  };

  const acceptIncomingCall = async () => {
    if (!socket || !incomingCall) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: incomingCall.isVideo });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
      peerRef.current = pc;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      pc.ontrack = (event) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
      };
      pc.onicecandidate = (event) => {
        if (event.candidate) socket.emit("iceCandidate", { to: incomingCall.from, candidate: event.candidate });
      };
      socket.on("iceCandidate", async (candidate) => {
        try {
          if (!peerRef.current || pc.signalingState === "closed") return;
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch {}
      });
      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.signal));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      const answeredAt = Date.now();
      socket.emit("answerCall", { to: incomingCall.from, signal: answer, answeredAt });
      void logCallEvent("answered", Boolean(incomingCall.isVideo), "incoming");
      setActiveCallIsVideo(Boolean(incomingCall.isVideo));
      setActiveCallDirection("incoming");
      setCallStartedAtMs(answeredAt);
      setCallDurationSec(0);
      setIncomingCall(null);
      setCallActive(true);
    } catch {
      toast.error("Unable to accept call");
    }
  };

  const endCall = (notifyPeer = true) => {
    if (notifyPeer && socket && otherParticipant?._id) {
      socket.emit("endCall", { to: otherParticipant._id });
    }
    if (callActive) {
      const durationSec = callStartedAtMs
        ? Math.floor((Date.now() - callStartedAtMs) / 1000)
        : callDurationSec;
      void API.post("/calls/log", {
        roomId: room._id,
        peerId: otherParticipant?._id,
        type: activeCallIsVideo ? "video" : "audio",
        direction: activeCallDirection,
        status: "ended",
        durationSec,
      }).catch(() => {
        // ignore call-log errors
      });
    }
    peerRef.current?.close();
    peerRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setIncomingCall(null);
    setCallActive(false);
    setActiveCallIsVideo(false);
    setActiveCallDirection("outgoing");
    setCallStartedAtMs(null);
    setCallDurationSec(0);
    void fetchCallHistory();
  };

  const rejectIncomingCall = () => {
    void logCallEvent("rejected", Boolean(incomingCall?.isVideo), "incoming");
    setIncomingCall(null);
    void fetchCallHistory();
  };

  const startEdit = (msg: any) => {
    setEditingId(msg._id);
    setEditingText(msg.message);
  };

  const saveEdit = async () => {
    if (!editingId || !editingText.trim()) return;
    try {
      await API.put(`/messages/${editingId}/edit`, { newText: editingText });
      setEditingId("");
      setEditingText("");
    } catch {
      toast.error("Unable to edit message");
    }
  };

  const getSenderId = senderIdOf;

  const getSenderPhoto = (msg: { sender: { profilePhoto?: string } | string }) =>
    typeof msg.sender === "object" && msg.sender
      ? resolveMediaUrl(msg.sender.profilePhoto)
      : undefined;

  useEffect(() => {
    const onDocClick = (ev: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(ev.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener("mousedown", onDocClick);
    }
    return () => {
      document.removeEventListener("mousedown", onDocClick);
    };
  }, [showMenu]);

  useEffect(() => {
    setShowCallHistory(false);
    setCallHistory([]);
  }, [room._id]);

  const handleDeleteChat = async () => {
    try {
      await API.delete(`/rooms/${room._id}`);
      toast.success("Chat deleted");
      setShowMenu(false);
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete chat");
    }
  };

  const handleClearChat = async () => {
    try {
      await API.delete(`/messages/room/${room._id}/clear`);
      setMessages([]);
      toast.success("Chat cleared");
      setShowMenu(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to clear chat");
    }
  };

  const handleToggleBlock = async () => {
    if (!otherParticipant?._id) return;
    try {
      const res = await API.put(`/users/block/${otherParticipant._id}`);
      toast.success(res?.data?.message || "User status updated");
      await fetchSendStatus();
      setShowMenu(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update block");
    }
  };

  const logCallEvent = async (
    status: "started" | "answered" | "rejected" | "missed" | "ended",
    isVideo: boolean,
    direction: "incoming" | "outgoing"
  ) => {
    if (!otherParticipant?._id) return;
    try {
      await API.post("/calls/log", {
        roomId: room._id,
        peerId: otherParticipant._id,
        type: isVideo ? "video" : "audio",
        direction,
        status,
      });
    } catch {
      // keep chat flow smooth even if logging fails
    }
  };

  const fetchCallHistory = async () => {
    try {
      const res = await API.get(`/calls/room/${room._id}`);
      setCallHistory(res.data || []);
    } catch {
      toast.error("Failed to load call history");
    }
  };

  useEffect(() => {
    if (!callActive || !callStartedAtMs) return;
    const timer = setInterval(() => {
      setCallDurationSec(Math.floor((Date.now() - callStartedAtMs) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [callActive, callStartedAtMs]);

  const liveCallDurationLabel = useMemo(
    () => formatDuration(callDurationSec),
    [callDurationSec]
  );

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-chat-bg">
      <div className="pointer-events-none absolute left-[20%] top-[10%] h-[30%] w-[30%] rounded-full bg-chat-accent/5 blur-[100px]" />
      
      {/* Header */}
      <header className="relative z-10 flex shrink-0 items-center justify-between border-b border-chat-border bg-chat-surface/80 px-4 py-3 backdrop-blur-md sm:px-6 sm:py-4">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <button title="Back to chat list" type="button" onClick={onClose} className="rounded-xl p-2 text-chat-muted transition-colors hover:bg-chat-raised hover:text-chat-text lg:hidden">
            <ArrowLeft className="h-5 w-5" />
          </button>
          
          <div className="relative shrink-0">
            {otherAvatarUrl && !isBlockedChat ? (
              <img
                src={otherAvatarUrl}
                alt=""
                className="h-11 w-11 rounded-2xl border border-chat-border object-cover shadow-inner"
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-chat-border bg-chat-raised text-lg font-bold text-chat-muted shadow-inner">
                {roomName[0]}
              </div>
            )}
            {!room.isGroup && isOnline && !isBlockedChat && (
              <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-[3px] border-chat-bg bg-chat-success shadow-sm" />
            )}
          </div>

          <div className="min-w-0">
             <h3 className="truncate font-semibold text-chat-text">{roomName}</h3>
             <div className="mt-0.5 flex items-center gap-1.5 text-[10px]">
               {isBlockedChat ? (
                  <span className="text-amber-300">Blocked chat</span>
               ) : isOnline ? (
                  <span className="flex items-center gap-1 text-chat-success"><span className="h-1.5 w-1.5 rounded-full bg-chat-success" /> Active now</span>
               ) : !room.isGroup && otherParticipant?.lastSeen ? (
                  <span className="text-chat-muted">{formatLastSeen(otherParticipant.lastSeen)}</span>
               ) : (
                  <span className="text-chat-muted">Away</span>
               )}
               {otherUserTyping && <span className="ml-2 animate-pulse font-medium text-chat-accent">typing…</span>}
             </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
           <button title="Voice call" type="button" onClick={() => startCall(false)} disabled={isBlockedChat} className="rounded-xl bg-chat-raised/80 p-2.5 text-chat-muted transition-all hover:bg-chat-border/80 hover:text-chat-text disabled:cursor-not-allowed disabled:opacity-40">
              <Phone className="h-4 w-4" />
           </button>
           <button title="Video call" type="button" onClick={() => startCall(true)} disabled={isBlockedChat} className="rounded-xl bg-chat-raised/80 p-2.5 text-chat-muted transition-all hover:bg-chat-border/80 hover:text-chat-text disabled:cursor-not-allowed disabled:opacity-40">
              <Video className="h-4 w-4" />
           </button>
          <button
            title="More"
            type="button"
            onClick={() => setShowMenu((v) => !v)}
            className="rounded-xl bg-chat-raised/80 p-2.5 text-chat-muted transition-all hover:bg-chat-border/80 hover:text-chat-text"
          >
              <MoreVertical className="h-4 w-4" />
           </button>
        </div>
      </header>
      {showMenu && (
        <div ref={menuRef} className="absolute right-4 top-16 z-30 w-44 rounded-xl border border-chat-border bg-chat-surface p-1.5 shadow-2xl">
          <button
            type="button"
            onClick={() => {
              setShowCallHistory(true);
              void fetchCallHistory();
              setShowMenu(false);
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-chat-text hover:bg-chat-raised"
          >
            <PhoneCall className="h-4 w-4" />
            Call history
          </button>
          <button
            type="button"
            onClick={handleClearChat}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-chat-text hover:bg-chat-raised"
          >
            Clear chat
          </button>
          {!room.isGroup && (
            <button
              type="button"
              onClick={handleToggleBlock}
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-amber-300 hover:bg-chat-raised"
            >
              Block / Unblock user
            </button>
          )}
          <button
            type="button"
            onClick={handleDeleteChat}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-400 hover:bg-red-600/15"
          >
            Delete chat
          </button>
        </div>
      )}
      {showCallHistory && (
        <>
          <button
            type="button"
            aria-label="Close call history backdrop"
            onClick={() => setShowCallHistory(false)}
            className="absolute inset-0 z-35 bg-black/20"
          />
          <aside className="absolute inset-y-0 right-0 z-40 w-80 border-l border-chat-border bg-chat-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-chat-border px-4 py-3">
              <div className="text-sm font-semibold text-chat-text">Call history</div>
              <button
                type="button"
                title="Close call history"
                onClick={() => setShowCallHistory(false)}
                className="rounded-lg p-1.5 text-chat-muted transition-colors hover:bg-chat-raised hover:text-chat-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="custom-scrollbar h-[calc(100%-53px)] space-y-2 overflow-y-auto p-3">
              {callHistory.length === 0 ? (
                <div className="rounded-lg bg-chat-raised/60 px-3 py-3 text-xs text-chat-muted">No call history yet</div>
              ) : (
                callHistory.map((c) => (
                  <div key={c._id} className="rounded-lg bg-chat-raised/60 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-medium text-chat-text">
                        {c.direction === "outgoing" ? "Outgoing" : "Incoming"} {c.type}
                      </span>
                      <span className="text-chat-muted">{formatChatTime(c.createdAt)}</span>
                    </div>
                    <div className="mt-0.5 text-[11px] capitalize text-chat-muted">
                      {c.status} {c.peer?.name ? `with ${c.peer.name}` : ""}
                      {typeof c.durationSec === "number" && c.durationSec > 0 ? ` • ${formatDuration(c.durationSec)}` : ""}
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>
        </>
      )}

      {/* Messages area — only this region scrolls; header + input stay fixed */}
      <div
        ref={messagesContainerRef}
        className="custom-scrollbar relative z-0 min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-4"
      >
        {isBlockedChat && !room.isGroup && (
          <div className="mx-auto mb-3 max-w-xl rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-center text-xs text-amber-200">
            <div className="mb-1 flex items-center justify-center gap-1.5 font-medium">
              <UserX className="h-3.5 w-3.5" />
              {sendStatus.blockedByMe ? "You have blocked this person." : "You are blocked by this person."}
            </div>
            {sendStatus.blockedByMe && (
              <button
                type="button"
                onClick={handleToggleBlock}
                className="rounded-lg bg-amber-200 px-3 py-1 text-[11px] font-semibold text-amber-900"
              >
                Tap to unblock
              </button>
            )}
          </div>
        )}
        {messages.map((msg, i) => {
          const isMe =
            getSenderId(msg) === user?._id ||
            msg.sender === user?._id ||
            (typeof msg.sender === "object" && msg.sender?._id === user?._id);
          const prev = messages[i - 1];
          const showAvatar =
            i === 0 || (prev ? getSenderId(prev) !== getSenderId(msg) : true);
          const senderPhoto = !isMe ? getSenderPhoto(msg) : undefined;

          return (
            <div key={msg._id} className={cn(
              "flex items-end gap-3 max-w-[85%] sm:max-w-[70%]",
              isMe ? "ml-auto flex-row-reverse" : "mr-auto"
            )}>
              {!isMe && (
                <div
                  className={cn(
                    "mb-0.5 h-8 w-8 shrink-0 overflow-hidden rounded-xl shadow-sm",
                    !showAvatar && "invisible opacity-0"
                  )}
                >
                  {senderPhoto ? (
                    <img src={senderPhoto} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-chat-raised text-xs font-bold text-chat-muted">
                      {roomName[0]}
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex flex-col group">
                <div className={cn(
                  "relative rounded-[22px] px-4 py-2.5 text-sm shadow-sm",
                  isMe 
                    ? "rounded-br-md bg-chat-bubble-out text-white" 
                    : "rounded-bl-md border border-chat-border bg-chat-bubble-in text-chat-text"
                )}>
                   {msg.replyTo?.message && (
                    <div className="mb-1 px-2 py-1 rounded-lg bg-black/20 text-[11px]">
                      Reply: {msg.replyTo.message}
                    </div>
                   )}
                   {msg.fileUrl && (
                    <a
                      href={resolveMediaUrl(msg.fileUrl) || msg.fileUrl}
                      target="_blank"
                      className="mb-1 block text-xs underline"
                      rel="noreferrer"
                    >
                      Attachment: {msg.fileName || "Open file"}
                    </a>
                   )}
                   {editingId === msg._id ? (
                    <div className="flex items-center gap-2">
                      <input placeholder="Edit message" value={editingText} onChange={(e) => setEditingText(e.target.value)} className="text-xs bg-black/20 rounded px-2 py-1 w-full" />
                      <button title="Save edit" onClick={saveEdit}><CheckCheck className="w-3 h-3" /></button>
                    </div>
                   ) : (
                    msg.message
                   )}
                   {msg.isEdited && <span className="text-[10px] opacity-70 ml-2">(edited)</span>}
                   <div className="flex gap-1 mt-1">
                    {(msg.reactions || []).map((r: any, idx: number) => (
                      <span key={idx} className="text-xs bg-black/20 px-1.5 rounded">{r.emoji}</span>
                    ))}
                   </div>
                   <div className={cn(
                     "mt-1 flex items-center justify-end gap-1 text-[9px]",
                     isMe ? "text-white/70" : "text-chat-muted"
                   )}>
                     {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                     {isMe &&
                       (msg.status === "seen" ? (
                         <CheckCheck className="h-3 w-3 text-white" aria-hidden />
                       ) : msg.status === "delivered" ? (
                         <CheckCheck className="h-3 w-3 text-white/60" aria-hidden />
                       ) : (
                         <Check className="h-3 w-3 text-white/55" aria-hidden />
                       ))}
                   </div>
                </div>
                <div className="mt-1 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button title="Reply" type="button" onClick={() => setReplyTo(msg)} className="rounded p-1 hover:bg-chat-raised"><Reply className="h-3 w-3" /></button>
                  <button title="React" type="button" onClick={() => API.post(`/messages/${msg._id}/react`, { emoji: "❤️" })} className="rounded p-1 text-xs hover:bg-chat-raised">❤️</button>
                  {isMe && (
                    <>
                      <button title="Edit" type="button" onClick={() => startEdit(msg)} className="rounded p-1 hover:bg-chat-raised"><Pencil className="h-3 w-3" /></button>
                      <button title="Delete" type="button" onClick={() => API.delete(`/messages/${msg._id}`)} className="rounded p-1 hover:bg-chat-raised"><Trash2 className="h-3 w-3" /></button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {otherUserTyping && (
           <div className="mr-auto flex items-center gap-3">
             <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-chat-raised shadow-sm">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-chat-muted [animation-delay:-0.3s]" />
                <span className="mx-0.5 h-1.5 w-1.5 animate-bounce rounded-full bg-chat-muted [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-chat-muted" />
             </div>
           </div>
        )}
      </div>

      {/* Input area */}
      <footer className="relative z-10 shrink-0 border-t border-chat-border/60 bg-linear-to-t from-chat-bg via-chat-bg to-transparent p-4 sm:p-6">
        {!sendStatus.canSend ? (
          <div className="mx-auto max-w-4xl rounded-2xl border border-chat-border bg-chat-surface/90 p-4 text-center backdrop-blur-md">
            <p className="mb-3 text-sm font-medium text-chat-muted">
              {sendStatus.message || "You've reached the message limit for this conversation."}
            </p>
            {sendStatus.blockedByMe ? (
              <button
                type="button"
                onClick={handleToggleBlock}
                className="rounded-xl bg-amber-200 px-6 py-2 text-xs font-bold text-amber-900 shadow-lg transition-all hover:opacity-90"
              >
                Tap to unblock
              </button>
            ) : !sendStatus.blockedByOther ? (
              <button 
                type="button"
                onClick={() => router.push("/users")}
                className="rounded-xl bg-chat-accent px-6 py-2 text-xs font-bold text-chat-bg shadow-lg shadow-chat-accent/20 transition-all hover:opacity-90"
              >
                Send friend request
              </button>
            ) : null}
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="relative mx-auto flex max-w-4xl items-center gap-2 sm:gap-3">
            {replyTo && (
              <div className="absolute -top-11 left-0 right-0 mx-auto flex max-w-4xl items-center justify-between rounded-xl border border-chat-border bg-chat-surface px-3 py-2 text-xs text-chat-text">
                <span className="truncate pr-2">Replying to: {replyTo.message?.slice(0, 60)}</span>
                <button title="Cancel reply" type="button" onClick={() => setReplyTo(null)}><X className="h-3 w-3 shrink-0" /></button>
              </div>
            )}
            <div className="flex flex-1 items-center gap-2 rounded-2xl border border-chat-border bg-chat-surface px-3 py-2 backdrop-blur-xl transition-all focus-within:border-chat-accent/50 focus-within:ring-2 focus-within:ring-chat-accent/20 sm:px-4">
              <input 
                type="text" 
                placeholder="Message…"
                value={newMessage}
                onChange={handleInputChange}
                className="min-w-0 flex-1 bg-transparent py-2 text-sm text-chat-text placeholder:text-chat-muted focus:outline-none"
              />
              <label title="Attach file" className="cursor-pointer p-2 text-chat-muted transition-colors hover:text-chat-accent">
                <Paperclip className="h-5 w-5" />
                <input aria-label="Attach file" type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </label>
            </div>
            <button 
              type="submit"
              title="Send message"
              disabled={!newMessage.trim()}
              className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-chat-accent text-chat-bg shadow-lg shadow-chat-accent/25 transition-all hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 sm:h-12 sm:w-12"
            >
              <Send className="h-5 w-5 translate-x-0.5 -translate-y-0.5 transition-transform group-hover:scale-110" />
            </button>
          </form>
        )}
      </footer>

      {(incomingCall || callActive) && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-chat-bg/90 p-6 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-2xl border border-chat-border bg-chat-surface p-4 text-chat-text">
            {incomingCall && !callActive ? (
              <div className="space-y-4 text-center">
                <p className="text-lg font-semibold">{incomingCall.name} is calling…</p>
                <div className="flex justify-center gap-3">
                  <button title="Accept call" type="button" onClick={acceptIncomingCall} className="rounded-xl bg-chat-accent px-4 py-2 font-medium text-chat-bg">Accept</button>
                  <button title="Reject call" type="button" onClick={rejectIncomingCall} className="rounded-xl bg-chat-raised px-4 py-2 font-medium">Reject</button>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-3 text-center text-sm font-medium text-chat-muted">
                  Call duration: <span className="font-semibold text-chat-text">{liveCallDurationLabel}</span>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <video ref={localVideoRef} autoPlay muted className="h-52 w-full rounded-xl bg-black object-cover" />
                  <video ref={remoteVideoRef} autoPlay className="h-52 w-full rounded-xl bg-black object-cover" />
                </div>
                <button title="End call" type="button" onClick={() => endCall()} className="mt-4 rounded-xl bg-red-600 px-4 py-2 font-medium text-white">End call</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
