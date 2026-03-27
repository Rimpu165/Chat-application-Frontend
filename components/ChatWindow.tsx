"use client";

import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import API from "@/lib/api";
import { cn } from "@/lib/utils";
import { 
  Phone, 
  Video, 
  Info, 
  Send, 
  Smile, 
  Paperclip, 
  MoreVertical, 
  ArrowLeft,
  Check,
  CheckCheck,
  Clock
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [sendStatus, setSendStatus] = useState({ canSend: true, message: "" });
  const scrollRef = useRef<HTMLDivElement>(null);

  const otherParticipant = room.participants.find((p: any) => p._id !== user?._id);
  const isOnline = otherParticipant && onlineUsers.includes(otherParticipant._id);
  const roomName = room.isGroup ? room.groupName : (otherParticipant?.name || "Deleted User");

  useEffect(() => {
    fetchMessages();
    fetchSendStatus();
    
    if (socket) {
      socket.emit("joinRoom", room._id);
      
      const handleNewMessage = (msg: any) => {
        if (msg.room === room._id) {
          setMessages(prev => [...prev, msg]);
        }
      };

      const handleTyping = ({ userId }: { userId: string }) => {
        if (userId === otherParticipant?._id) setOtherUserTyping(true);
      };

      const handleStopTyping = ({ userId }: { userId: string }) => {
        if (userId === otherParticipant?._id) setOtherUserTyping(false);
      };

      socket.on("newMessage", handleNewMessage);
      socket.on("userTyping", handleTyping);
      socket.on("userStoppedTyping", handleStopTyping);

      return () => {
        socket.emit("leaveRoom", room._id);
        socket.off("newMessage", handleNewMessage);
        socket.off("userTyping", handleTyping);
        socket.off("userStoppedTyping", handleStopTyping);
      };
    }
  }, [room._id, socket]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, otherUserTyping]);

  const fetchMessages = async () => {
    try {
      const res = await API.get(`/messages/${room._id}`);
      setMessages(res.data);
    } catch (err) {
      console.error("Failed to fetch messages");
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
      const msgData = {
        roomId: room._id,
        content: newMessage,
        type: "text"
      };
      const res = await API.post("/messages/send", msgData);
      setNewMessage("");
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

  return (
    <div className="flex-1 flex flex-col h-full bg-black relative">
      <div className="absolute top-[10%] left-[20%] w-[30%] h-[30%] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />
      
      {/* Header */}
      <header className="relative z-10 px-6 py-4 border-b border-zinc-800 bg-zinc-900/40 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-zinc-800 transition-colors lg:hidden">
            <ArrowLeft className="w-5 h-5 text-zinc-400" />
          </button>
          
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-lg text-zinc-300 shadow-inner">
               {roomName[0]}
            </div>
            {!room.isGroup && isOnline && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-[3px] border-zinc-900 shadow-sm shadow-emerald-500/50" />
            )}
          </div>

          <div>
             <h3 className="font-bold text-zinc-100">{roomName}</h3>
             <div className="text-[10px] flex items-center gap-1.5 mt-0.5">
               {isOnline ? (
                  <span className="text-emerald-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Online</span>
               ) : (
                  <span className="text-zinc-500">Offline</span>
               )}
               {otherUserTyping && <span className="text-blue-400 font-medium animate-pulse ml-2">Typing...</span>}
             </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
           <button className="p-2.5 rounded-xl bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all shadow-md">
              <Phone className="w-4 h-4" />
           </button>
           <button className="p-2.5 rounded-xl bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all shadow-md">
              <Video className="w-4 h-4" />
           </button>
           <button className="p-2.5 rounded-xl bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all shadow-md">
              <MoreVertical className="w-4 h-4" />
           </button>
        </div>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar relative z-0">
        {messages.map((msg, i) => {
          const isMe = msg.sender._id === user?._id || msg.sender === user?._id;
          const showAvatar = i === 0 || messages[i-1].sender._id !== msg.sender._id;

          return (
            <div key={msg._id} className={cn(
              "flex items-end gap-3 max-w-[85%] sm:max-w-[70%]",
              isMe ? "ml-auto flex-row-reverse" : "mr-auto"
            )}>
              {!isMe && (
                <div className={cn("w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500 mb-0.5 shadow-sm", !showAvatar && "opacity-0 invisible")}>
                  {roomName[0]}
                </div>
              )}
              
              <div className="flex flex-col group">
                <div className={cn(
                  "px-4 py-2.5 rounded-[22px] text-sm relative shadow-sm",
                  isMe 
                    ? "bg-blue-600 text-white rounded-br-none" 
                    : "bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-bl-none"
                )}>
                   {msg.message}
                   <div className={cn(
                     "flex items-center gap-1 justify-end mt-1 text-[9px]",
                     isMe ? "text-white/60" : "text-zinc-500"
                   )}>
                     {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                     {isMe && <CheckCheck className="w-3 h-3" />}
                   </div>
                </div>
              </div>
            </div>
          );
        })}
        {otherUserTyping && (
           <div className="flex items-center gap-3 mr-auto">
             <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center shadow-sm">
                <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.15s] mx-0.5" />
                <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" />
             </div>
           </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input area */}
      <footer className="p-6 relative z-10 bg-gradient-to-t from-black to-transparent">
        {!sendStatus.canSend ? (
          <div className="max-w-4xl mx-auto p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-center backdrop-blur-md">
            <p className="text-zinc-400 text-sm font-medium mb-3">
              {sendStatus.message || "You've reached the message limit for this conversation."}
            </p>
            <button 
              onClick={() => router.push("/users")}
              className="px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20"
            >
              Send Friend Request
            </button>
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center gap-3">
            <div className="flex-1 flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2 transition-all focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/20 backdrop-blur-xl">
              <button type="button" className="p-2 text-zinc-500 hover:text-blue-500 transition-colors">
                <Smile className="w-5 h-5" />
              </button>
              <input 
                type="text" 
                placeholder="Write a message..."
                value={newMessage}
                onChange={handleInputChange}
                className="flex-1 bg-transparent py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
              />
              <button type="button" className="p-2 text-zinc-500 hover:text-blue-500 transition-colors">
                <Paperclip className="w-5 h-5" />
              </button>
            </div>
            <button 
              type="submit"
              disabled={!newMessage.trim()}
              className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed group"
            >
              <Send className="w-5 h-5 translate-x-0.5 -translate-y-0.5 group-hover:scale-110 transition-transform" />
            </button>
          </form>
        )}
      </footer>
    </div>
  );
}
