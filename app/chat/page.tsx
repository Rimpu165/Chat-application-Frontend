"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import ChatSidebar from "@/components/ChatSidebar";
import ChatWindow from "@/components/ChatWindow";
import API from "@/lib/api";
import { Building2, Plus, MessageSquare, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
    <div className="flex h-screen min-h-0 flex-col overflow-hidden bg-chat-bg font-sans text-chat-text">
      <div className="relative z-10 flex h-full min-h-0 w-full transition-all duration-500">
        <ChatSidebar onSelectRoom={setSelectedRoom} selectedRoomId={selectedRoom?._id as string | undefined} />

        <div className="relative flex h-full min-h-0 flex-1 flex-col bg-chat-bg">
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
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative flex flex-1 flex-col items-center justify-center overflow-hidden p-6 text-center sm:p-8"
              >
                <div className="pointer-events-none absolute left-1/2 top-1/2 h-[min(90vw,28rem)] w-[min(90vw,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-chat-accent/10 blur-[100px]" />

                <div className="relative mb-10">
                  <div className="absolute inset-0 rounded-3xl bg-chat-accent/20 blur-2xl" />
                  <div className="relative rounded-3xl border border-chat-border bg-chat-surface/80 p-8 shadow-xl backdrop-blur-xl">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-chat-accent text-chat-bg shadow-lg shadow-chat-accent/30">
                      <MessageSquare className="h-9 w-9" />
                    </div>
                    <h1 className="mb-2 text-2xl font-semibold tracking-tight sm:text-3xl">Hi, {user.name}</h1>
                    <p className="mx-auto max-w-xs text-sm leading-relaxed text-chat-muted">
                      Pick a chat from the list or start a new conversation — everything syncs live.
                    </p>
                  </div>
                </div>

                <div className="relative grid w-full max-w-sm grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => router.push("/users")}
                    className="group flex flex-col items-center gap-2 rounded-2xl border border-chat-border bg-chat-surface/90 p-4 transition-all hover:border-chat-accent/40 hover:bg-chat-raised"
                  >
                    <div className="rounded-xl bg-chat-accent-dim p-2 text-chat-accent transition-colors group-hover:bg-chat-accent/25">
                      <Users className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-semibold text-chat-muted group-hover:text-chat-text">People</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/groups")}
                    className="group flex flex-col items-center gap-2 rounded-2xl border border-chat-border bg-chat-surface/90 p-4 transition-all hover:border-chat-accent/40 hover:bg-chat-raised"
                  >
                    <div className="rounded-xl bg-chat-accent-dim p-2 text-chat-accent transition-colors group-hover:bg-chat-accent/25">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-semibold text-chat-muted group-hover:text-chat-text">Groups</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => router.push("/users")}
                  className="mt-6 inline-flex items-center gap-2 rounded-full border border-chat-border bg-chat-raised px-5 py-2.5 text-sm font-medium text-chat-text transition-colors hover:border-chat-accent/50 hover:text-chat-accent"
                >
                  <Plus className="h-4 w-4" /> New message
                </button>
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
