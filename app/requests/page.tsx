"use client";

import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import API from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  MessageCircle, 
  ShieldAlert, 
  LogOut, 
  Bell, 
  Check,
  X,
  UserCheck,
  ArrowLeft,
  ShieldCheck,
  Undo2,
  LayoutGrid
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { resolveMediaUrl } from "@/lib/utils";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";

interface IncomingRequest {
  _id: string;
  fromUser: {
    _id: string;
    name: string;
    profilePhoto: string;
  };
  status: string;
  createdAt: string;
}
interface SentRequest {
  _id: string;
  toUser: {
    _id: string;
    name: string;
    profilePhoto?: string;
  };
  status: string;
  createdAt: string;
}

export default function RequestsPage() {
  const { user, logout, loading } = useAuth();
  const { socket } = useSocket();
  const router = useRouter();
  const [requests, setRequests] = useState<IncomingRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<SentRequest[]>([]);
  const [tab, setTab] = useState<"received" | "sent">("received");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
        router.push("/login");
    } else if (user) {
        fetchRequests();
        fetchSentRequests();
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!socket) return;

    socket.on("friendRequestReceived", (data: IncomingRequest) => {
        setRequests(prev => [data, ...prev]);
        toast.success(`New request from ${data.fromUser.name}`);
    });

    socket.on("friendRequestAccepted", () => {
      fetchRequests();
      fetchSentRequests();
    });
    socket.on("friendRequestRejected", () => {
      fetchRequests();
      fetchSentRequests();
    });
    socket.on("friendRequestCancelled", () => {
      fetchRequests();
      fetchSentRequests();
    });

    return () => {
        socket.off("friendRequestReceived");
        socket.off("friendRequestAccepted");
        socket.off("friendRequestRejected");
        socket.off("friendRequestCancelled");
    };
  }, [socket]);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await API.get("/friends/pending");
      setRequests(res.data);
    } catch (err) {
      toast.error("Failed to fetch requests");
    } finally {
      setIsLoading(false);
    }
  };
  const fetchSentRequests = async () => {
    try {
      const res = await API.get("/friends/sent");
      setSentRequests(res.data);
    } catch {
      toast.error("Failed to fetch sent requests");
    }
  };

  const handleAction = async (requestId: string, action: "accept" | "reject") => {
    try {
       if (action === "accept") {
         await API.put(`/friends/accept/${requestId}`);
         toast.success("Request accepted!");
       } else {
         await API.put(`/friends/reject/${requestId}`);
         toast.success("Request rejected");
       }
       setRequests(prev => prev.filter(r => r._id !== requestId));
    } catch (err) {
      toast.error(`Failed to ${action} request`);
    }
  };

  const cancelSent = async (targetUserId: string) => {
    try {
      await API.delete(`/friends/cancel/${targetUserId}`);
      toast.success("Request cancelled");
      fetchSentRequests();
    } catch {
      toast.error("Failed to cancel request");
    }
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-chat-bg text-chat-text overflow-hidden relative">
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
      
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-20 lg:w-72 bg-chat-surface border-r border-chat-border flex flex-col items-center lg:items-start p-6 z-20">
         <div className="mb-10 lg:ml-2">
            <Logo size="md" showText />
         </div>

         <nav className="flex-1 w-full space-y-2">
            <Link href="/chat" className="w-full flex items-center justify-center lg:justify-start gap-4 px-4 py-3 rounded-2xl text-chat-muted hover:bg-chat-raised hover:text-white transition-all group">
               <MessageCircle className="w-6 h-6" />
               <span className="font-semibold hidden lg:block">Messages</span>
            </Link>
            <Link href="/users" className="w-full flex items-center justify-center lg:justify-start gap-4 px-4 py-3 rounded-2xl text-chat-muted hover:bg-chat-raised hover:text-white transition-all group">
               <Users className="w-6 h-6" />
               <span className="font-semibold hidden lg:block">Everyone</span>
            </Link>
            <Link href="/groups" className="w-full flex items-center justify-center lg:justify-start gap-4 px-4 py-3 rounded-2xl text-chat-muted hover:bg-chat-raised hover:text-white transition-all group">
               <LayoutGrid className="w-6 h-6" />
               <span className="font-semibold hidden lg:block">Communities</span>
            </Link>
            <button className="w-full flex items-center justify-center lg:justify-start gap-4 px-4 py-3 rounded-2xl bg-chat-raised text-white font-semibold relative overflow-hidden group">
               <div className="absolute inset-0 bg-blue-500/10 blur-xl opacity-0 group-hover:opacity-100" />
               <Bell className="w-6 h-6 text-chat-accent" />
               <span className="hidden lg:block">Requests</span>
               {requests.length > 0 && (
                 <span className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 bg-blue-600 rounded-full text-[10px] flex items-center justify-center font-bold">
                   {requests.length}
                 </span>
               )}
            </button>
            {user?.role === "admin" && (
              <Link href="/admin" className="w-full flex items-center justify-center lg:justify-start gap-4 px-4 py-3 rounded-2xl text-chat-muted hover:bg-chat-raised hover:text-white transition-all group">
                <ShieldAlert className="w-6 h-6" />
                <span className="font-semibold hidden lg:block">Admin</span>
              </Link>
            )}
         </nav>

         <div className="w-full space-y-4 pt-6 border-t border-chat-border">
            <ThemeToggle />
            <button onClick={logout} className="w-full flex items-center justify-center lg:justify-start gap-4 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-500/10 transition-all font-semibold">
               <LogOut className="w-6 h-6" />
               <span className="hidden lg:block">Logout</span>
            </button>
         </div>
      </aside>

      <main className="ml-20 lg:ml-72 flex-1 p-6 md:p-10 relative z-10">
        <div className="max-w-4xl mx-auto">
          <header className="mb-12">
             <button onClick={() => router.back()} className="flex items-center gap-2 text-chat-muted hover:text-white transition-colors mb-6 group">
               <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
             </button>
             <h1 className="text-4xl font-bold tracking-tighter mb-2">Connect Requests</h1>
             <p className="text-chat-muted font-medium">
               {tab === "received"
                 ? `You have ${requests.length} people waiting to join your network.`
                 : `You sent ${sentRequests.length} pending requests.`}
             </p>
             <div className="mt-5 inline-flex p-1 bg-chat-surface rounded-xl border border-chat-border">
               <button onClick={() => setTab("received")} className={`px-4 py-2 rounded-lg text-sm ${tab === "received" ? "bg-chat-raised text-white" : "text-chat-muted"}`}>Received</button>
               <button onClick={() => setTab("sent")} className={`px-4 py-2 rounded-lg text-sm ${tab === "sent" ? "bg-chat-raised text-white" : "text-chat-muted"}`}>Sent</button>
             </div>
          </header>

          <section className="space-y-4">
             {isLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="h-24 bg-chat-surface/50 rounded-3xl border border-chat-border animate-pulse" />
                ))
             ) : tab === "received" && requests.length > 0 ? (
                <AnimatePresence mode="popLayout">
                  {requests.map((req, i) => (
                    <motion.div
                      key={req._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-chat-surface/40 border border-chat-border rounded-3xl p-4 flex items-center justify-between group hover:border-zinc-700 transition-all"
                    >
                       <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-chat-raised border border-zinc-700 overflow-hidden flex items-center justify-center shadow-lg font-bold text-xl text-chat-muted">
                             {req.fromUser.profilePhoto ? (
                               <img src={resolveMediaUrl(req.fromUser.profilePhoto)} className="w-full h-full object-cover" alt={req.fromUser.name} />
                             ) : req.fromUser.name[0]}
                          </div>
                          <div>
                             <h3 className="font-bold text-chat-text uppercase tracking-tight">{req.fromUser.name}</h3>
                             <p className="text-xs text-chat-muted font-medium tracking-wide">Sent a link request</p>
                          </div>
                       </div>

                       <div className="flex items-center gap-2">
                          <button 
                             title="Reject request"
                             onClick={() => handleAction(req._id, "reject")}
                             className="w-11 h-11 rounded-2xl border border-chat-border flex items-center justify-center text-chat-muted hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition-all"
                          >
                             <X className="w-5 h-5" />
                          </button>
                          <button 
                             onClick={() => handleAction(req._id, "accept")}
                             className="px-6 h-11 rounded-2xl bg-blue-600 text-white font-bold flex items-center gap-2 hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20"
                          >
                             <Check className="w-4 h-4" /> Accept
                          </button>
                       </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
             ) : tab === "sent" && sentRequests.length > 0 ? (
               <AnimatePresence mode="popLayout">
                 {sentRequests.map((req, i) => (
                   <motion.div
                     key={req._id}
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, scale: 0.95 }}
                     transition={{ delay: i * 0.05 }}
                     className="bg-chat-surface/40 border border-chat-border rounded-3xl p-4 flex items-center justify-between group hover:border-zinc-700 transition-all"
                   >
                     <div className="flex items-center gap-4">
                       <div className="w-14 h-14 rounded-2xl bg-chat-raised border border-zinc-700 overflow-hidden flex items-center justify-center shadow-lg font-bold text-xl text-chat-muted">
                         {req.toUser.profilePhoto ? (
                           <img src={resolveMediaUrl(req.toUser.profilePhoto)} className="w-full h-full object-cover" alt={req.toUser.name} />
                         ) : req.toUser.name[0]}
                       </div>
                       <div>
                         <h3 className="font-bold text-chat-text uppercase tracking-tight">{req.toUser.name}</h3>
                         <p className="text-xs text-chat-muted font-medium tracking-wide">Waiting for response</p>
                       </div>
                     </div>

                     <button
                       onClick={() => cancelSent(req.toUser._id)}
                       className="px-5 h-11 rounded-2xl border border-zinc-700 text-zinc-300 font-semibold flex items-center gap-2 hover:text-amber-400 hover:border-amber-500/40"
                     >
                       <Undo2 className="w-4 h-4" /> Cancel
                     </button>
                   </motion.div>
                 ))}
               </AnimatePresence>
             ) : (
                <div className="flex flex-col items-center justify-center py-32 text-center">
                   <div className="w-20 h-20 bg-chat-surface border border-chat-border rounded-[32px] flex items-center justify-center mb-6">
                      <UserCheck className="w-10 h-10 text-zinc-700" />
                   </div>
                   <h2 className="text-xl font-bold mb-2">No pending requests</h2>
                   <p className="text-zinc-600">Everything is up to date.</p>
                </div>
             )}
          </section>
        </div>
      </main>
    </div>
  );
}
