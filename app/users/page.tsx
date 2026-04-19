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
            className="w-16 h-16 rounded-[22px] object-cover ring-4 ring-zinc-800"
            alt={name}
        />
    );
  }

  return (
    <div className="w-16 h-16 rounded-[22px] bg-zinc-800 flex items-center justify-center font-bold text-2xl text-zinc-500 ring-4 ring-zinc-800 shadow-inner">
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
    <div className="min-h-screen bg-chat-bg text-chat-text overflow-hidden relative">
      <div className="absolute top-0 right-0 w-[50%] h-[30%] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[50%] h-[30%] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Sidebar (Shared Component-like structure) */}
      <aside className="fixed left-0 top-0 bottom-0 w-20 lg:w-72 bg-chat-surface border-r border-chat-border flex flex-col items-center lg:items-start p-6 z-20">
         <div className="mb-10 lg:ml-2">
            <Logo size="md" showText />
         </div>

         <nav className="flex-1 w-full space-y-2">
            <Link href="/chat" className="w-full flex items-center justify-center lg:justify-start gap-4 px-4 py-3 rounded-2xl text-chat-muted hover:bg-chat-raised hover:text-chat-text transition-all group">
               <MessageCircle className="w-6 h-6" />
               <span className="font-semibold hidden lg:block">Messages</span>
            </Link>
            <Link href="/users" className="w-full flex items-center justify-center lg:justify-start gap-4 px-4 py-3 rounded-2xl bg-chat-raised text-chat-text font-semibold shadow-sm overflow-hidden relative group">
               <div className="absolute inset-0 bg-blue-500/10 blur-xl opacity-0 group-hover:opacity-100" />
               <Users className="w-6 h-6 text-chat-accent" />
               <span className="hidden lg:block">Everyone</span>
            </Link>
            <Link href="/groups" className="w-full flex items-center justify-center lg:justify-start gap-4 px-4 py-3 rounded-2xl text-chat-muted hover:bg-chat-raised hover:text-chat-text transition-all group">
               <LayoutGrid className="w-6 h-6" />
               <span className="font-semibold hidden lg:block">Communities</span>
            </Link>
            <Link href="/requests" className="w-full flex items-center justify-center lg:justify-start gap-4 px-4 py-3 rounded-2xl text-chat-muted hover:bg-chat-raised hover:text-chat-text transition-all group">
               <Bell className="w-6 h-6" />
               <span className="font-semibold hidden lg:block">Requests</span>
            </Link>
            {user?.role === "admin" && (
              <Link href="/admin" className="w-full flex items-center justify-center lg:justify-start gap-4 px-4 py-3 rounded-2xl text-chat-muted hover:bg-chat-raised hover:text-chat-text transition-all group">
                <ShieldAlert className="w-6 h-6" />
                <span className="font-semibold hidden lg:block">Admin</span>
              </Link>
            )}
         </nav>

         <div className="w-full space-y-4 pt-6 border-t border-chat-border">
            <ThemeToggle />
            <button 
              onClick={logout}
              className="w-full flex items-center justify-center lg:justify-start gap-4 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-500/10 transition-all font-semibold"
            >
               <LogOut className="w-6 h-6" />
               <span className="hidden lg:block">Logout</span>
            </button>
         </div>
      </aside>

      {/* Main Content */}
      <main className="ml-20 lg:ml-72 flex-1 p-6 md:p-10 relative z-10">
        <div className="max-w-6xl mx-auto">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
             <div className="space-y-1">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">Directory</h1>
                <p className="text-zinc-500">Discover and connect with the community of {users.length} users.</p>
             </div>
             
             <div className="relative w-full md:w-96">
                <div className="absolute inset-0 bg-blue-500/5 blur-2xl pointer-events-none" />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-3xl py-4 pl-14 pr-6 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all backdrop-blur-3xl shadow-2xl"
                />
             </div>
          </header>

          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
                {isLoading ? (
                    Array(6).fill(0).map((_, i) => (
                        <div key={i} className="h-64 bg-zinc-900/50 rounded-[40px] border border-zinc-800 animate-pulse" />
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
                            className="bg-zinc-900/60 border border-zinc-800 rounded-[40px] p-6 hover:bg-zinc-900 hover:border-zinc-700 hover:shadow-2xl hover:shadow-blue-500/5 transition-all group relative overflow-hidden flex flex-col cursor-pointer"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="relative group/avatar">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-purple-600 blur-xl opacity-0 group-hover/avatar:opacity-30 transition-opacity" />
                                    <AvatarFallback name={u.name} src={u.profilePhoto} />
                                    {isOnline && (
                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-zinc-900 shadow-lg shadow-emerald-500/20" />
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
                                        <div className="px-3 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20 flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mb-8 overflow-hidden">
                                <h3 className="text-xl font-bold text-white truncate group-hover:text-blue-400 transition-colors uppercase tracking-tight">{u.name}</h3>
                                <p className="text-xs text-zinc-500 font-medium">Community Member</p>
                            </div>

                            <div className="mt-auto grid grid-cols-5 gap-2">
                                {(u.friendshipStatus === "none" || u.friendshipStatus === "rejected" || !u.friendshipStatus) && (
                                    <button 
                                        onClick={() => sendRequest(u._id)}
                                        className="col-span-4 bg-white text-black h-12 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all active:scale-95 shadow-xl shadow-white/5"
                                    >
                                        <Plus className="w-4 h-4" /> Add Friend
                                    </button>
                                )}
                                {u.friendshipStatus === "sent" && (
                                  <button
                                    onClick={() => cancelSentRequest(u._id)}
                                    disabled={!sentByTarget.get(u._id)}
                                    className="col-span-4 bg-zinc-800 text-amber-400 h-12 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                  >
                                    <Undo2 className="w-4 h-4" /> Cancel Pending
                                  </button>
                                )}
                                {u.friendshipStatus === "pending" && (
                                    <div className="col-span-4 flex gap-2">
                                        <button 
                                            onClick={() => acceptRequest(u._id)}
                                            className="flex-1 bg-blue-600 text-white h-12 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-500 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                                        >
                                            <Check className="w-4 h-4" /> Accept
                                        </button>
                                        <button 
                                            title="Reject request"
                                            onClick={() => rejectRequest(u._id)}
                                            className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-500 hover:text-red-500 hover:border-red-500/20 transition-all"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                                {u.friendshipStatus === "friends" && (
                                    <button 
                                        onClick={() => startChat(u._id)}
                                        className="col-span-4 bg-zinc-800 text-white h-12 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-700 transition-all active:scale-95"
                                    >
                                        <MessageCircle className="w-4 h-4" /> Message
                                    </button>
                                )}
                                
                                <button title="Notifications" className="col-span-1 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-700 transition-all">
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
                <div className="w-20 h-20 bg-zinc-900 rounded-[32px] flex items-center justify-center mb-6">
                   <XCircle className="w-10 h-10 text-zinc-800" />
                </div>
                <h2 className="text-2xl font-bold mb-2">No users found</h2>
                <p className="text-zinc-600">Try a different search term or check back later.</p>
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
