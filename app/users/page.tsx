"use client";

import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import API from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Search, 
  Check, 
  Clock, 
  LogOut, 
  MessageCircle, 
  ShieldAlert,
  ShieldCheck,
  XCircle,
  Bell,
  Plus,
  X,
  Undo2,
  LayoutGrid
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import UserProfileModal from "@/components/UserProfileModal";
import { resolveMediaUrl } from "@/lib/utils";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";

type FriendshipStatus = "none" | "sent" | "pending" | "friends" | "rejected";

interface DirectoryUser {
  _id: string;
  name: string;
  email: string;
  profilePhoto?: string;
  friendshipStatus: FriendshipStatus;
  status: "online" | "offline";
}

interface PendingRequest {
  _id: string;
  fromUser: { _id: string };
}

interface SentRequest {
  _id: string;
  toUser: { _id: string };
}

function AvatarFallback({ name, src }: { name: string; src?: string }) {
  const [error, setError] = useState(false);
  
  if (src && !error) {
    return (
        <img 
            src={resolveMediaUrl(src)} 
            onError={() => setError(true)}
            className="w-16 h-16 rounded-[22px] object-cover ring-4 ring-chat-bg shadow-lg"
            alt={name}
        />
    );
  }

  return (
    <div className="w-16 h-16 rounded-[22px] bg-chat-surface flex items-center justify-center font-bold text-2xl text-chat-muted ring-4 ring-chat-surface shadow-inner">
      {name[0]}
    </div>
  );
}

