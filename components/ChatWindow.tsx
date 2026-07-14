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
  PhoneCall,
  Globe,
  Languages,
  Search,
  Pin,
  CornerUpRight,
  Clock,
  Smile
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

interface ChatWindowProps {
  room: any;
  onClose: () => void;
}

const LOCAL_GIF_POOL = [
  { url: "https://media.giphy.com/media/3NtY188QaxDdC/giphy.gif", tags: ["happy", "dance", "celebrate", "party"] },
  { url: "https://media.giphy.com/media/26n6Gx9wEIndtvJFU/giphy.gif", tags: ["lol", "laugh", "funny", "haha"] },
  { url: "https://media.giphy.com/media/l0EwYc29XZnLR2pNu/giphy.gif", tags: ["love", "heart", "cute", "kiss"] },
  { url: "https://media.giphy.com/media/9Y5BbDSkSTiY8/giphy.gif", tags: ["sad", "cry", "tears", "depressed"] },
  { url: "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif", tags: ["mindblown", "wow", "shock", "omg"] },
  { url: "https://media.giphy.com/media/11tI5GGi6C36Mw/giphy.gif", tags: ["angry", "mad", "rage", "hate"] },
  { url: "https://media.giphy.com/media/14412MUKmbQquk/giphy.gif", tags: ["dance", "music", "groove"] },
  { url: "https://media.giphy.com/media/3o72F8t9TDi2xVnxOE/giphy.gif", tags: ["shocked", "wow", "surprised"] },
  { url: "https://media.giphy.com/media/NEvPzZxiqDYyI/giphy.gif", tags: ["yes", "nod", "agree", "correct"] },
  { url: "https://media.giphy.com/media/13CoXDiaCcX2uI/giphy.gif", tags: ["shrug", "maybe", "whatever", "dunno"] },
  { url: "https://media.giphy.com/media/H45uY4mAF27yPzBSpu/giphy.gif", tags: ["thumbsup", "good", "like", "ok"] },
  { url: "https://media.giphy.com/media/l41YkxvU8c7jt7C1y/giphy.gif", tags: ["facepalm", "sigh", "disappoint"] },
];

const searchLocalGifs = (query: string) => {
  if (!query) return LOCAL_GIF_POOL.map(g => g.url);
  const terms = query.toLowerCase().split(" ");
  return LOCAL_GIF_POOL.filter(g => 
    g.tags.some(tag => terms.some(term => tag.includes(term)))
  ).map(g => g.url);
};

