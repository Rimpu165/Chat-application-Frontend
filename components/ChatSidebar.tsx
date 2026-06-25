"use client";

import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { useRouter } from "next/navigation";
import API from "@/lib/api";
import { formatChatTime, formatLastSeen, previewFromLatestMessage } from "@/lib/format";
import { cn, resolveMediaUrl } from "@/lib/utils";
import Logo from "@/components/Logo";
import { Search, MessageSquare, Settings, Users } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

interface ChatSidebarProps {
  onSelectRoom: (room: any) => void;
  selectedRoomId?: string;
}

export default function ChatSidebar({ onSelectRoom, selectedRoomId }: ChatSidebarProps) {
  const { user, token, loading: authLoading } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const router = useRouter();
  const [rooms, setRooms] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"chats" | "friends">("chats");
  const senderIdOf = (msg: { sender?: string | { _id?: string } }) =>
    typeof msg?.sender === "object" ? String(msg.sender?._id ?? "") : String(msg?.sender ?? "");

  const loadSidebarData = () => {
    void fetchRooms();
    void fetchFriends();
    void fetchPendingRequests();
  };

  useEffect(() => {
    if (authLoading || !token) return;
    loadSidebarData();
  }, [authLoading, token]);

  const bumpRoomWithMessage = (
    roomId: string,
    latestMessage: unknown,
    options?: { incrementUnread?: boolean }
  ) => {
    const shouldInc = Boolean(options?.incrementUnread);
    setRooms((prev) => {
      const idx = prev.findIndex((r: { _id: string }) => r._id === roomId);
      if (idx === -1) {
        void fetchRooms();
        return prev;
      }
      const next = [...prev];
      const cur = next[idx] as Record<string, unknown>;
      const prevUnread = Number((cur as { unreadCount?: number }).unreadCount || 0);
      const updated = {
        ...cur,
        latestMessage,
        updatedAt: new Date().toISOString(),
        unreadCount: shouldInc ? prevUnread + 1 : prevUnread,
      };
      next.splice(idx, 1);
      return [updated, ...next];
    });
  };

  const messageRoomId = (msg: { room?: string | { _id?: string } }) => {
    if (!msg?.room) return "";
    return typeof msg.room === "object" ? String(msg.room._id ?? "") : String(msg.room);
  };

  useEffect(() => {
    if (!socket) return;

    const onReceive = (msg: {
      room?: string | { _id?: string };
      createdAt?: string;
      sender?: string | { _id?: string };
    }) => {
      const rid = messageRoomId(msg);
      const fromSelf = senderIdOf(msg) === String(user?._id ?? "");
      if (rid) {
        bumpRoomWithMessage(rid, msg, {
          incrementUnread: !fromSelf && String(selectedRoomId ?? "") !== String(rid),
        });
      }
    };

    const onNotify = (data: {
      roomId: string;
      message?: { sender?: string | { _id?: string } };
      preview?: string;
    }) => {
      const fromSelf = senderIdOf(data.message || {}) === String(user?._id ?? "");
      if (data.message) {
        bumpRoomWithMessage(data.roomId, data.message, {
          incrementUnread: !fromSelf && String(selectedRoomId ?? "") !== String(data.roomId),
        });
      }
      else void fetchRooms();
    };

    socket.on("friendRequestReceived", () => {
      void fetchPendingRequests();
    });
    socket.on("friendRequestAccepted", () => {
      void fetchFriends();
      void fetchPendingRequests();
    });
    socket.on("friendRequestCancelled", () => {
      void fetchPendingRequests();
    });
    socket.on("friendRemoved", () => {
      void fetchFriends();
      void fetchRooms();
    });
    socket.on("receiveMessage", onReceive);
    socket.on("newMessageNotification", onNotify);
    socket.on("messagesSeen", ({ roomId, byUser }: { roomId: string; byUser: string }) => {
      if (String(byUser) !== String(user?._id ?? "")) return;
      setRooms((prev) =>
        prev.map((r: { _id: string; unreadCount?: number }) =>
          String(r._id) === String(roomId) ? { ...r, unreadCount: 0 } : r
        )
      );
    });
    socket.on("chatDeleted", (payload: { roomId?: string }) => {
      if (payload?.roomId) {
        setRooms((prev) => prev.filter((r: { _id: string }) => r._id !== payload.roomId));
      }
    });
    socket.on("chatCleared", () => {
      void fetchRooms();
    });

    return () => {
      socket.off("friendRequestReceived");
      socket.off("friendRequestAccepted");
      socket.off("friendRequestCancelled");
      socket.off("friendRemoved");
      socket.off("receiveMessage", onReceive);
      socket.off("newMessageNotification", onNotify);
      socket.off("messagesSeen");
      socket.off("chatDeleted");
      socket.off("chatCleared");
    };
  }, [socket, selectedRoomId, user?._id]);

  useEffect(() => {
    if (!selectedRoomId) return;
    setRooms((prev) =>
      prev.map((r: { _id: string; unreadCount?: number }) =>
        String(r._id) === String(selectedRoomId) ? { ...r, unreadCount: 0 } : r
      )
    );
  }, [selectedRoomId]);

  const fetchRooms = async () => {
    try {
      const res = await API.get("/rooms");
      setRooms(res.data);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { status?: number; data?: { message?: string } } }).response
              ?.data?.message
          : undefined;
      console.error("Failed to fetch rooms", msg ?? err);
    }
  };

  const fetchFriends = async () => {
    try {
      const res = await API.get("/friends/list");
      setFriends(res.data);
    } catch (err: unknown) {
      const status =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { status?: number } }).response?.status
          : undefined;
      console.error("Failed to fetch friends", status === 401 ? "Not logged in or session expired" : err);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const res = await API.get("/friends/pending");
      setPendingRequests(res.data);
    } catch (err: unknown) {
      console.error("Failed to fetch pending requests", err);
    }
  };

  const listToDisplay = activeTab === "chats" ? rooms : friends;

  const filteredList = listToDisplay.filter(item => {
    if (activeTab === "chats") {
      const name = item.isGroup ? item.name : (item.participants.find((p: any) => p._id !== user?._id)?.name || "Chat");
      return name.toLowerCase().includes(searchTerm.toLowerCase());
    } else {
      return item.name.toLowerCase().includes(searchTerm.toLowerCase());
    }
  });

  const userPhoto = resolveMediaUrl(user?.profilePhoto);

  return (
    <aside className="flex h-full min-h-0 w-80 shrink-0 flex-col border-r border-chat-border bg-chat-surface/90 backdrop-blur-md">
      <div className="p-5">
        <div className="mb-7 flex items-center justify-between">
           <Logo size="sm" showText />
        </div>

        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-chat-muted" />
          <input 
            type="text" 
            placeholder="Search…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl border border-chat-border bg-chat-bg/80 py-2.5 pl-10 pr-4 text-sm text-chat-text placeholder:text-chat-muted focus:outline-none focus:ring-2 focus:ring-chat-accent/40"
          />
        </div>

        <div className="mb-5 flex rounded-2xl bg-chat-bg/60 p-1 ring-1 ring-chat-border/80">
          <button 
            onClick={() => setActiveTab("chats")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold transition-all",
              activeTab === "chats" ? "bg-chat-raised text-chat-text shadow-sm" : "text-chat-muted hover:text-chat-text"
            )}
          >
            <MessageSquare className="h-3.5 w-3.5" /> Chats
          </button>
          <button 
             onClick={() => setActiveTab("friends")}
             className={cn(
               "flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold transition-all",
               activeTab === "friends" ? "bg-chat-raised text-chat-text shadow-sm" : "text-chat-muted hover:text-chat-text"
             )}
          >
            <Users className="h-3.5 w-3.5" /> Friends
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 space-y-1 custom-scrollbar">
        {filteredList.map((item) => {
          if (activeTab === "chats") {
            const room = item;
            const otherParticipant = room.participants.find((p: any) => p._id !== user?._id);
            const isOnline = otherParticipant && onlineUsers.includes(otherParticipant._id);
            const name = room.isGroup ? room.name : (otherParticipant?.name || "Deleted User");
            const lastMsg = previewFromLatestMessage(room.latestMessage);
            const photoUrl = room.isGroup
              ? resolveMediaUrl(room.groupImage)
              : resolveMediaUrl(otherParticipant?.profilePhoto);
            const lastAt = formatChatTime(
              room.latestMessage?.createdAt || room.updatedAt
            );

            return (
              <button 
                key={room._id}
                onClick={() => {
                  setRooms((prev) =>
                    prev.map((r: { _id: string; unreadCount?: number }) =>
                      String(r._id) === String(room._id) ? { ...r, unreadCount: 0 } : r
                    )
                  );
                  onSelectRoom(room);
                }}
                className={cn(
                  "group relative flex w-full items-center gap-4 rounded-[2rem] p-4 text-left transition-all duration-300",
                  selectedRoomId === room._id
                    ? "bg-chat-accent/10 border border-chat-accent/20 shadow-lg shadow-chat-accent/5"
                    : "hover:bg-chat-surface/40 border border-transparent"
                )}
              >
                {selectedRoomId === room._id && (
                  <motion.div 
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-chat-accent rounded-r-full"
                  />
                )}

                <div className="relative shrink-0">
                  <div className="h-14 w-14 rounded-2xl overflow-hidden ring-2 ring-chat-border group-hover:ring-chat-accent/30 transition-all shadow-md">
                    {photoUrl && !room.isBlocked ? (
                      <img src={photoUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-chat-raised text-xl font-black text-chat-muted">
                        {name[0]}
                      </div>
                    )}
                  </div>
                  {!room.isGroup && isOnline && (
                    <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-[3px] border-chat-surface bg-chat-success shadow-sm" />
                  )}
                </div>
                
                <div className="flex-1 text-left overflow-hidden">
                  <div className="flex justify-between items-center mb-1">
                    <span className={cn(
                      "truncate font-black text-sm tracking-tight",
                      selectedRoomId === room._id ? "text-chat-text" : "text-chat-text"
                    )}>
                      {name}
                    </span>
                    <span className={cn(
                      "text-[10px] tabular-nums font-bold",
                      selectedRoomId === room._id ? "text-chat-accent" : "text-chat-muted"
                    )}>
                      {lastAt}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn(
                      "truncate text-xs font-medium flex-1",
                      selectedRoomId === room._id ? "text-chat-text/80" : "text-chat-muted"
                    )}>
                      {room.isBlocked ? "Blocked chat" : lastMsg}
                    </p>
                    {Number(room.unreadCount || 0) > 0 && (
                      <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-chat-accent px-1.5 text-[10px] font-black leading-none text-chat-bg shadow-lg shadow-chat-accent/20">
                        {Number(room.unreadCount) > 99 ? "99+" : Number(room.unreadCount)}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          } else {
            const friend = item;
            const isOnline = onlineUsers.includes(friend._id);
            const friendPhoto = resolveMediaUrl(friend.profilePhoto);
            
            return (
              <button 
                key={friend._id}
                onClick={async () => {
                  try {
                    const res = await API.post("/rooms/direct", { receiverId: friend._id });
                    onSelectRoom(res.data);
                    setActiveTab("chats");
                  } catch (err) {
                    toast.error("Failed to start chat");
                  }
                }}
                className="group flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-all hover:bg-chat-raised/80"
              >
                <div className="relative shrink-0">
                  {friendPhoto ? (
                    <img
                      src={friendPhoto}
                      alt=""
                      className="h-12 w-12 rounded-2xl object-cover ring-2 ring-chat-border"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-chat-raised text-lg font-bold text-chat-muted">
                      {friend.name[0]}
                    </div>
                  )}
                  {isOnline && (
                    <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-[3px] border-chat-surface bg-chat-success" />
                  )}
                </div>
                <div className="min-w-0 flex-1 overflow-hidden text-left">
                  <span className="block truncate font-medium text-chat-text">{friend.name}</span>
                  <span className="text-[10px] font-medium tracking-tight text-chat-muted">
                    {isOnline ? "Active now" : formatLastSeen(friend.lastSeen) || "Tap to chat"}
                  </span>
                </div>
                <div className="rounded-xl bg-chat-raised p-2 text-chat-muted transition-colors group-hover:bg-chat-accent-dim group-hover:text-chat-accent">
                  <MessageSquare className="h-4 w-4" />
                </div>
              </button>
            );
          }
        })}
      </div>

      <div className="border-t border-chat-border bg-chat-surface p-4">
         <div className="flex items-center gap-3">
           {userPhoto ? (
             <img src={userPhoto} alt="" className="h-10 w-10 rounded-full object-cover ring-2 ring-chat-border" />
           ) : (
             <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-chat-accent to-teal-600 text-sm font-bold text-chat-bg shadow-lg">
               {user?.name?.[0]}
             </div>
           )}
           <div className="min-w-0 flex-1 overflow-hidden">
             <div className="truncate text-sm font-semibold text-chat-text">{user?.name}</div>
             <div className="truncate text-[10px] capitalize text-chat-muted">
               {user?.role === "admin" ? "Admin" : onlineUsers.includes(user?._id || "") ? "Online" : "Away"}
             </div>
           </div>
           <button title="Profile" onClick={() => router.push("/profile")} className="rounded-xl p-2 text-chat-muted transition-colors hover:bg-chat-raised hover:text-chat-text">
              <Settings className="h-4 w-4" />
           </button>
         </div>
      </div>
    </aside>
  );
}