export default function UsersPage() {
  const { user, logout, loading } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const router = useRouter();
  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<SentRequest[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const pendingBySender = useMemo(() => {
    const map = new Map<string, string>();
    pendingRequests.forEach((r) => map.set(r.fromUser._id, r._id));
    return map;
  }, [pendingRequests]);

  const sentByTarget = useMemo(() => {
    const map = new Map<string, string>();
    sentRequests.forEach((r) => map.set(r.toUser._id, r._id));
    return map;
  }, [sentRequests]);

  const syncAll = async (query = searchTerm) => {
    if (!user?._id) return;
    setIsLoading(true);
    try {
      const [usersRes, pendingRes, sentRes] = await Promise.all([
        API.get(`/users?search=${encodeURIComponent(query)}`),
        API.get("/friends/pending"),
        API.get("/friends/sent"),
      ]);
      const list = (usersRes.data as DirectoryUser[]).filter(
        (u) => u._id !== user._id && u.email.toLowerCase() !== user.email.toLowerCase()
      );
      setUsers(list);
      setPendingRequests(pendingRes.data as PendingRequest[]);
      setSentRequests(sentRes.data as SentRequest[]);
    } catch {
      toast.error("Failed to fetch users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (user) void syncAll("");
  }, [user, loading, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (user) void syncAll(searchTerm);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm, user]);

  useEffect(() => {
    if (!socket) return;
    const refresh = () => void syncAll(searchTerm);
    socket.on("friendRequestReceived", refresh);
    socket.on("friendRequestAccepted", refresh);
    socket.on("friendRequestRejected", refresh);
    socket.on("friendRemoved", refresh);
    socket.on("friendRequestCancelled", refresh);
    return () => {
      socket.off("friendRequestReceived", refresh);
      socket.off("friendRequestAccepted", refresh);
      socket.off("friendRequestRejected", refresh);
      socket.off("friendRemoved", refresh);
      socket.off("friendRequestCancelled", refresh);
    };
  }, [socket, searchTerm]);

  const sendRequest = async (toUserId: string) => {
    try {
      await API.post("/friends/send", { toUserId });
      setUsers((prev) => prev.map((u) => (u._id === toUserId ? { ...u, friendshipStatus: "sent" } : u)));
      void syncAll(searchTerm);
      toast.success("Friend request sent");
    } catch {
      toast.error("Failed to send request");
    }
  };

  const acceptRequest = async (senderId: string) => {
    try {
      const requestId = pendingBySender.get(senderId);
      if (!requestId) return;
      await API.put(`/friends/accept/${requestId}`);
      setUsers((prev) => prev.map((u) => (u._id === senderId ? { ...u, friendshipStatus: "friends" } : u)));
      void syncAll(searchTerm);
      toast.success("Request accepted");
    } catch {
      toast.error("Failed to accept request");
    }
  };

  const rejectRequest = async (senderId: string) => {
    try {
      const requestId = pendingBySender.get(senderId);
      if (!requestId) return;
      await API.put(`/friends/reject/${requestId}`);
      setUsers((prev) => prev.map((u) => (u._id === senderId ? { ...u, friendshipStatus: "none" } : u)));
      void syncAll(searchTerm);
      toast.success("Request rejected");
    } catch {
      toast.error("Failed to reject request");
    }
  };

  const cancelSentRequest = async (targetUserId: string) => {
    try {
      await API.delete(`/friends/cancel/${targetUserId}`);
      setUsers((prev) => prev.map((u) => (u._id === targetUserId ? { ...u, friendshipStatus: "none" } : u)));
      void syncAll(searchTerm);
      toast.success("Request cancelled");
    } catch {
      toast.error("Failed to cancel request");
    }
  };

  const startChat = async (targetId: string) => {
    try {
      const res = await API.post("/rooms/direct", { receiverId: targetId });
      router.push(`/chat?room=${res.data._id}`);
    } catch {
      toast.error("Failed to open chat");
    }
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-chat-bg text-chat-text overflow-hidden relative pt-24">
      <div className="absolute top-0 right-0 w-[50%] h-[30%] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[50%] h-[30%] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 relative z-10">
        <div className="max-w-6xl mx-auto">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
             <div className="space-y-1">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">Directory</h1>
                <p className="text-chat-muted">Discover and connect with the community of {users.length} users.</p>
             </div>
             
             <div className="relative w-full md:w-96">
                <div className="absolute inset-0 bg-chat-accent/5 blur-2xl pointer-events-none" />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-chat-muted w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-chat-surface/50 border border-chat-border rounded-3xl py-4 pl-14 pr-6 text-sm focus:outline-none focus:ring-2 focus:ring-chat-accent/50 transition-all backdrop-blur-3xl shadow-2xl"
                />
             </div>
          </header>

          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
                {isLoading ? (
                    Array(6).fill(0).map((_, i) => (
                        <div key={i} className="h-64 bg-chat-surface/50 rounded-[40px] border border-chat-border animate-pulse" />
                    ))
                ) : users.map((u, i) => {
                    const isOnline = onlineUsers.includes(u._id);
                    return (
                        <motion.div
                            key={u._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            onClick={() => setSelectedUserId(u._id)}
                            className="bg-chat-surface/40 border border-chat-border rounded-[40px] p-6 hover:bg-chat-surface hover:border-chat-muted hover:shadow-2xl hover:shadow-chat-accent/5 transition-all group relative overflow-hidden flex flex-col cursor-pointer"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="relative group/avatar">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-purple-600 blur-xl opacity-0 group-hover/avatar:opacity-30 transition-opacity" />
                                    <AvatarFallback name={u.name} src={u.profilePhoto} />
                                    {isOnline && (
                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-chat-success rounded-full border-4 border-chat-bg shadow-lg shadow-chat-success/20" />
                                    )}
                                </div>

                                <div className="flex flex-col items-end gap-2">
                                    {u.friendshipStatus === "friends" ? (
                                        <div className="px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-full text-[10px] font-bold uppercase tracking-widest border border-blue-500/20 flex items-center gap-1.5">
                                            <ShieldCheck className="w-3 h-3" /> Friends
                                        </div>
                                    ) : u.friendshipStatus === "sent" ? (
                                        <div className="px-3 py-1.5 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-bold uppercase tracking-widest border border-amber-500/20 flex items-center gap-1.5">
                                            <Clock className="w-3 h-3" /> Pending
                                        </div>
                                    ) : isOnline && (
                                        <div className="px-3 py-1.5 bg-chat-success/10 text-chat-success rounded-full text-[10px] font-bold uppercase tracking-widest border border-chat-success/20 flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-chat-success animate-pulse" /> Online
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mb-8 overflow-hidden">
                                <h3 className="text-xl font-bold text-chat-text truncate group-hover:text-chat-accent transition-colors uppercase tracking-tight">{u.name}</h3>
                                <p className="text-xs text-chat-muted font-medium">Community Member</p>
                            </div>

                            <div className="mt-auto grid grid-cols-5 gap-2">
                                {(u.friendshipStatus === "none" || u.friendshipStatus === "rejected" || !u.friendshipStatus) && (
                                    <button 
                                        onClick={() => sendRequest(u._id)}
                                        className="col-span-4 bg-chat-accent text-white h-12 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95 shadow-xl shadow-chat-accent/10"
                                    >
                                        <Plus className="w-4 h-4" /> Add Friend
                                    </button>
                                )}
                                {u.friendshipStatus === "sent" && (
                                  <button
                                    onClick={() => cancelSentRequest(u._id)}
                                    disabled={!sentByTarget.get(u._id)}
                                    className="col-span-4 bg-chat-raised text-amber-500 h-12 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-chat-surface transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                  >
                                    <Undo2 className="w-4 h-4" /> Cancel Pending
                                  </button>
                                )}
                                {u.friendshipStatus === "pending" && (
                                    <div className="col-span-4 flex gap-2">
                                        <button 
                                            onClick={() => acceptRequest(u._id)}
                                            className="flex-1 bg-chat-accent text-white h-12 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-chat-accent/20"
                                        >
                                            <Check className="w-4 h-4" /> Accept
                                        </button>
                                        <button 
                                            title="Reject request"
                                            onClick={() => rejectRequest(u._id)}
                                            className="w-12 h-12 rounded-2xl bg-chat-surface border border-chat-border flex items-center justify-center text-chat-muted hover:text-red-500 hover:border-red-500/20 transition-all"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                                {u.friendshipStatus === "friends" && (
                                    <button 
                                        onClick={() => startChat(u._id)}
                                        className="col-span-4 bg-chat-surface border border-chat-border text-chat-text h-12 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-chat-raised transition-all active:scale-95"
                                    >
                                        <MessageCircle className="w-4 h-4" /> Message
                                    </button>
                                )}
                                
                                <button title="Notifications" className="col-span-1 h-12 rounded-2xl bg-chat-surface border border-chat-border flex items-center justify-center text-chat-muted hover:text-chat-text hover:bg-chat-raised transition-all">
                                    <Bell className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    )
                })}
            </AnimatePresence>
          </section>

          {!isLoading && users.length === 0 && (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="flex flex-col items-center justify-center py-40 text-center"
            >
                <div className="w-20 h-20 bg-chat-surface rounded-[32px] flex items-center justify-center mb-6">
                   <XCircle className="w-10 h-10 text-chat-muted" />
                </div>
                <h2 className="text-2xl font-bold mb-2">No users found</h2>
                <p className="text-chat-muted">Try a different search term or check back later.</p>
            </motion.div>
          )}
        </div>
      </main>

      {selectedUserId && (
        <UserProfileModal 
          userId={selectedUserId} 
          onClose={() => setSelectedUserId(null)}
          onActionSuccess={() => syncAll(searchTerm)}
          isOnline={onlineUsers.includes(selectedUserId)}
        />
      )}
    </div>
  );
}