function VanishTimer({ message }: { message: any }) {
  const seenTime = message.seenAt ? new Date(message.seenAt).getTime() : new Date().getTime();
  const expireTime = seenTime + message.vanishTime * 1000;
  const [secondsLeft, setSecondsLeft] = useState(Math.max(0, Math.round((expireTime - Date.now()) / 1000)));

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      const left = Math.max(0, Math.round((expireTime - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [expireTime, secondsLeft]);

  if (secondsLeft <= 0) return null;

  return (
    <span className="ml-2 inline-flex items-center gap-1 rounded bg-red-500/25 px-1.5 py-0.5 text-[9px] font-bold text-red-200 animate-pulse">
      ⏱️ {secondsLeft}s
    </span>
  );
}

export default function ChatWindow({ room, onClose }: ChatWindowProps) {
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingParticipants, setTypingParticipants] = useState<string[]>([]);
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

  // --- Translation and Search States ---
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [translatingId, setTranslatingId] = useState<string | null>(null);
  const [activeTranslateMenuId, setActiveTranslateMenuId] = useState<string | null>(null);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // --- Vanishing and GIF States ---
  const [vanishTime, setVanishTime] = useState<number>(0);
  const [showVanishMenu, setShowVanishMenu] = useState(false);
  const [showGifKeyboard, setShowGifKeyboard] = useState(false);
  const [gifSearchQuery, setGifSearchQuery] = useState("");
  const [gifResults, setGifResults] = useState<string[]>([]);
  const [isSearchingGifs, setIsSearchingGifs] = useState(false);

  const vanishOptions = [
    { label: "Vanish Off", value: 0 },
    { label: "10 seconds", value: 10 },
    { label: "30 seconds", value: 30 },
    { label: "1 minute", value: 60 },
  ];

  // --- Pinning and Forwarding States ---
  const [showPinnedDrawer, setShowPinnedDrawer] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState<any[]>([]);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [messageToForward, setMessageToForward] = useState<any>(null);
  const [userRooms, setUserRooms] = useState<any[]>([]);
  const [forwardSearchQuery, setForwardSearchQuery] = useState("");

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    return messages.filter(
      (m) =>
        m.message &&
        m.message.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !m.isDeleted
    );
  }, [messages, searchQuery]);

  const otherParticipant = room.participants.find((p: any) => p._id !== user?._id);
  const isOnline = otherParticipant && onlineUsers.includes(otherParticipant._id);
  const roomName = room.isGroup ? room.name : (otherParticipant?.name || "Deleted User");
  const isBlockedChat = Boolean(sendStatus.blockedByMe || sendStatus.blockedByOther || room?.isBlocked);
  const otherAvatarUrl = room.isGroup
    ? undefined
    : resolveMediaUrl(otherParticipant?.profilePhoto);
  const isGlobalChat = room.isGroup && room.name === "Global Chat";

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
        if (userId === user?._id) return;
        setTypingParticipants((prev) => prev.includes(userId) ? prev : [...prev, userId]);
      };

      const handleStopTyping = ({ userId }: { userId: string }) => {
        setTypingParticipants((prev) => prev.filter((id) => id !== userId));
      };

      const handlePinToggled = ({ messageId, isPinned, message }: any) => {
        setMessages((prev) =>
          prev.map((m) => (m._id === messageId ? { ...m, isPinned } : m))
        );
        setPinnedMessages((prev) => {
          if (isPinned) {
            if (prev.some((pm) => pm._id === messageId)) return prev;
            return [message, ...prev];
          } else {
            return prev.filter((pm) => pm._id !== messageId);
          }
        });
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
      socket.on("messagePinToggled", handlePinToggled);
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
            return sid === user?._id && msgTime <= seenAtMs ? { ...m, status: "seen", seenAt } : m;
          })
        );
      };
      const handleMessageVanished = ({ messageId, roomId: vRoomId }: { messageId: string, roomId: string }) => {
        if (String(vRoomId) === String(room._id)) {
          setMessages((prev) => prev.filter((m) => m._id !== messageId));
        }
      };

      socket.on("messagesSeen", handleMessagesSeen);
      socket.on("messageVanished", handleMessageVanished);

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
        socket.off("messageVanished", handleMessageVanished);
        socket.off("messagePinToggled", handlePinToggled);
      };
    }
  }, [room._id, socket, otherParticipant?._id, user?._id]);

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    });
  }, [messages, typingParticipants]);

  const fetchMessages = async () => {
    try {
      const res = await API.get(`/messages/${room._id}`);
      setMessages(res.data);
    } catch (err) {
      console.error("Failed to fetch messages");
    }
  };

  const handleTranslate = async (messageId: string, text: string, targetLang: string) => {
    setTranslatingId(messageId);
    setActiveTranslateMenuId(null);
    try {
      const res = await API.post("/messages/translate", { text, targetLang });
      setTranslations((prev) => ({ ...prev, [messageId]: res.data.translatedText }));
    } catch (err) {
      toast.error("Failed to translate message");
    } finally {
      setTranslatingId(null);
    }
  };

  const handleTogglePin = async (messageId: string) => {
    try {
      const res = await API.put(`/messages/${messageId}/pin`);
      toast.success(res.data.message);
      const updatedMsg = res.data.msg;
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, isPinned: updatedMsg.isPinned } : m))
      );
      setPinnedMessages((prev) => {
        if (updatedMsg.isPinned) {
          if (prev.some((pm) => pm._id === messageId)) return prev;
          return [updatedMsg, ...prev];
        } else {
          return prev.filter((pm) => pm._id !== messageId);
        }
      });
    } catch {
      toast.error("Failed to pin/unpin message");
    }
  };

  const fetchPinnedMessages = async () => {
    try {
      const res = await API.get(`/messages/room/${room._id}/pinned`);
      setPinnedMessages(res.data || []);
    } catch {
      toast.error("Failed to load pinned messages");
    }
  };

  const handleForwardClick = async (msg: any) => {
    setMessageToForward(msg);
    setShowForwardModal(true);
    try {
      const res = await API.get("/rooms");
      setUserRooms(res.data || []);
    } catch {
      toast.error("Failed to load rooms for forwarding");
    }
  };

  const handleForwardMessage = async (targetRoomId: string) => {
    if (!messageToForward) return;
    try {
      const formData = new FormData();
      formData.append("roomId", targetRoomId);
      formData.append("message", messageToForward.message || "");
      formData.append("isForwarded", "true");
      if (messageToForward.fileUrl) {
        formData.append("fileUrl", messageToForward.fileUrl);
        formData.append("fileType", messageToForward.fileType);
        formData.append("fileName", messageToForward.fileName || "");
      }
      await API.post("/messages/send", formData);
      toast.success("Message forwarded!");
      setShowForwardModal(false);
      setMessageToForward(null);
    } catch {
      toast.error("Failed to forward message");
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

  // --- Giphy Fetch Effect ---
  useEffect(() => {
    if (!showGifKeyboard) return;
    
    const key = process.env.NEXT_PUBLIC_GIPHY_API_KEY;
    if (!key) {
      const query = gifSearchQuery.trim();
      const results = searchLocalGifs(query);
      setGifResults(results);
      return;
    }

    let active = true;
    const fetchGifs = async () => {
      setIsSearchingGifs(true);
      try {
        const query = gifSearchQuery.trim();
        const url = query 
          ? `https://api.giphy.com/v1/gifs/search?api_key=${key}&q=${encodeURIComponent(query)}&limit=12`
          : `https://api.giphy.com/v1/gifs/trending?api_key=${key}&limit=12`;
        const response = await fetch(url);
        const data = await response.json();
        if (active && data.data) {
          const urls = data.data.map((gif: any) => gif.images?.fixed_height_downsampled?.url || gif.images?.fixed_height?.url).filter(Boolean);
          setGifResults(urls);
        }
      } catch (err) {
        console.error("Giphy API error, falling back to local:", err);
        const results = searchLocalGifs(gifSearchQuery.trim());
        setGifResults(results);
      } finally {
        if (active) setIsSearchingGifs(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchGifs();
    }, 400);

    return () => {
      active = false;
      clearTimeout(delayDebounceFn);
    };
  }, [gifSearchQuery, showGifKeyboard]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const formData = new FormData();
      formData.append("roomId", room._id);
      formData.append("message", newMessage);
      if (replyTo?._id) formData.append("replyTo", replyTo._id);
      if (file) formData.append("file", file);
      if (vanishTime > 0) formData.append("vanishTime", vanishTime.toString());
      await API.post("/messages/send", formData);
      setNewMessage("");
      setFile(null);
      setReplyTo(null);
      fetchSendStatus(); // Refresh status after sending
      if (socket) socket.emit("stopTyping", { roomId: room._id });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleSendGif = async (gifUrl: string) => {
    if (isSending) return;
    setIsSending(true);
    try {
      const formData = new FormData();
      formData.append("roomId", room._id);
      formData.append("message", "");
      formData.append("fileUrl", gifUrl);
      formData.append("fileType", "image");
      formData.append("fileName", "GIPHY GIF");
      if (vanishTime > 0) formData.append("vanishTime", vanishTime.toString());
      await API.post("/messages/send", formData);
      setShowGifKeyboard(false);
      setGifSearchQuery("");
      fetchSendStatus();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to send GIF");
    } finally {
      setIsSending(false);
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

  const getSenderName = (msg: any) => {
    if (typeof msg.sender === "object" && msg.sender) {
      return msg.sender.name || "Someone";
    }
    return "Someone";
  };

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
    setTranslations({});
    setShowSearchBar(false);
    setSearchQuery("");
    setActiveTranslateMenuId(null);
    setShowPinnedDrawer(false);
    setPinnedMessages([]);
    setShowForwardModal(false);
    setMessageToForward(null);
    setForwardSearchQuery("");
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
            ) : room.isGroup && room.groupImage ? (
              <img
                src={resolveMediaUrl(room.groupImage)}
                alt=""
                className="h-11 w-11 rounded-2xl border border-chat-border object-cover shadow-inner"
              />
            ) : isGlobalChat ? (
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-chat-border bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-inner">
                 <Globe className="w-5 h-5" />
              </div>
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
               ) : room.isGroup ? (
                  <span className="flex items-center gap-1.5 text-chat-muted">
                    {room.participants.length} members 
                    {room.description && <span className="hidden sm:inline">• {room.description}</span>}
                  </span>
               ) : isOnline ? (
                  <span className="flex items-center gap-1 text-chat-success"><span className="h-1.5 w-1.5 rounded-full bg-chat-success" /> Active now</span>
               ) : otherParticipant?.lastSeen ? (
                  <span className="text-chat-muted">{formatLastSeen(otherParticipant.lastSeen)}</span>
               ) : (
                  <span className="text-chat-muted">Away</span>
               )}
               <AnimatePresence>
                 {typingParticipants.length > 0 && (
                   <motion.span 
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -5 }}
                    className="ml-2 font-medium text-chat-accent"
                   >
                     {typingParticipants.length === 1 
                       ? `${room.participants.find((p: any) => p._id === typingParticipants[0])?.name || "Someone"} is typing…`
                       : `${typingParticipants.length} people are typing…`
                     }
                   </motion.span>
                 )}
               </AnimatePresence>
             </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {!room.isGroup && (
            <>
               <button title="Voice call" type="button" onClick={() => startCall(false)} disabled={isBlockedChat} className="rounded-xl bg-chat-raised/80 p-2.5 text-chat-muted transition-all hover:bg-chat-border/80 hover:text-chat-text disabled:cursor-not-allowed disabled:opacity-40">
                  <Phone className="h-4 w-4" />
               </button>
               <button title="Video call" type="button" onClick={() => startCall(true)} disabled={isBlockedChat} className="rounded-xl bg-chat-raised/80 p-2.5 text-chat-muted transition-all hover:bg-chat-border/80 hover:text-chat-text disabled:cursor-not-allowed disabled:opacity-40">
                  <Video className="h-4 w-4" />
               </button>
            </>
          )}
          <button
            title="Pinned messages"
            type="button"
            onClick={() => {
              setShowPinnedDrawer((prev) => {
                if (!prev) fetchPinnedMessages();
                return !prev;
              });
            }}
            className={cn(
              "rounded-xl p-2.5 transition-all",
              showPinnedDrawer
                ? "bg-chat-accent/20 text-chat-accent"
                : "bg-chat-raised/80 text-chat-muted hover:bg-chat-border/80 hover:text-chat-text"
            )}
          >
            <Pin className="h-4 w-4" />
          </button>
          <button
            title="Search messages"
            type="button"
            onClick={() => {
              setShowSearchBar((prev) => !prev);
              setSearchQuery("");
            }}
            className={cn(
              "rounded-xl p-2.5 transition-all",
              showSearchBar
                ? "bg-chat-accent/20 text-chat-accent"
                : "bg-chat-raised/80 text-chat-muted hover:bg-chat-border/80 hover:text-chat-text"
            )}
          >
            <Search className="h-4 w-4" />
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
      {showSearchBar && (
        <div className="relative z-20 flex shrink-0 items-center justify-between border-b border-chat-border bg-chat-surface px-4 py-2.5 sm:px-6">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-chat-border bg-chat-bg px-3 py-1.5 focus-within:border-chat-accent/50">
            <Search className="h-3.5 w-3.5 text-chat-muted" />
            <input
              type="text"
              placeholder="Search messages in this chat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-chat-text placeholder:text-chat-muted focus:outline-none"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-chat-muted hover:text-chat-text"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setShowSearchBar(false);
              setSearchQuery("");
            }}
            className="ml-3 rounded-lg bg-chat-raised px-3 py-1.5 text-xs text-chat-muted hover:bg-chat-border hover:text-chat-text"
          >
            Cancel
          </button>
        </div>
      )}
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

      {showPinnedDrawer && (
        <>
          <button
            type="button"
            aria-label="Close pinned drawer backdrop"
            onClick={() => setShowPinnedDrawer(false)}
            className="absolute inset-0 z-35 bg-black/20"
          />
          <aside className="absolute inset-y-0 right-0 z-40 w-80 border-l border-chat-border bg-chat-surface shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b border-chat-border px-4 py-3 shrink-0">
              <div className="text-sm font-semibold text-chat-text flex items-center gap-1.5">
                <Pin className="h-4 w-4 text-chat-accent" />
                Pinned Messages
              </div>
              <button
                type="button"
                title="Close pinned drawer"
                onClick={() => setShowPinnedDrawer(false)}
                className="rounded-lg p-1.5 text-chat-muted transition-colors hover:bg-chat-raised hover:text-chat-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto p-4 bg-chat-bg/30">
              {pinnedMessages.length === 0 ? (
                <div className="rounded-xl border border-chat-border bg-chat-raised/40 p-4 text-center text-xs text-chat-muted">
                  No pinned messages in this chat.
                </div>
              ) : (
                pinnedMessages.map((pm) => (
                  <div key={pm._id} className="relative rounded-xl border border-chat-border bg-chat-surface/60 p-3 shadow-sm hover:border-chat-accent/40 group/pin-item transition-all">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-bold text-chat-text">
                        {pm.sender?._id === user?._id ? "You" : pm.sender?.name || "Someone"}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleTogglePin(pm._id)}
                        className="text-[10px] text-red-400 opacity-0 group-hover/pin-item:opacity-100 transition-opacity hover:underline"
                      >
                        Unpin
                      </button>
                    </div>
                    
                    {pm.fileUrl && (
                      <div className="mb-1 text-[11px] underline truncate text-chat-muted">
                        📎 {pm.fileName || "File Attachment"}
                      </div>
                    )}
                    
                    <p className="text-xs text-chat-muted whitespace-pre-wrap line-clamp-3">
                      {pm.message || "[Media attachment]"}
                    </p>
                    
                    <div className="mt-2 text-[9px] text-chat-muted/60 text-right">
                      {new Date(pm.createdAt).toLocaleDateString()} at {new Date(pm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
        {filteredMessages.map((msg, i) => {
          const isMe =
            getSenderId(msg) === user?._id ||
            msg.sender === user?._id ||
            (typeof msg.sender === "object" && msg.sender?._id === user?._id);
          const prev = filteredMessages[i - 1];
          const showAvatar =
            i === 0 || (prev ? getSenderId(prev) !== getSenderId(msg) : true);
          const senderPhoto = !isMe ? getSenderPhoto(msg) : undefined;

          return (
            <div key={msg._id} className={cn(
              "flex items-end gap-3 max-w-[85%] sm:max-w-[70%]",
              isMe ? "ml-auto flex-row-reverse" : "mr-auto"
            )}>
              {!isMe && !isGlobalChat && (
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
                {room.isGroup && !isMe && showAvatar && (
                  <span className="text-[10px] font-bold text-chat-muted mb-1 pl-2">
                    {getSenderName(msg)}
                  </span>
                )}
                <div className={cn(
                  "relative rounded-[22px] px-4 py-2.5 text-sm shadow-sm",
                  isMe 
                    ? "rounded-br-md bg-chat-bubble-out text-white" 
                    : "rounded-bl-md border border-chat-border bg-chat-bubble-in text-chat-text"
                )}>
                   {msg.isForwarded && (
                     <div className={cn(
                       "flex items-center gap-1 text-[10px] mb-1.5 italic font-medium opacity-65",
                       isMe ? "text-white" : "text-chat-muted"
                     )}>
                       <CornerUpRight className="h-3.5 w-3.5 shrink-0" />
                       Forwarded
                     </div>
                   )}
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
                   {translatingId === msg._id && (
                     <div className="mt-1 flex items-center gap-1.5 text-xs text-chat-muted italic animate-pulse">
                       <Languages className="h-3 w-3 animate-spin text-chat-accent" />
                       Translating...
                     </div>
                   )}
                   {translations[msg._id] && (
                     <div className="mt-1.5 border-t border-white/10 pt-1.5 text-xs text-amber-200/90 font-medium">
                       <div className="flex items-center justify-between text-[9px] uppercase tracking-wider text-white/40 mb-0.5">
                         <span>Translation</span>
                         <button
                           type="button"
                           onClick={() => {
                             setTranslations((prev) => {
                               const next = { ...prev };
                               delete next[msg._id];
                               return next;
                             });
                           }}
                           className="normal-case underline hover:text-white"
                         >
                           Hide
                         </button>
                       </div>
                       <p className="whitespace-pre-wrap">{translations[msg._id]}</p>
                     </div>
                   )}
                   <div className="flex gap-1 mt-1">
                    {(msg.reactions || []).map((r: any, idx: number) => (
                      <span key={idx} className="text-xs bg-black/20 px-1.5 rounded">{r.emoji}</span>
                    ))}
                   </div>
                   <div className={cn(
                      "mt-1 flex items-center justify-end gap-1.5 text-[9px]",
                      isMe ? "text-white/70" : "text-chat-muted"
                    )}>
                      {msg.isPinned && <Pin className="h-2.5 w-2.5 rotate-45 text-chat-accent shrink-0" />}
                      {msg.vanishTime > 0 && msg.status === "seen" && (
                        <VanishTimer message={msg} />
                      )}
                      {msg.vanishTime > 0 && msg.status !== "seen" && (
                        <span className="text-amber-400 font-bold ml-1" title={`Vanishes ${msg.vanishTime}s after seen`}>🔥</span>
                      )}
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
                  {!msg.isDeleted && (
                    <>
                      <button
                        title={msg.isPinned ? "Unpin message" : "Pin message"}
                        type="button"
                        onClick={() => handleTogglePin(msg._id)}
                        className={cn(
                          "rounded p-1 transition-all",
                          msg.isPinned ? "text-chat-accent hover:bg-chat-raised" : "hover:bg-chat-raised text-chat-text"
                        )}
                      >
                        <Pin className="h-3 w-3 rotate-45" />
                      </button>
                      <button
                        title="Forward message"
                        type="button"
                        onClick={() => handleForwardClick(msg)}
                        className="rounded p-1 hover:bg-chat-raised text-chat-text"
                      >
                        <CornerUpRight className="h-3 w-3" />
                      </button>
                    </>
                  )}
                  {!msg.isDeleted && msg.message && (
                    <div className="relative">
                      <button
                        title="Translate"
                        type="button"
                        onClick={() => setActiveTranslateMenuId((id) => (id === msg._id ? null : msg._id))}
                        className={cn(
                          "rounded p-1 transition-all",
                          activeTranslateMenuId === msg._id
                            ? "bg-chat-accent/20 text-chat-accent"
                            : "hover:bg-chat-raised text-chat-text"
                        )}
                      >
                        <Languages className="h-3 w-3" />
                      </button>
                      
                      {activeTranslateMenuId === msg._id && (
                        <div className="absolute bottom-6 left-0 z-30 flex flex-col gap-0.5 rounded-lg border border-chat-border bg-chat-surface p-1 shadow-xl min-w-[100px]">
                          {[
                            { code: "hi", name: "Hindi" },
                            { code: "en", name: "English" },
                            { code: "es", name: "Spanish" },
                            { code: "fr", name: "French" },
                            { code: "de", name: "German" },
                            { code: "ja", name: "Japanese" },
                            { code: "zh", name: "Chinese" },
                            { code: "ar", name: "Arabic" },
                          ].map((lang) => (
                            <button
                              key={lang.code}
                              type="button"
                              onClick={() => handleTranslate(msg._id, msg.message, lang.code)}
                              className="w-full rounded px-2 py-1 text-left text-[11px] hover:bg-chat-raised text-chat-text"
                            >
                              {lang.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
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
        <AnimatePresence>
          {typingParticipants.map(id => {
            const p = room.participants.find((part: any) => part._id === id);
            return (
              <motion.div 
                key={id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="mr-auto flex items-center gap-3"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-chat-bubble-in border border-chat-border shadow-sm">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-chat-muted [animation-delay:-0.3s]" />
                    <span className="mx-0.5 h-1.5 w-1.5 animate-bounce rounded-full bg-chat-muted [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-chat-muted" />
                </div>
                {room.isGroup && <span className="text-[10px] font-bold text-chat-muted uppercase tracking-tight">{p?.name || "Typing..."}</span>}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Input area */}
      <footer className="relative z-10 shrink-0 border-t border-chat-border/60 bg-linear-to-t from-chat-bg via-chat-bg to-transparent p-4 pb-16 sm:p-6 md:pb-6">
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
          <form onSubmit={handleSendMessage} className="relative mx-auto flex max-w-4xl items-center gap-2 sm:gap-3 w-full">
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
              
              <button
                type="button"
                title="GIF keyboard"
                onClick={() => {
                  setShowGifKeyboard((prev) => !prev);
                  setShowVanishMenu(false);
                }}
                className={cn(
                  "p-2 text-chat-muted transition-colors hover:text-chat-accent",
                  showGifKeyboard && "text-chat-accent"
                )}
              >
                <Smile className="h-5 w-5" />
              </button>

              <button
                type="button"
                title="Vanish Timer"
                onClick={() => {
                  setShowVanishMenu((prev) => !prev);
                  setShowGifKeyboard(false);
                }}
                className={cn(
                  "p-2 text-chat-muted transition-colors hover:text-chat-accent relative",
                  vanishTime > 0 && "text-red-400"
                )}
              >
                <Clock className="h-5 w-5" />
                {vanishTime > 0 && (
                  <span className="absolute top-1 right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                )}
              </button>

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

            {/* Vanish Timer Popover */}
            {showVanishMenu && (
              <div className="absolute bottom-16 right-16 z-30 w-40 rounded-xl border border-chat-border bg-chat-surface p-1.5 shadow-2xl">
                <p className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-chat-muted">Vanish Timer</p>
                {vanishOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setVanishTime(opt.value);
                      setShowVanishMenu(false);
                      toast.success(opt.value > 0 ? `Vanish Mode: ${opt.label}` : "Vanish Mode disabled");
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold text-chat-text hover:bg-chat-raised",
                      vanishTime === opt.value && "bg-chat-raised text-chat-accent"
                    )}
                  >
                    <span>{opt.label}</span>
                    {vanishTime === opt.value && <span className="text-[10px]">🔥</span>}
                  </button>
                ))}
              </div>
            )}

            {/* GIF Keyboard Popover */}
            {showGifKeyboard && (
              <div className="absolute bottom-16 left-4 right-4 z-30 max-w-sm rounded-2xl border border-chat-border bg-chat-surface p-4 shadow-2xl flex flex-col h-64">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Search GIFs..."
                    value={gifSearchQuery}
                    onChange={(e) => setGifSearchQuery(e.target.value)}
                    className="w-full bg-chat-bg border border-chat-border rounded-xl py-1.5 px-3 text-xs focus:outline-none focus:border-chat-accent/50"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowGifKeyboard(false);
                      setGifSearchQuery("");
                    }}
                    className="text-xs text-chat-muted hover:text-chat-text font-bold"
                  >
                    Close
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 overflow-y-auto flex-1 custom-scrollbar">
                  {isSearchingGifs ? (
                    <div className="col-span-3 flex items-center justify-center py-10 text-xs text-chat-muted">
                      Searching...
                    </div>
                  ) : gifResults.length === 0 ? (
                    <div className="col-span-3 flex items-center justify-center py-10 text-xs text-chat-muted">
                      No GIFs found
                    </div>
                  ) : (
                    gifResults.map((url, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSendGif(url)}
                        className="h-16 rounded-lg overflow-hidden border border-black/5 dark:border-white/5 cursor-pointer hover:scale-105 transition-transform relative group bg-chat-bg"
                      >
                        <img src={url} className="h-full w-full object-cover" alt="GIF" />
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
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

      {showForwardModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 p-6 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-chat-border bg-chat-surface p-5 shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between border-b border-chat-border pb-3 mb-4 shrink-0">
              <h3 className="text-base font-bold text-chat-text flex items-center gap-1.5">
                <CornerUpRight className="h-4 w-4 text-chat-accent" />
                Forward Message
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowForwardModal(false);
                  setMessageToForward(null);
                }}
                className="rounded-lg p-1 text-chat-muted hover:bg-chat-raised hover:text-chat-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-3 shrink-0">
              <input
                type="text"
                placeholder="Search chats..."
                value={forwardSearchQuery}
                onChange={(e) => setForwardSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-chat-border bg-chat-bg px-3 py-2 text-xs text-chat-text focus:outline-none focus:border-chat-accent/40"
              />
            </div>

            <div className="custom-scrollbar flex-1 overflow-y-auto space-y-2 pr-1">
              {userRooms
                .filter((r) => {
                  const other = r.participants.find((p: any) => p._id !== user?._id);
                  const name = r.isGroup ? r.name : (other?.name || "Direct Chat");
                  return name.toLowerCase().includes(forwardSearchQuery.toLowerCase());
                })
                .map((r) => {
                  const other = r.participants.find((p: any) => p._id !== user?._id);
                  const name = r.isGroup ? r.name : (other?.name || "Deleted User");
                  const avatar = r.isGroup ? r.groupImage : other?.profilePhoto;

                  return (
                    <div key={r._id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-chat-raised transition-colors border border-transparent hover:border-chat-border">
                      <div className="flex items-center gap-3 min-w-0">
                        {avatar ? (
                          <img src={resolveMediaUrl(avatar)} alt="" className="h-9 w-9 rounded-xl object-cover shrink-0 border border-chat-border" />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-chat-bg text-xs font-bold text-chat-muted border border-chat-border shrink-0">
                            {name[0]}
                          </div>
                        )}
                        <span className="text-xs font-bold truncate text-chat-text">{name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleForwardMessage(r._id)}
                        className="rounded-lg bg-chat-accent hover:opacity-90 px-3 py-1.5 text-[10px] font-bold text-chat-bg shadow-sm"
                      >
                        Send
                      </button>
                    </div>
                  );
                })}
              {userRooms.length === 0 && (
                <div className="text-center text-xs text-chat-muted py-6">
                  No active chats found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
