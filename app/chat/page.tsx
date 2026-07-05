"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import ChatSidebar from "@/components/ChatSidebar";
import ChatWindow from "@/components/ChatWindow";
import API from "@/lib/api";
import { Building2, Plus, MessageSquare, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

function ChatPageInner() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedRoom, setSelectedRoom] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!loading && (!user || !token)) {
      router.push("/login");
    }
  }, [user, token, loading, router]);

  useEffect(() => {
    const roomId = searchParams.get("room");
    if (!roomId || loading || !token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await API.get("/rooms");
        const list = res.data as Record<string, unknown>[];
        const found = list.find((r) => String(r._id) === roomId);
        if (!cancelled && found) setSelectedRoom(found);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams, token, loading]);

  if (loading || !user || !token) return null;

  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden bg-chat-bg font-sans text-chat-text pt-20 relative">
      {/* Immersive Background */}
      <div className="absolute inset-0 animate-aura pointer-events-none opacity-40" />

      <div className="relative z-10 flex flex-1 min-h-0 w-full transition-all duration-500">
        <ChatSidebar onSelectRoom={setSelectedRoom} selectedRoomId={selectedRoom?._id as string | undefined} />

        <div className={cn(
          "relative h-full min-h-0 flex-col bg-chat-bg",
          selectedRoom ? "flex w-full md:flex-1" : "hidden md:flex md:flex-1"
        )}>
          <AnimatePresence mode="wait">
            {selectedRoom ? (
              <motion.div
                key={String(selectedRoom._id)}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="flex min-h-0 flex-1 flex-col overflow-hidden"
              >
                <ChatWindow room={selectedRoom} onClose={() => setSelectedRoom(null)} />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative flex flex-1 flex-col items-center justify-start overflow-y-auto p-6 text-center sm:p-8 custom-scrollbar"
              >
                {/* Dynamic Background Elements */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-chat-accent/10 blur-[120px] animate-pulse" />
                  <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-blue-500/10 blur-[120px] animate-pulse delay-700" />
                </div>

                <div className="relative max-w-2xl w-full my-auto py-8">
                  <motion.div 
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className="relative group mb-12"
                  >
                    <div className="absolute -inset-1 bg-gradient-to-r from-chat-accent via-blue-500 to-purple-500 rounded-[40px] blur opacity-20 group-hover:opacity-40 transition duration-1000" />
                    <div className="relative rounded-[40px] border border-chat-border/50 bg-chat-surface/40 p-12 backdrop-blur-3xl shadow-2xl">
                      <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-[32px] bg-gradient-to-br from-chat-accent to-blue-600 text-white shadow-2xl shadow-chat-accent/40 transform -rotate-6 group-hover:rotate-0 transition-transform duration-500">
                        <MessageSquare className="h-12 w-12" />
                      </div>
                      
                      <h1 className="mb-4 text-4xl md:text-5xl font-black tracking-tighter text-chat-text">
                        Welcome, <span className="bg-gradient-to-r from-chat-accent to-blue-500 bg-clip-text text-transparent">{user.name}</span>
                      </h1>
                      
                      <p className="mx-auto max-w-sm text-base font-medium leading-relaxed text-chat-muted">
                        Select a conversation from your left or start a brand new journey with your friends.
                      </p>

                      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                         <div className="px-6 py-2 rounded-full bg-chat-raised/50 border border-chat-border text-xs font-bold text-chat-accent uppercase tracking-widest">
                            Real-time Syncing
                         </div>
                         <div className="px-6 py-2 rounded-full bg-chat-raised/50 border border-chat-border text-xs font-bold text-blue-500 uppercase tracking-widest">
                            Secure Calls
                         </div>
                      </div>
                    </div>
                  </motion.div>

                  <div className="grid grid-cols-2 gap-6">
                    {[
                      { 
                        title: "Directory", 
                        desc: "Find and follow people", 
                        icon: <Users className="w-6 h-6" />, 
                        href: "/users",
                        color: "from-blue-500/20"
                      },
                      { 
                        title: "Communities", 
                        desc: "Join global groups", 
                        icon: <Building2 className="w-6 h-6" />, 
                        href: "/groups",
                         color: "from-purple-500/20"
                      }
                    ].map((item, i) => (
                      <motion.button
                        key={item.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * (i + 1) }}
                        onClick={() => router.push(item.href)}
                        className="group relative flex flex-col items-center gap-4 rounded-[32px] border border-chat-border bg-chat-surface/40 p-6 transition-all hover:scale-105 hover:bg-chat-raised hover:border-chat-accent/50 shadow-lg backdrop-blur-xl"
                      >
                        <div className={cn("rounded-2xl p-4 bg-gradient-to-br transition-all group-hover:scale-110", item.color, "to-transparent text-chat-text")}>
                          {item.icon}
                        </div>
                        <div className="space-y-1">
                           <span className="block text-sm font-black text-chat-text">{item.title}</span>
                           <span className="block text-[10px] font-medium text-chat-muted">{item.desc}</span>
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    onClick={() => router.push("/users")}
                    className="mt-12 inline-flex items-center gap-3 rounded-2xl bg-chat-text px-8 py-4 text-sm font-black text-chat-bg shadow-xl transition-all hover:scale-105 active:scale-95 hover:shadow-chat-text/20"
                  >
                    <Plus className="h-5 w-5" /> Start New Message
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-chat-bg text-chat-muted">Loading…</div>
      }
    >
      <ChatPageInner />
    </Suspense>
  );
}
