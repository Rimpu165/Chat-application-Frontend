"use client";

import { 
  MessageSquare, Shield, Zap, ArrowRight, Settings, 
  Users, LayoutGrid, Heart, Video, Phone, ShieldCheck,
  TrendingUp, Activity, UserPlus, Globe, Image as ImageIcon,
  Camera, Send, Briefcase, Mail, MapPin, Code,
  Check, CheckCheck, PhoneOff, Mic, Volume2, Paperclip, 
  Plus, ExternalLink, Moon, Sun, Lock, Search
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { resolveMediaUrl, cn } from "@/lib/utils";
import Logo from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useSocket } from "@/context/SocketContext";
import API from "@/lib/api";
import toast from "react-hot-toast";

interface MockMessage {
  id: number;
  text: string;
  isMe: boolean;
  time: string;
}

interface MockChat {
  id: string;
  name: string;
  avatar: string;
  avatarColor: string;
  status: "online" | "away" | "offline";
  bio: string;
  messages: MockMessage[];
  lastSeen?: string;
}

export default function Home() {
  const { user, loading, logout, updateUser } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  const handleCopyInviteLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(`${window.location.origin}/users`);
      toast.success("Invite link copied to clipboard!");
    }
  };

  // MOCK INTERACTIVE LANDING PAGE STATES
  const [mockTab, setMockTab] = useState<"chats" | "friends">("chats");
  const [friendsList, setFriendsList] = useState<any[]>([]);
  const [roomsList, setRoomsList] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string>("alice");
  const [mockInput, setMockInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeCall, setActiveCall] = useState<"audio" | "video" | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [chatSearch, setChatSearch] = useState("");
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const [messagesToday, setMessagesToday] = useState(0);
  const [newConnections, setNewConnections] = useState(0);
  const [dynamicActivityFeed, setDynamicActivityFeed] = useState<any[]>([]);

  // Mock Data Store
  const [mockChats, setMockChats] = useState<Record<string, MockChat>>({
    alice: {
      id: "alice",
      name: "Alice Cooper",
      avatar: "AC",
      avatarColor: "from-pink-500 to-rose-500",
      status: "online",
      bio: "UX Designer at Apple • Designing the future of communication",
      messages: [
        { id: 1, text: "Hey! Did you check the new Chatiq design files?", isMe: false, time: "10:14 AM" },
        { id: 2, text: "Yes! The glassmorphism and Apple-like blurs look absolutely stunning.", isMe: true, time: "10:15 AM" },
        { id: 3, text: "Exactly! Try sending me a message here to test the real-time sync.", isMe: false, time: "10:15 AM" },
      ]
    },
    rishabh: {
      id: "rishabh",
      name: "Rishabh Sinha",
      avatar: "RS",
      avatarColor: "from-violet-500 to-indigo-500",
      status: "away",
      bio: "Full Stack Engineer • Writing code, breaking servers",
      messages: [
        { id: 1, text: "Hey mate, did you push the WebRTC call changes to main?", isMe: true, time: "Yesterday" },
        { id: 2, text: "Yeah! All done. Deployed backend updates to production.", isMe: false, time: "Yesterday" },
        { id: 3, text: "We are good to go live! 🚀", isMe: false, time: "Yesterday" },
      ]
    },
    sarah: {
      id: "sarah",
      name: "Sarah Jenkins",
      avatar: "SJ",
      avatarColor: "from-emerald-500 to-teal-500",
      status: "online",
      bio: "Product Manager • Crafting premium digital experiences",
      messages: [
        { id: 1, text: "Hey team! Sprint planning starts in 10 minutes.", isMe: false, time: "9:00 AM" },
        { id: 2, text: "Understood, see you there!", isMe: true, time: "9:01 AM" },
      ]
    }
  });

  const mockFriendsList = [
    { name: "Alice Cooper", status: "online", role: "UX Designer", color: "from-pink-500 to-rose-500" },
    { name: "Rishabh Sinha", status: "away", role: "Full Stack Wizard", color: "from-violet-500 to-indigo-500" },
    { name: "Sarah Jenkins", status: "online", role: "Product Manager", color: "from-emerald-500 to-teal-500" },
    { name: "John Miller", status: "offline", role: "WebRTC Specialist", color: "from-amber-500 to-orange-500", lastSeen: "2 hrs ago" }
  ];

  // Call Timer Effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeCall) {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [activeCall]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (user?._id) {
      const fetchDashboardData = async () => {
        try {
          const [profileRes, friendsRes, roomsRes, pendingRes, statsRes, activityRes] = await Promise.all([
            API.get("/auth/profile"),
            API.get("/friends/list"),
            API.get("/rooms"),
            API.get("/friends/pending"),
            API.get("/users/stats").catch(() => ({ data: { messagesToday: 0, newConnections: 0 } })),
            API.get("/users/activity").catch(() => ({ data: [] }))
          ]);
          updateUser(profileRes.data);
          setFriendsList(friendsRes.data);
          setRoomsList(roomsRes.data.filter((r: any) => r.isGroup));
          setPendingRequests(pendingRes.data);
          setMessagesToday(statsRes.data.messagesToday || 0);
          setNewConnections(statsRes.data.newConnections || 0);
          setDynamicActivityFeed(activityRes.data || []);
        } catch (err) {
          console.error("Failed to fetch fresh profile and friends data:", err);
        }
      };
      fetchDashboardData();
    }
  }, [user?._id]);

  // Handle Mock Send Message
  const handleSendMockMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!mockInput.trim()) return;

    const userText = mockInput;
    const timeNow = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // 1. Add User Message
    setMockChats((prev) => {
      const activeChat = prev[activeChatId];
      return {
        ...prev,
        [activeChatId]: {
          ...activeChat,
          messages: [
            ...activeChat.messages,
            { id: Date.now(), text: userText, isMe: true, time: timeNow }
          ]
        }
      };
    });

    setMockInput("");

    // 2. Trigger Typing Indicator & Mock Reply
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      let replyText = "That's awesome! Feel free to create an account and experience the real app.";
      if (activeChatId === "alice") {
        replyText = `I saw your message: "${userText}". Look at how fast this simulated socket message arrived! This layout uses Webpack-optimized bundle speeds for maximum snappiness.`;
      } else if (activeChatId === "rishabh") {
        replyText = `Sick! WebRTC calls are connected on port 5000. Try clicking the phone/video call icon on the top right to check the Apple-like call interface.`;
      }

      setMockChats((prev) => {
        const activeChat = prev[activeChatId];
        return {
          ...prev,
          [activeChatId]: {
            ...activeChat,
            messages: [
              ...activeChat.messages,
              { id: Date.now() + 1, text: replyText, isMe: false, time: timeNow }
            ]
          }
        };
      });
    }, 1500);
  };

  const formatDuration = (s: number) => {
    const min = String(Math.floor(s / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    return `${min}:${sec}`;
  };

  if (loading) return (
    <div className="flex h-screen w-full items-center justify-center bg-chat-bg">
       <div className="h-10 w-10 animate-spin rounded-full border-4 border-chat-accent border-t-transparent" />
    </div>
  );

  // LOGGED IN DASHBOARD VIEW (PRESERVED)
  if (user) {
    const isLive = onlineUsers.includes(user._id);

    // Recent activity feed data
    const activityFeed = dynamicActivityFeed.map((act) => {
      let icon = <MessageSquare className="w-4 h-4 text-blue-400" />;
      let iconBg = "bg-blue-500/10";

      if (act.type === "request") {
        icon = <UserPlus className="w-4 h-4 text-amber-500" />;
        iconBg = "bg-amber-500/10";
      } else if (act.type === "accept") {
        icon = <Check className="w-4 h-4 text-teal-400" />;
        iconBg = "bg-teal-500/10";
      } else if (act.type === "call") {
        icon = <Video className="w-4 h-4 text-purple-400" />;
        iconBg = "bg-purple-500/10";
      }

      return {
        ...act,
        icon,
        iconBg
      };
    });

    return (
      <div className="min-h-screen bg-chat-bg text-chat-text overflow-x-hidden relative">
        <div className="absolute top-0 right-0 w-[50%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[30%] h-[40%] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none" />

        <main className="max-w-screen-2xl mx-auto px-4 md:px-6 pt-24 md:pt-32 pb-24 md:pb-20">
              <header className="mb-6 md:mb-8">
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xl sm:text-3xl md:text-5xl font-extrabold tracking-tight mb-2 md:mb-3 text-chat-text"
              >
                Welcome back, <br/>
                <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">{user.name}</span>
              </motion.h1>
              <div className="flex flex-wrap gap-2.5 mt-4 md:mt-6">
                 <Link href="/chat" className="flex items-center gap-2 px-5 md:px-6 h-10 md:h-12 rounded-xl md:rounded-2xl bg-blue-600 text-white font-semibold text-xs md:text-sm hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 active:scale-95 group">
                    <MessageSquare className="h-4 w-4 md:h-4.5 md:w-4.5 group-hover:rotate-12 transition-transform" /> Chat Now
                 </Link>
                 <Link href="/users" className="flex items-center gap-2 px-5 md:px-6 h-10 md:h-12 rounded-xl md:rounded-2xl bg-chat-raised border border-chat-border text-chat-text font-semibold text-xs md:text-sm hover:bg-chat-surface transition-all active:scale-95 group">
                    <Users className="h-4 w-4 md:h-4.5 md:w-4.5 group-hover:scale-110 transition-transform" /> Explore People
                 </Link>
              </div>
            </header>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-10">
               <div className="p-4.5 rounded-2xl bg-white/60 dark:bg-chat-surface/40 border border-black/10 dark:border-chat-border hover:border-chat-accent/40 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex items-center gap-4 group">
                  <div className="bg-blue-500/10 p-2.5 rounded-xl text-blue-500 group-hover:scale-110 transition-transform">
                     <MessageSquare className="h-4.5 w-4.5" />
                  </div>
                  <div>
                     <p className="text-[10px] text-chat-muted font-bold uppercase tracking-wider">Messages Today</p>
                     <p className="text-lg font-bold mt-0.5">{messagesToday}</p>
                  </div>
               </div>
               <div className="p-4.5 rounded-2xl bg-white/60 dark:bg-chat-surface/40 border border-black/10 dark:border-chat-border hover:border-chat-accent/40 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex items-center gap-4 group">
                  <div className="bg-amber-500/10 p-2.5 rounded-xl text-amber-500 group-hover:scale-110 transition-transform">
                     <UserPlus className="h-4.5 w-4.5" />
                  </div>
                  <div>
                     <p className="text-[10px] text-chat-muted font-bold uppercase tracking-wider">Pending Requests</p>
                     <p className="text-lg font-bold mt-0.5">{pendingRequests.length}</p>
                  </div>
               </div>
               <div className="p-4.5 rounded-2xl bg-white/60 dark:bg-chat-surface/40 border border-black/10 dark:border-chat-border hover:border-chat-accent/40 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex items-center gap-4 group">
                  <div className="bg-teal-500/10 p-2.5 rounded-xl text-teal-400 group-hover:scale-110 transition-transform">
                     <Zap className="h-4.5 w-4.5" />
                  </div>
                  <div>
                     <p className="text-[10px] text-chat-muted font-bold uppercase tracking-wider">New Connections</p>
                     <p className="text-lg font-bold mt-0.5">{newConnections}</p>
                  </div>
               </div>
               <div className="p-4.5 rounded-2xl bg-white/60 dark:bg-chat-surface/40 border border-black/10 dark:border-chat-border hover:border-chat-accent/40 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex items-center gap-4 group">
                  <div className="bg-purple-500/10 p-2.5 rounded-xl text-purple-400 group-hover:scale-110 transition-transform">
                     <LayoutGrid className="h-4.5 w-4.5" />
                  </div>
                  <div>
                     <p className="text-[10px] text-chat-muted font-bold uppercase tracking-wider">Communities Joined</p>
                     <p className="text-lg font-bold mt-0.5">{roomsList.length}</p>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {/* Pending Invitations Alert */}
               {pendingRequests.length > 0 && (
                 <div className="lg:col-span-4 p-6 rounded-[32px] bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
                   <div className="flex items-center gap-3">
                     <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500">
                       <UserPlus className="h-6 w-6" />
                     </div>
                     <div>
                       <h4 className="text-sm font-bold text-chat-text">Pending Network Invites</h4>
                       <p className="text-xs text-chat-muted mt-0.5">You have {pendingRequests.length} connection requests waiting for approval.</p>
                     </div>
                   </div>
                   <Link href="/requests" className="px-6 py-2.5 rounded-2xl bg-amber-500 text-white font-black text-xs hover:bg-amber-600 transition-all shadow-md shadow-amber-500/20 active:scale-95">
                     View Invitations
                   </Link>
                 </div>
               )}

               {/* Quick Links */}
              <Link href="/requests" className="lg:col-span-2 p-4 md:p-8 rounded-2xl md:rounded-[40px] bg-white/60 dark:bg-chat-surface/40 border border-black/10 dark:border-chat-border flex flex-col justify-between hover:-translate-y-1.5 hover:shadow-2xl dark:hover:shadow-black/40 hover:border-chat-accent/30 transition-all duration-300 group overflow-hidden relative">
                 <div className="absolute top-0 right-0 p-4 md:p-8 text-chat-border/20 md:text-chat-border group-hover:text-blue-500/20 transition-colors pointer-events-none">
                    <UserPlus className="h-12 w-12 md:h-24 md:w-24" />
                 </div>
                 <div>
                    <h3 className="text-lg md:text-2xl font-bold mb-1 md:mb-2">Network Requests</h3>
                    <p className="text-chat-muted text-xs md:text-sm font-medium">Manage your friend requests and connections.</p>
                 </div>
                 <div className="mt-6 md:mt-8 flex items-center gap-1.5 md:gap-2 text-blue-400 font-bold text-xs md:text-sm">
                    Go Manage <ArrowRight className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  </div>
              </Link>

              <Link href="/groups" className="p-4 md:p-8 rounded-2xl md:rounded-[40px] bg-white/60 dark:bg-chat-surface/40 border border-black/10 dark:border-chat-border flex flex-col justify-between hover:-translate-y-1.5 hover:shadow-2xl dark:hover:shadow-black/40 hover:border-chat-accent/30 transition-all duration-300 group grow">
                  <div className="bg-purple-500/10 p-2.5 md:p-3 rounded-xl md:rounded-2xl w-fit mb-4 md:mb-6 text-purple-400">
                     <LayoutGrid className="h-5 w-5 md:h-6 md:w-6" />
                  </div>
                  <div>
                     <h3 className="text-lg font-bold">Communities</h3>
                     <p className="text-chat-muted text-[10px] md:text-xs mt-1">Join or start global groups.</p>
                  </div>
              </Link>

              <Link href="/profile" className="p-4 md:p-8 rounded-2xl md:rounded-[40px] bg-white/60 dark:bg-chat-surface/40 border border-black/10 dark:border-chat-border flex flex-col justify-between hover:-translate-y-1.5 hover:shadow-2xl dark:hover:shadow-black/40 hover:border-chat-accent/30 transition-all duration-300 group grow">
                  <div className="bg-teal-500/10 p-2.5 md:p-3 rounded-xl md:rounded-2xl w-fit mb-4 md:mb-6 text-teal-400">
                     <ImageIcon className="h-5 w-5 md:h-6 md:w-6" />
                  </div>
                  <div>
                     <h3 className="text-lg font-bold">Galleria</h3>
                     <p className="text-chat-muted text-[10px] md:text-xs mt-1">Manage your social showcase.</p>
                  </div>
              </Link>

              {/* Status Section */}
              <div className="lg:col-span-3 p-4 md:p-8 rounded-2xl md:rounded-[40px] bg-blue-600/5 border border-blue-500/20 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                <div className="space-y-1">
                   <p className="text-xs font-black uppercase text-blue-400 tracking-widest">Network Status</p>
                   <p className="text-2xl font-bold leading-tight">
                     Your Chatiq presence is currently{" "}
                     <span className={isLive ? "text-blue-400 dark:text-blue-300 font-bold" : "text-chat-muted font-bold"}>
                       {isLive ? "Live" : "Offline"}
                     </span>
                   </p>
                </div>
                <div className="flex flex-col justify-center">
                   <p className="text-chat-muted text-xs font-bold uppercase mb-1">Total Connections</p>
                   <p className="text-3xl font-black">{user.friends?.length || 0}</p>
                   {(!user.friends || user.friends.length === 0) && (
                     <Link href="/users" className="text-[10px] font-black text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 mt-1">
                       Find People <ArrowRight className="w-3 h-3" />
                     </Link>
                   )}
                </div>
                <div className="flex flex-col justify-center">
                   <p className="text-chat-muted text-xs font-bold uppercase mb-1">Items in Gallery</p>
                   <p className="text-3xl font-black">{user.gallery?.length || 0}</p>
                </div>
              </div>

              <div className="p-6 md:p-8 rounded-[28px] md:rounded-[40px] bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex flex-col justify-center relative overflow-hidden hover:-translate-y-1.5 hover:shadow-2xl transition-all duration-300 active:scale-[0.98] cursor-pointer" onClick={() => router.push("/chat")}>
                 <div className="absolute -right-4 -bottom-4 opacity-10">
                    <Globe className="h-32 w-32" />
                 </div>
                 <h3 className="text-xl font-black mb-1">Chat Home</h3>
                 <p className="text-white/70 text-xs">Jump back into your messages.</p>
              </div>

              {/* Active Connections List Widget */}
              <div className="lg:col-span-2 p-4 md:p-8 rounded-2xl md:rounded-[40px] bg-white/60 dark:bg-chat-surface/40 border border-black/10 dark:border-chat-border flex flex-col justify-between shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:border-chat-accent/30 hover:shadow-xl transition-all duration-300">
                 <div>
                    <div className="flex items-center justify-between mb-4">
                       <h3 className="text-xl font-bold">Active Connections</h3>
                       <span className="text-[10px] font-bold text-chat-success bg-chat-success/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                         {friendsList.filter(f => onlineUsers.includes(f._id)).length} Online
                       </span>
                    </div>
                    <p className="text-chat-muted text-xs font-medium mb-6">See who is currently active and start direct relays.</p>
                 </div>
                 
                 <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                    {friendsList.length === 0 ? (
                       <div className="w-full text-center py-6">
                          <p className="text-chat-muted text-xs font-semibold">No connections added yet.</p>
                          <Link href="/users" className="text-chat-accent text-xs font-black hover:underline mt-2 inline-block">
                             Find Friends
                          </Link>
                       </div>
                    ) : friendsList.filter(f => onlineUsers.includes(f._id)).length === 0 ? (
                       <div className="w-full text-center py-6 flex flex-col items-center justify-center gap-2">
                          <div className="h-10 w-10 rounded-full bg-chat-accent/15 border border-chat-accent/25 flex items-center justify-center text-chat-accent animate-bounce">
                             <Users className="w-5 h-5" />
                          </div>
                          <div>
                             <p className="text-chat-muted text-xs font-semibold">None of your friends are active right now.</p>
                          </div>
                          <button 
                             onClick={handleCopyInviteLink}
                             className="mt-1 px-4 py-1.5 text-[10px] font-black rounded-lg bg-chat-accent text-white hover:bg-chat-accent/90 transition-all cursor-pointer shadow-md shadow-chat-accent/20"
                          >
                             Invite Friends
                          </button>
                       </div>
                    ) : (
                       friendsList.filter(f => onlineUsers.includes(f._id)).map((friend) => (
                          <div 
                             key={friend._id} 
                             onClick={() => router.push("/chat")}
                             className="flex flex-col items-center gap-2 cursor-pointer group shrink-0"
                          >
                             <div className="relative">
                                <div className="h-14 w-14 rounded-2xl overflow-hidden bg-chat-raised ring-2 ring-transparent group-hover:ring-chat-accent/40 transition-all shadow-md">
                                   {friend.profilePhoto ? (
                                     <img src={resolveMediaUrl(friend.profilePhoto)} className="h-full w-full object-cover" alt="" />
                                   ) : (
                                     <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-chat-accent to-blue-600 text-white font-black text-sm uppercase">
                                        {friend.name[0]}
                                     </div>
                                   )}
                                </div>
                                <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-chat-success border-2 border-chat-bg shadow-sm" />
                             </div>
                             <span className="text-[10px] font-bold text-chat-text truncate w-16 text-center group-hover:text-chat-accent transition-colors">
                                {friend.name.split(" ")[0]}
                             </span>
                          </div>
                       ))
                    )}
                 </div>
              </div>

              {/* Galleria Showcase Preview */}
              <div className="lg:col-span-2 p-6 md:p-8 rounded-[28px] md:rounded-[40px] bg-white/60 dark:bg-chat-surface/40 border border-black/10 dark:border-chat-border flex flex-col justify-between shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:border-chat-accent/30 hover:shadow-xl transition-all duration-300">
                 <div>
                    <div className="flex items-center justify-between mb-4">
                       <h3 className="text-xl font-bold">Your Galleria Showcase</h3>
                       <span className="text-[10px] font-bold text-chat-muted border border-chat-border px-2.5 py-1 rounded-full uppercase tracking-wider">
                         {user.gallery?.length || 0} Items
                       </span>
                    </div>
                    <p className="text-chat-muted text-xs font-medium mb-6">A snippet of your public showcase portfolio.</p>
                 </div>
                 
                 <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                    {!user.gallery || user.gallery.length === 0 ? (
                       <div className="w-full text-center py-6">
                          <p className="text-chat-muted text-xs font-semibold">Your showcase gallery is empty.</p>
                          <Link href="/profile" className="text-chat-accent text-xs font-black hover:underline mt-2 inline-block">
                             Upload Photos
                          </Link>
                       </div>
                    ) : (
                       user.gallery.map((imgUrl, idx) => (
                          <div 
                             key={idx} 
                             className="h-16 w-16 rounded-2xl overflow-hidden shrink-0 border border-black/5 dark:border-white/5 relative group cursor-pointer"
                             onClick={() => router.push("/profile")}
                          >
                             <img src={resolveMediaUrl(imgUrl)} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300" alt="" />
                             <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                       ))
                    )}
                 </div>
              </div>

              {/* My Communities List Widget */}
              <div className="lg:col-span-4 p-4 md:p-8 rounded-2xl md:rounded-[40px] bg-white/60 dark:bg-chat-surface/40 border border-black/10 dark:border-chat-border space-y-3 md:space-y-6 shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:border-chat-accent/20 hover:shadow-xl transition-all duration-300">
                 <div className="flex items-center justify-between">
                    <h3 className="text-lg md:text-xl font-bold">My Communities</h3>
                    <Link href="/groups" className="text-chat-accent text-[10px] md:text-xs font-black hover:underline flex items-center gap-1.5 group">
                       Manage Groups <ArrowRight className="w-3 h-3 md:w-3.5 md:h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                 </div>
                 
                 <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                    {roomsList.slice(0, 3).map((room) => (
                       <div 
                          key={room._id} 
                          onClick={() => router.push(`/chat?room=${room._id}`)}
                          className="p-3.5 md:p-5 rounded-2xl md:rounded-3xl border border-black/5 dark:border-white/5 bg-white dark:bg-black/20 hover:border-chat-accent/40 hover:-translate-y-1 hover:shadow-xl cursor-pointer transition-all duration-300 group flex flex-col justify-between"
                       >
                          <div className="flex items-start justify-between">
                             <div className="relative">
                                <div className="h-12 w-12 rounded-2xl overflow-hidden bg-chat-raised shadow-inner">
                                   {room.image ? (
                                     <img src={resolveMediaUrl(room.image)} className="h-full w-full object-cover" alt="" />
                                   ) : (
                                     <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-black text-sm uppercase">
                                        {room.name[0]}
                                     </div>
                                   )}
                                </div>
                             </div>
                             
                             {/* Stacked Circle Avatars */}
                             <div className="flex items-center -space-x-2 overflow-hidden pl-2">
                                {room.participants?.slice(0, 3).map((p: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-chat-surface overflow-hidden bg-chat-raised shrink-0"
                                    title={p.name}
                                  >
                                    {p.profilePhoto ? (
                                      <img
                                        src={resolveMediaUrl(p.profilePhoto)}
                                        className="h-full w-full object-cover"
                                        alt=""
                                      />
                                    ) : (
                                      <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-black text-[8px] uppercase">
                                        {(p.name || "U")[0]}
                                      </div>
                                    )}
                                  </div>
                                ))}
                                {room.participants?.length > 3 && (
                                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-chat-raised ring-2 ring-white dark:ring-chat-surface text-[8px] font-bold text-chat-muted shrink-0">
                                    +{room.participants.length - 3}
                                  </div>
                                )}
                             </div>
                          </div>
                          
                          <div className="mt-4">
                             <span className="block font-bold text-sm text-chat-text group-hover:text-chat-accent transition-colors truncate">{room.name}</span>
                             <span className="block text-[9px] text-chat-muted font-bold uppercase tracking-wider mt-1">{room.participants?.length || 0} Members</span>
                          </div>
                       </div>
                    ))}
                    
                    {/* Dashed Create Community Placeholder */}
                    <Link
                      href="/groups"
                      className="p-3.5 md:p-5 rounded-2xl md:rounded-3xl border border-dashed border-chat-border hover:border-chat-accent/50 bg-chat-surface/20 dark:bg-black/5 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:scale-[1.02] hover:-translate-y-1 hover:shadow-lg min-h-[140px] group duration-300"
                    >
                      <div className="p-2.5 rounded-full bg-chat-accent/10 text-chat-accent group-hover:scale-115 transition-transform mb-2">
                        <Plus className="w-4 h-4" />
                      </div>
                      <span className="block font-extrabold text-xs text-chat-text">Create Community</span>
                      <span className="block text-[9px] text-chat-muted font-bold mt-1">Start a new group</span>
                    </Link>
                 </div>
              </div>

              {/* Recent Activity Feed */}
              <div className="lg:col-span-2 p-6 md:p-8 rounded-[28px] md:rounded-[40px] bg-white/60 dark:bg-chat-surface/40 border border-black/10 dark:border-chat-border flex flex-col justify-between shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:border-chat-accent/30 hover:shadow-xl transition-all duration-300 group">
                 <div>
                    <div className="flex items-center justify-between mb-4">
                       <h3 className="text-xl font-bold">Recent Activity</h3>
                       <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                         Updates
                       </span>
                    </div>
                    <p className="text-chat-muted text-xs font-medium mb-6">A timeline of recent events in your network.</p>
                 </div>
                 
                 <div className="space-y-4">
                     {activityFeed.length === 0 ? (
                        <div className="w-full text-center py-6">
                           <p className="text-chat-muted text-xs font-semibold">No recent activity found.</p>
                        </div>
                     ) : (
                        activityFeed.map((act) => (
                           <div key={act.id} className="flex items-center justify-between border-b border-chat-border/30 pb-3 last:border-0 last:pb-0">
                              <div className="flex items-center gap-3.5">
                                 <div className={cn("p-2 rounded-xl shrink-0 flex items-center justify-center", act.iconBg)}>
                                    {act.icon}
                                 </div>
                                 <span className="text-xs font-semibold text-chat-text leading-tight">
                                    {act.text}
                                 </span>
                              </div>
                              <span className="text-[10px] text-chat-muted font-black whitespace-nowrap pl-2">
                                 {act.time}
                              </span>
                           </div>
                        ))
                     )}
                  </div>
              </div>

              {/* Chatiq Network Activity (Pulse metrics + Stats) */}
              <div className="lg:col-span-2 p-6 md:p-8 rounded-[28px] md:rounded-[40px] bg-white/60 dark:bg-chat-surface/40 border border-black/10 dark:border-chat-border flex flex-col justify-between shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:border-chat-accent/30 hover:shadow-xl transition-all duration-300">
                 <div className="space-y-3">
                    <span className="inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider text-teal-400 bg-teal-500/10 border border-teal-500/20">
                       Real-time Pulse
                    </span>
                    <h3 className="text-xl font-bold">Chatiq Network Activity</h3>
                    <p className="text-chat-muted text-xs leading-relaxed font-medium">
                       There are currently <span className="text-chat-text font-black">{onlineUsers.length}</span> active connections on the server nodes.
                    </p>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="p-4 rounded-2xl bg-chat-bg/60 dark:bg-black/10 border border-chat-border text-center shadow-inner">
                       <span className="block text-2xl font-black bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">{friendsList.length}</span>
                       <span className="block text-[10px] text-chat-muted font-black uppercase tracking-wider mt-1">My Connections</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-chat-bg/60 dark:bg-black/10 border border-chat-border text-center shadow-inner">
                       <span className="block text-2xl font-black bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent">{roomsList.length}</span>
                       <span className="block text-[10px] text-chat-muted font-black uppercase tracking-wider mt-1">My Communities</span>
                    </div>
                 </div>
              </div>
           </div>
        </main>

        <footer className="border-t border-chat-surface bg-chat-bg/50 pt-10 pb-28 md:py-20 px-4 md:px-6">
           <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
              <div className="col-span-2 md:col-span-1 space-y-4 md:space-y-6">
                    <Logo size="md" showText />
                    <p className="text-chat-muted text-xs md:text-sm leading-relaxed max-w-sm">
                       The next generation of social networking. Real-time, secure, and built for discovery.
                    </p>
                    <div className="flex gap-3 md:gap-4">
                       <button className="h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl bg-chat-surface border border-chat-border flex items-center justify-center text-chat-muted hover:text-blue-400 transition-all">
                          <Camera className="h-4.5 w-4.5 md:h-5 md:w-5" />
                       </button>
                       <button className="h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl bg-chat-surface border border-chat-border flex items-center justify-center text-chat-muted hover:text-blue-400 transition-all">
                          <Send className="h-4.5 w-4.5 md:h-5 md:w-5" />
                       </button>
                       <button className="h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl bg-chat-surface border border-chat-border flex items-center justify-center text-chat-muted hover:text-blue-400 transition-all">
                          <Briefcase className="h-4.5 w-4.5 md:h-5 md:w-5" />
                       </button>
                    </div>
              </div>
              
              <div className="col-span-1 space-y-6">
                 <h4 className="text-sm font-black uppercase tracking-widest text-chat-text">Platform</h4>
                 <ul className="space-y-3 text-chat-muted text-sm font-medium">
                    <li className="hover:text-blue-400 cursor-pointer transition-colors">Global Chat</li>
                    <li className="hover:text-blue-400 cursor-pointer transition-colors">Shared Groups</li>
                    <li className="hover:text-blue-400 cursor-pointer transition-colors">Friend Engine</li>
                    <li className="hover:text-blue-400 cursor-pointer transition-colors">Media Galleria</li>
                 </ul>
              </div>

              <div className="col-span-1 space-y-6">
                 <h4 className="text-sm font-black uppercase tracking-widest text-chat-text">Resources</h4>
                 <ul className="space-y-3 text-chat-muted text-sm font-medium">
                    <li className="hover:text-blue-400 cursor-pointer transition-colors">Help Center</li>
                    <li className="hover:text-blue-400 cursor-pointer transition-colors">Privacy Policy</li>
                    <li className="hover:text-blue-400 cursor-pointer transition-colors">Terms of Service</li>
                    <li className="hover:text-blue-400 cursor-pointer transition-colors">Cookie Settings</li>
                 </ul>
              </div>

              <div className="col-span-2 md:col-span-1 space-y-6">
                 <h4 className="text-sm font-black uppercase tracking-widest text-chat-text">Contact</h4>
                 <ul className="space-y-3 text-chat-muted text-sm font-medium">
                    <li className="flex items-center gap-3"><Mail className="h-4 w-4 shrink-0" /> <span className="truncate">support@chatiq.app</span></li>
                    <li className="flex items-center gap-3"><MapPin className="h-4 w-4 shrink-0" /> <span>Silicon Valley, CA</span></li>
                    <li className="flex items-center gap-3 font-bold text-blue-400 underline cursor-pointer truncate">Live Status: Operational</li>
                 </ul>
              </div>
           </div>
           
           <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-chat-surface flex flex-col md:flex-row justify-between items-center gap-6">
              <p className="text-chat-muted text-xs font-bold uppercase tracking-widest text-center">© {new Date().getFullYear()} CHATIQ. ALL RIGHTS RESERVED.</p>
              <div className="flex gap-8 text-chat-muted text-xs font-bold">
                 <span>SECURED BY JWT</span>
                 <span>PULSE DISCOVERY</span>
              </div>
           </div>
        </footer>
      </div>
    );
  }

  // REDESIGNED PUBLIC LANDING VIEW WITH STUNNING APPLE GLASSMORPHISM
  const activeMockChat = mockChats[activeChatId];
  const filteredMockChats = Object.values(mockChats).filter(c => 
    c.name.toLowerCase().includes(chatSearch.toLowerCase())
  );

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-chat-bg text-chat-text flex flex-col selection:bg-chat-accent/35 selection:text-white">
      {/* Radiant Moving Aura Blobs */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -left-[5%] top-[10%] h-[50vh] w-[50vh] rounded-full bg-chat-accent/15 blur-[140px] animate-pulse" />
        <div className="absolute -right-[5%] top-[35%] h-[60vh] w-[60vh] rounded-full bg-blue-600/10 blur-[160px] animate-pulse delay-1000" />
        <div className="absolute left-[30%] bottom-[5%] h-[40vh] w-[40vh] rounded-full bg-teal-500/8 blur-[120px] animate-pulse delay-500" />
      </div>

      {/* Floating Apple-Style Glass Navbar */}
      <nav className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 px-4 md:px-8 py-6 ${scrolled ? 'pt-4' : 'pt-6'}`}>
        <div className={`mx-auto max-w-7xl rounded-3xl border border-black/10 dark:border-white/5 bg-white/95 dark:bg-black/25 backdrop-blur-2xl px-4 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.12)] ${scrolled ? 'shadow-[0_12px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.3)] bg-white dark:bg-black/40 border-black/15 dark:border-white/10' : ''}`}>
          <div className="flex items-center gap-2">
            <div className="p-1">
              <Logo size="sm" />
            </div>
            <span className="text-base sm:text-lg font-black tracking-tight uppercase text-chat-text">Chatiq</span>
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-4">
            <Link
              href="/login"
              className="rounded-full px-2.5 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm font-bold text-chat-muted hover:text-chat-text transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-chat-text text-chat-bg px-3.5 py-2 sm:px-6 sm:py-2.5 text-xs sm:text-sm font-black tracking-tight shadow-lg shadow-chat-text/10 transition-all hover:scale-[1.03] active:scale-[0.97]"
            >
              <span className="hidden sm:inline">Create Account</span>
              <span className="inline sm:hidden">Sign Up</span>
            </Link>
            <div className="hidden sm:block h-6 w-[1px] bg-chat-border/50" />
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 mx-auto flex max-w-7xl flex-col items-center px-4 pt-32 pb-24 md:pt-40 lg:pb-32 flex-1 w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: "easeOut" }}
          className="mb-16 text-center max-w-3xl"
        >
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white dark:bg-white/5 dark:border-white/5 px-4 py-2 text-[9px] font-black uppercase tracking-[0.25em] text-chat-muted backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-chat-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-chat-success"></span>
            </span>
            Real-Time Engine v2.0
          </div>
          
          <h1 className="mb-6 text-4xl min-[400px]:text-5xl sm:text-7xl md:text-8xl font-black leading-[0.95] tracking-tighter text-chat-text">
            Instant Chat. <br/>
            <span className="bg-gradient-to-r from-blue-400 via-teal-300 to-indigo-500 bg-clip-text text-transparent">
              Apple-Like Glass.
            </span>
          </h1>
          
          <p className="mx-auto max-w-xl text-base sm:text-lg leading-relaxed text-chat-muted font-medium mt-6">
            A premium real-time messaging application designed with frosted glassmorphism, instant search engines, private showcases, and custom WebRTC calls.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 sm:gap-6 w-full max-w-md sm:max-w-none mx-auto px-4">
            <Link
              href="/signup"
              className="group flex h-14 items-center justify-center gap-3 rounded-2xl bg-chat-accent px-8 font-black text-white shadow-xl shadow-chat-accent/20 transition-all hover:translate-y-[-2px] active:translate-y-0 w-full sm:w-auto text-center"
            >
              Get Started <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#interactive-mockup"
              className="flex h-14 items-center justify-center px-8 rounded-2xl bg-white dark:bg-white/5 border border-black/10 dark:border-white/5 font-black text-chat-text hover:bg-slate-50 dark:hover:bg-white/10 transition-all backdrop-blur-md w-full sm:w-auto text-center"
            >
              Try Interactive Demo
            </a>
          </div>
        </motion.div>

        {/* SECTION: INTERACTIVE GLASSMOCKUP */}
        <section id="interactive-mockup" className="w-full mb-32 relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-chat-accent via-blue-500 to-teal-400 rounded-[2.5rem] blur opacity-15" />
          
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="relative w-full rounded-[2rem] border border-black/10 dark:border-white/10 bg-white dark:bg-black/30 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.04)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.35)] overflow-hidden flex flex-col h-[580px] md:h-[620px]"
          >
            {/* Mock macOS Window Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-black/10 dark:border-white/5 bg-white dark:bg-black/10 shrink-0">
              <div className="flex gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-[#ff5f56] border border-[#e0443e] cursor-pointer flex items-center justify-center text-[7px] text-[#4c0002] font-bold group hover:after:content-['×']" />
                <span className="w-3.5 h-3.5 rounded-full bg-[#ffbd2e] border border-[#dfa123] cursor-pointer flex items-center justify-center text-[7px] text-[#5c3e00] font-bold group" />
                <span className="w-3.5 h-3.5 rounded-full bg-[#27c93f] border border-[#1a9c2b] cursor-pointer flex items-center justify-center text-[7px] text-[#024d00] font-bold group" />
              </div>
              <div className="text-[11px] font-bold tracking-tight text-chat-muted flex items-center gap-1.5 bg-slate-50 dark:bg-white/5 px-4 py-1 rounded-full border border-black/10 dark:border-white/10">
                 <Lock className="w-3 h-3 text-chat-accent" /> chatiq-app-mock.local
              </div>
              <div className="w-16" />
            </div>

            {/* Mock Layout Body */}
            <div className="flex flex-1 min-h-0 relative">
              
              {/* Mock Sidebar */}
              <div className="hidden sm:flex w-16 md:w-64 border-r border-black/10 dark:border-white/5 flex-col min-h-0 bg-slate-50/80 dark:bg-black/10 shrink-0">
                <div className="p-2 md:p-4 space-y-4 shrink-0">
                  <div className="flex items-center justify-between">
                     <span className="text-[12px] font-black uppercase tracking-widest text-chat-text hidden md:block">Chatiq Conversations</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-chat-success shadow-[0_0_8px_currentColor] hidden md:block" />
                  </div>
                  
                  {/* Search bar mockup */}
                  <div className="relative hidden md:block">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-chat-muted" />
                    <input 
                      type="text" 
                      placeholder="Search mock inbox..."
                      value={chatSearch}
                      onChange={(e) => setChatSearch(e.target.value)}
                      className="w-full bg-white dark:bg-white/5 border border-black/10 dark:border-white/5 rounded-xl py-1.5 pl-8 pr-3 text-xs text-chat-text focus:outline-none focus:border-chat-accent/40 focus:bg-white"
                    />
                  </div>

                  {/* Sidebar Tabs */}
                  <div className="flex p-0.5 bg-slate-100 dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/10 text-[10px] font-bold hidden md:flex">
                    <button 
                      onClick={() => setMockTab("chats")}
                      className={`flex-1 py-1.5 rounded-lg transition-all ${mockTab === "chats" ? "bg-white dark:bg-white/10 text-chat-text shadow-sm" : "text-chat-muted hover:text-chat-text"}`}
                    >
                      Chats
                    </button>
                    <button 
                      onClick={() => setMockTab("friends")}
                      className={`flex-1 py-1.5 rounded-lg transition-all ${mockTab === "friends" ? "bg-white dark:bg-white/10 text-chat-text shadow-sm" : "text-chat-muted hover:text-chat-text"}`}
                    >
                      Friends ({mockFriendsList.length})
                    </button>
                  </div>
                </div>

                {/* Sidebar Scrollable Items */}
                <div className="flex-1 overflow-y-auto px-1 md:px-2 pb-4 space-y-1.5 custom-scrollbar flex flex-col items-center md:items-stretch">
                  {mockTab === "chats" ? (
                    filteredMockChats.map((chat) => (
                      <button
                        key={chat.id}
                        onClick={() => setActiveChatId(chat.id)}
                        className={`w-full text-left p-2 md:p-3 rounded-2xl flex items-center justify-center md:justify-start gap-3 transition-all border ${activeChatId === chat.id ? 'bg-chat-accent/10 border-chat-accent/20 shadow-md' : 'border-transparent hover:bg-white/80 dark:hover:bg-white/5'}`}
                      >
                        <div className="relative shrink-0">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${chat.avatarColor} text-white flex items-center justify-center font-bold text-sm shadow-md`}>
                            {chat.avatar}
                          </div>
                          {chat.status === "online" && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-chat-success border-2 border-chat-bg" />
                          )}
                          {chat.status === "away" && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-400 border-2 border-chat-bg" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1 hidden md:block">
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="font-bold text-xs truncate text-chat-text">{chat.name}</span>
                            <span className="text-[9px] text-chat-muted tabular-nums">10:15 AM</span>
                          </div>
                          <p className="text-[10px] text-chat-muted truncate">
                            {chat.messages[chat.messages.length - 1]?.text}
                          </p>
                        </div>
                      </button>
                    ))
                  ) : (
                    mockFriendsList.map((friend, idx) => (
                      <div
                        key={idx}
                        className="w-full p-2 md:p-3 rounded-2xl flex items-center justify-between bg-white dark:bg-white/5 border border-black/5 dark:border-white/5"
                        title={`${friend.name} - ${friend.role}`}
                      >
                        <div className="flex items-center justify-center md:justify-start gap-2.5 min-w-0 w-full">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${friend.color} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-inner`}>
                            {friend.name.split(" ").map(n => n[0]).join("")}
                          </div>
                          <div className="min-w-0 hidden md:block">
                            <span className="block font-bold text-xs text-chat-text truncate leading-none mb-1">{friend.name}</span>
                            <span className="block text-[9px] text-chat-muted truncate leading-none">{friend.role}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 hidden md:flex">
                          {friend.status === "online" && <span className="w-2 h-2 rounded-full bg-chat-success" />}
                          {friend.status === "away" && <span className="w-2 h-2 rounded-full bg-amber-400" />}
                          {friend.status === "offline" && <span className="text-[8px] text-chat-muted font-bold">{friend.lastSeen}</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Sidebar Bottom Profile Widget */}
                <div className="p-2 md:p-3 border-t border-black/10 dark:border-white/5 bg-slate-50/90 dark:bg-black/10 shrink-0">
                  <div className="flex items-center justify-center md:justify-start gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black text-xs shadow-md shrink-0">
                      TE
                    </div>
                    <div className="min-w-0 flex-1 hidden md:block">
                      <p className="text-xs font-bold text-chat-text truncate">Test Visitor</p>
                      <p className="text-[9px] text-chat-muted flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-chat-success animate-pulse" /> Active Demo
                      </p>
                    </div>
                    <button className="p-1.5 rounded-lg bg-white dark:bg-white/5 text-chat-muted hover:text-chat-text transition-colors hidden md:block">
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Mock Chat Window */}
              <div className="flex-1 flex flex-col min-h-0 bg-transparent relative">
                
                {/* Chat Window Header */}
                <div className="px-6 py-4 border-b border-black/10 dark:border-white/5 bg-white dark:bg-black/10 backdrop-blur-md flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${activeMockChat.avatarColor} text-white flex items-center justify-center font-bold text-sm shadow-md`}>
                      {activeMockChat.avatar}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-chat-text leading-tight">{activeMockChat.name}</h4>
                      <p className="text-[10px] text-chat-muted mt-0.5 flex items-center gap-1">
                        {activeMockChat.status === "online" ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-chat-success" />
                            <span>Active now<span className="hidden md:inline"> • {activeMockChat.bio}</span></span>
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            <span>Away<span className="hidden md:inline"> • {activeMockChat.bio}</span></span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setActiveCall("audio")}
                      title="Audio Call Mock" 
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-chat-muted hover:text-chat-text"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => setActiveCall("video")}
                      title="Video Call Mock" 
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-chat-muted hover:text-chat-text"
                    >
                      <Video className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Mock Messages Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-transparent flex flex-col justify-end">
                  {activeMockChat.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[75%] ${msg.isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                    >
                      <div className={`px-4 py-2.5 rounded-3xl text-xs shadow-sm ${msg.isMe ? 'bg-chat-accent text-white rounded-br-none shadow-chat-accent/15' : 'bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 text-chat-text rounded-bl-none'}`}>
                        {msg.text}
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-[9px] text-chat-muted">
                        <span>{msg.time}</span>
                        {msg.isMe && <CheckCheck className="w-3 h-3 text-chat-accent" />}
                      </div>
                    </div>
                  ))}

                  {/* Mock Typing Indicator */}
                  <AnimatePresence>
                    {isTyping && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mr-auto flex flex-col items-start"
                      >
                        <div className="px-4 py-2.5 rounded-3xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 text-chat-accent rounded-bl-none flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-chat-accent animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-chat-accent animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-chat-accent animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Mock Input Bar */}
                <form onSubmit={handleSendMockMessage} className="p-4 border-t border-black/10 dark:border-white/5 bg-white dark:bg-black/10 backdrop-blur-md flex items-center gap-3 shrink-0">
                  <button type="button" className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 text-chat-muted hover:text-chat-text hover:bg-slate-100 transition-colors">
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <input
                    type="text"
                    value={mockInput}
                    onChange={(e) => setMockInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-slate-50 dark:bg-white/5 border border-black/10 dark:border-white/5 rounded-xl py-3 px-4 text-xs text-chat-text placeholder:text-chat-muted/60 focus:outline-none focus:border-chat-accent/50 focus:bg-white"
                  />
                  <button type="submit" className="p-2.5 rounded-xl bg-chat-accent text-white shadow-lg shadow-chat-accent/20 hover:opacity-90 active:scale-95 transition-all">
                    <Send className="w-4 h-4" />
                  </button>
                </form>

                {/* STATEFUL CALL OVERLAY (WebRTC Simulation) */}
                <AnimatePresence>
                  {activeCall && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/60 backdrop-blur-xl z-20 flex flex-col items-center justify-center p-6 text-center text-white"
                    >
                      <div className="absolute top-4 left-4 text-left">
                        <div className="flex items-center gap-1.5 text-xs text-chat-success uppercase tracking-wider font-bold">
                          <span className="h-2 w-2 rounded-full bg-chat-success animate-pulse" /> Live Call Simulation
                        </div>
                      </div>

                      {/* Mock Video Stream / Call Avatar */}
                      <div className="relative mb-8">
                        {activeCall === "video" ? (
                          <div className="w-36 h-36 rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 overflow-hidden flex items-center justify-center relative shadow-2xl">
                            <span className="font-black text-5xl uppercase animate-pulse">{activeMockChat.avatar}</span>
                            <div className="absolute inset-0 bg-black/20" />
                            <div className="absolute bottom-2 right-2 w-10 h-10 rounded-xl bg-white/10 border border-white/20 overflow-hidden flex items-center justify-center text-[10px] font-bold uppercase">
                              You
                            </div>
                          </div>
                        ) : (
                          <div className="relative">
                            <div className="absolute -inset-4 bg-chat-accent/20 rounded-full blur animate-ping" style={{ animationDuration: "3s" }} />
                            <div className="absolute -inset-2 bg-chat-accent/30 rounded-full blur animate-ping" style={{ animationDuration: "2s" }} />
                            <div className={`w-28 h-28 rounded-full bg-gradient-to-br ${activeMockChat.avatarColor} text-white flex items-center justify-center font-bold text-3xl shadow-2xl relative z-10`}>
                              {activeMockChat.avatar}
                            </div>
                          </div>
                        )}
                      </div>

                      <h3 className="text-xl font-black mb-1">{activeMockChat.name}</h3>
                      <p className="text-xs text-white/60 mb-6 uppercase tracking-widest font-semibold">
                        {activeCall === "video" ? "Simulated Video Call" : "Simulated Audio Call"}
                      </p>
                      
                      <div className="text-3xl font-black tabular-nums tracking-widest mb-10 text-chat-success bg-white/5 border border-white/10 rounded-2xl px-5 py-2">
                        {formatDuration(callDuration)}
                      </div>

                      {/* Call Controls */}
                      <div className="flex items-center gap-6 bg-white/5 border border-white/10 rounded-3xl px-8 py-4 backdrop-blur-md">
                        <button type="button" className="p-3.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all active:scale-95" title="Mute Microphone">
                          <Mic className="w-5 h-5" />
                        </button>
                        <button type="button" className="p-3.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all active:scale-95" title="Toggle Volume">
                          <Volume2 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => setActiveCall(null)}
                          type="button" 
                          className="p-3.5 rounded-full bg-rose-500 text-white shadow-xl shadow-rose-500/25 hover:bg-rose-600 hover:scale-105 active:scale-95 transition-all" 
                          title="End Call"
                        >
                          <PhoneOff className="w-5 h-5" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            </div>
          </motion.div>
        </section>

        {/* SECTION: APPLE-STYLE BENTO GRID FEATURES */}
        <section className="w-full space-y-16">
          <div className="text-center space-y-3">
             <h2 className="text-xs font-black uppercase tracking-[0.2em] text-chat-accent">Design & Architecture</h2>
             <h3 className="text-3xl md:text-5xl font-black tracking-tighter">Premium design, built to wow.</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Box 1 (Wide): Social Galleria */}
            <div className="md:col-span-2 relative overflow-hidden rounded-[2.5rem] border border-black/10 dark:border-white/5 bg-white dark:bg-black/20 backdrop-blur-xl p-8 flex flex-col justify-between hover:border-black/20 dark:hover:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.02)] dark:shadow-none hover:shadow-2xl transition-all group h-[320px]">
              <div className="pointer-events-none absolute right-0 bottom-0 top-0 w-1/2 bg-gradient-to-l from-chat-accent/10 to-transparent group-hover:from-chat-accent/15 transition-all" />
              
              <div className="space-y-3">
                <div className="inline-block rounded-2xl bg-white/5 dark:bg-white/5 border border-white/10 p-3 text-blue-400">
                  <ImageIcon className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-black tracking-tight text-chat-text">Social Galleria</h3>
                <p className="text-sm leading-relaxed text-chat-muted font-medium max-w-sm">
                  Upload your memories directly into a premium social grid. Complete with hover expansion effects, drag controls, and flexible privacy switches.
                </p>
              </div>

              {/* Interactive Showcase Mockup */}
              <div className="flex gap-3 overflow-hidden translate-y-2 mt-4">
                 {[1, 2, 3, 4].map(idx => (
                    <div 
                      key={idx} 
                      className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-white to-chat-raised dark:from-chat-surface dark:to-chat-raised border border-black/5 dark:border-white/10 shrink-0 overflow-hidden relative shadow-md group-hover:scale-105 group-hover:translate-y-[-4px] transition-all duration-300"
                      style={{ transitionDelay: `${idx * 50}ms` }}
                    >
                       <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-chat-muted/50 uppercase">Photo</div>
                       <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>
                 ))}
              </div>
            </div>

            {/* Box 2: Live Network Status */}
            <div className="relative overflow-hidden rounded-[2.5rem] border border-black/10 dark:border-white/5 bg-white dark:bg-black/20 backdrop-blur-xl p-8 flex flex-col justify-between hover:border-black/20 dark:hover:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.02)] dark:shadow-none hover:shadow-2xl transition-all group h-[320px]">
              <div className="space-y-3">
                <div className="inline-block rounded-2xl bg-white/5 dark:bg-white/5 border border-white/10 p-3 text-teal-400">
                  <Activity className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-black tracking-tight text-chat-text">Live Pulse</h3>
                <p className="text-sm leading-relaxed text-chat-muted font-medium">
                  Continuous connection tracking. Real-time updates delivered with ultra-low latency.
                </p>
              </div>

              {/* Live Status indicator */}
              <div className="flex items-center justify-between bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl p-4 text-xs font-bold font-mono">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-chat-success animate-pulse" /> WebRTC</span>
                <span className="text-chat-success">14ms Latency</span>
              </div>
            </div>

            {/* Box 3: Community Room card */}
            <div className="relative overflow-hidden rounded-[2.5rem] border border-black/10 dark:border-white/5 bg-white dark:bg-black/20 backdrop-blur-xl p-8 flex flex-col justify-between hover:border-black/20 dark:hover:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.02)] dark:shadow-none hover:shadow-2xl transition-all group h-[320px]">
              <div className="space-y-3">
                <div className="inline-block rounded-2xl bg-white/5 dark:bg-white/5 border border-white/10 p-3 text-purple-400">
                  <LayoutGrid className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-black tracking-tight text-chat-text">Communities</h3>
                <p className="text-sm leading-relaxed text-chat-muted font-medium">
                  Create group rooms with unlimited participants, custom description headers, and quick-add friend drawers.
                </p>
              </div>

              {/* Small Community Card Preview */}
              <div className="rounded-2xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 p-3.5 flex items-center justify-between text-xs font-bold">
                 <div className="min-w-0">
                    <span className="block truncate text-chat-text">Dream Team</span>
                    <span className="block text-[9px] text-chat-muted font-bold uppercase tracking-wider mt-0.5">14 Members</span>
                 </div>
                 <button type="button" className="px-3 py-1.5 rounded-xl bg-chat-accent text-white shadow-md shadow-chat-accent/15">
                    Join
                 </button>
              </div>
            </div>

            {/* Box 4 (Wide): Modern Privacy Design */}
            <div className="md:col-span-2 relative overflow-hidden rounded-[2.5rem] border border-black/10 dark:border-white/5 bg-white dark:bg-black/20 backdrop-blur-xl p-8 flex flex-col justify-between hover:border-black/20 dark:hover:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.02)] dark:shadow-none hover:shadow-2xl transition-all group h-[320px]">
              <div className="pointer-events-none absolute left-0 bottom-0 top-0 w-1/3 bg-gradient-to-r from-teal-500/10 to-transparent" />
              
              <div className="space-y-3">
                <div className="inline-block rounded-2xl bg-white/5 dark:bg-white/5 border border-white/10 p-3 text-teal-300">
                  <Shield className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-black tracking-tight text-chat-text">Privacy-Locked Profiles</h3>
                <p className="text-sm leading-relaxed text-chat-muted font-medium max-w-sm">
                  Hide your showcases or friend count with a single private toggle. Your security and JWT authentication data are strictly encrypted.
                </p>
              </div>

              <div className="flex items-center justify-between bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl p-4 max-w-md">
                 <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400">
                       <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                       <span className="block text-xs font-bold text-chat-text">Private profile</span>
                       <span className="block text-[9px] text-chat-muted font-semibold mt-0.5">Encrypted with secure credentials</span>
                    </div>
                 </div>
                 <span className="w-12 h-7 rounded-full bg-teal-500 p-0.5 flex items-center justify-end px-1 cursor-pointer">
                    <span className="w-5 h-5 rounded-full bg-white shadow-md" />
                 </span>
              </div>
            </div>

          </div>
        </section>

        {/* SECTION: PREMIUM CAPABILITIES */}
        <section className="w-full my-24 space-y-16">
          <div className="text-center space-y-3">
             <h2 className="text-xs font-black uppercase tracking-[0.2em] text-chat-accent">Core Engine</h2>
             <h3 className="text-3xl md:text-5xl font-black tracking-tighter">Engineered for the Modern Web</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: "WebRTC Voice & Video",
                description: "Experience peer-to-peer crystal clear calls. Features echo cancellation, automatic noise suppression, and camera aspect auto-adaptation.",
                badge: "HD Streaming",
                color: "border-blue-500/20 text-blue-400 bg-blue-500/5",
              },
              {
                title: "Custom Socket Channels",
                description: "Stateful events propagate in milliseconds. Typing indicators, read receipts, and user presence reflect instantly across all clients.",
                badge: "WebSocket V2",
                color: "border-purple-500/20 text-purple-400 bg-purple-500/5",
              },
              {
                title: "JWT Authentication",
                description: "Industry-standard cryptographic signatures secure every request. Auto-expiring tokens protect against session hijacking and replay attacks.",
                badge: "SHA-256 Secure",
                color: "border-teal-500/20 text-teal-400 bg-teal-500/5",
              },
              {
                title: "Adaptive Blurs & Blends",
                description: "Fully customized CSS backdrop-filters and gradients adjust dynamically based on system themes and scroll depth offsets.",
                badge: "OKLCH Tailored",
                color: "border-pink-500/20 text-pink-400 bg-pink-500/5",
              }
            ].map((cap, idx) => (
              <div 
                key={idx} 
                className="rounded-[2.5rem] border border-black/10 dark:border-white/5 bg-white dark:bg-black/20 p-8 flex flex-col justify-between hover:border-black/20 dark:hover:border-white/10 transition-all hover:-translate-y-1.5 duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.02)]"
              >
                <div className="space-y-4">
                  <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${cap.color}`}>
                    {cap.badge}
                  </span>
                  <h4 className="text-lg font-black text-chat-text">{cap.title}</h4>
                  <p className="text-xs text-chat-muted leading-relaxed font-medium">{cap.description}</p>
                </div>
                <div className="mt-8 flex items-center gap-1.5 text-xs font-bold text-chat-accent cursor-pointer group/link">
                  Learn more <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-1" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION: STATS / METRICS */}
        <section className="w-full my-24">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: "14ms", label: "Ultra-low Latency", desc: "Powered by WebRTC & WebSockets", color: "from-blue-400 to-indigo-500" },
              { value: "99.99%", label: "Guaranteed Uptime", desc: "Distributed server clustering", color: "from-teal-300 to-emerald-500" },
              { value: "256-bit", label: "JWT Encryption", desc: "Secure token-based auth", color: "from-purple-400 to-pink-500" },
              { value: "10K+", label: "Active Nodes", desc: "Connected global relays", color: "from-amber-400 to-orange-500" }
            ].map((stat, idx) => (
              <div key={idx} className="rounded-[2rem] border border-black/10 dark:border-white/5 bg-white dark:bg-black/20 p-6 text-center backdrop-blur-xl hover:scale-105 hover:border-black/25 dark:hover:border-white/10 transition-all duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
                <span className={`block text-3xl md:text-5xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                  {stat.value}
                </span>
                <span className="block text-xs font-black uppercase tracking-wider mt-2 text-chat-text">{stat.label}</span>
                <span className="block text-[10px] text-chat-muted mt-1 font-semibold">{stat.desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION: TESTIMONIALS */}
        <section className="w-full my-24 space-y-12">
          <div className="text-center space-y-3">
             <h2 className="text-xs font-black uppercase tracking-[0.2em] text-chat-accent">User Reviews</h2>
             <h3 className="text-3xl md:text-5xl font-black tracking-tighter">Loved by people worldwide.</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: "The interface is simply gorgeous. The frosted glass looks exactly like macOS, and the socket sync is blazing fast.",
                author: "Sarah Jenkins",
                role: "Product Designer, Apple",
                color: "from-pink-500 to-rose-500",
                avatar: "SJ"
              },
              {
                quote: "Building dynamic chat modules was a breeze with the WebRTC engine. The performance and custom style classes are top tier.",
                author: "Rishabh Sinha",
                role: "Full Stack Lead, Vercel",
                color: "from-violet-500 to-indigo-500",
                avatar: "RS"
              },
              {
                quote: "Aesthetically, it blows every other chat app out of the water. The micro-animations and blur cards are flawless.",
                author: "Marcus Vane",
                role: "Lead Engineer, Stripe",
                color: "from-emerald-500 to-teal-500",
                avatar: "MV"
              }
            ].map((t, idx) => (
              <div 
                key={idx} 
                className="rounded-[2.5rem] border border-black/10 dark:border-white/5 bg-white dark:bg-black/20 p-8 flex flex-col justify-between backdrop-blur-xl hover:shadow-2xl hover:border-black/20 dark:hover:border-white/10 transition-all group shadow-[0_8px_30px_rgba(0,0,0,0.02)]"
              >
                <div className="text-chat-text text-sm font-medium italic leading-relaxed">
                  "{t.quote}"
                </div>
                <div className="flex items-center gap-3.5 mt-8 border-t border-black/5 dark:border-white/5 pt-6">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${t.color} text-white flex items-center justify-center font-bold text-sm shadow-md`}>
                    {t.avatar}
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-chat-text leading-tight">{t.author}</h5>
                    <p className="text-[10px] text-chat-muted mt-0.5">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>


        {/* SECTION: FAQ ACCORDION */}
        <section className="w-full my-24 space-y-12 max-w-4xl mx-auto">
          <div className="text-center space-y-3">
             <h2 className="text-xs font-black uppercase tracking-[0.2em] text-chat-accent">Have Questions?</h2>
             <h3 className="text-3xl md:text-5xl font-black tracking-tighter">Frequently Asked Questions</h3>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Is Chatiq completely real-time?",
                a: "Absolutely! Chatiq is powered by custom Socket.io connections for instant, millisecond-level message sync and real-time state broadcasts."
              },
              {
                q: "How does the Apple-style glassmorphism work?",
                a: "We use advanced Tailwind CSS background blur-effects (backdrop-blur-3xl), customized color-mix values, and subtle, bright white overlays to create the stunning, high-contrast frosted glass aesthetic."
              },
              {
                q: "Can I make voice and video calls on the platform?",
                a: "Yes. Chatiq supports low-latency WebRTC calls with private STUN/TURN relays to ensure high-definition audio and video sync across any device."
              },
              {
                q: "How secure is my profile and data?",
                a: "We encrypt all session packets using standard JSON Web Tokens (JWT) stored securely. Your social showcases and gallery images support granular privacy toggles."
              }
            ].map((faq, idx) => (
              <div 
                key={idx} 
                className="rounded-[2rem] border border-black/10 dark:border-white/5 bg-white dark:bg-black/20 overflow-hidden backdrop-blur-xl hover:border-black/20 dark:hover:border-white/10 transition-all duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.02)]"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left font-black text-sm text-chat-text hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <span>{faq.q}</span>
                  <span className={`text-chat-accent text-lg font-black transition-transform duration-300 ${activeFaq === idx ? 'rotate-45' : ''}`}>
                    <Plus className="h-5 w-5" />
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {activeFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <div className="px-6 pb-5 pt-1 text-xs leading-relaxed text-chat-muted font-medium border-t border-black/5 dark:border-white/5">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-black/10 bg-white/40 dark:bg-black/25 dark:border-white/5 py-12 px-6 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 text-sm text-chat-muted md:flex-row">
          <div className="flex items-center gap-2 flex-nowrap whitespace-nowrap">
            <Logo size="sm" showText />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-chat-muted border-l border-white/20 pl-3">v2.0 Premium</span>
          </div>
          <p className="font-bold uppercase tracking-wider md:tracking-widest text-[9px] text-center md:text-left">© {new Date().getFullYear()} Chatiq. All rights reserved.</p>
          <div className="flex gap-6 font-black uppercase text-[10px]">
             <Camera className="h-4 w-4 hover:text-chat-text cursor-pointer transition-colors" />
             <Send className="h-4 w-4 hover:text-chat-text cursor-pointer transition-colors" />
             <Briefcase className="h-4 w-4 hover:text-chat-text cursor-pointer transition-colors" />
             <Code className="h-4 w-4 hover:text-chat-text cursor-pointer transition-colors" />
          </div>
        </div>
      </footer>
    </div>
  );
}
