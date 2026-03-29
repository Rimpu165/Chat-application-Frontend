"use client";

import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { useRouter } from "next/navigation";
import API from "@/lib/api";
import { cn } from "@/lib/utils";
import { Search, Plus, MessageSquare, Users, Settings, Bell } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface ChatSidebarProps {
  onSelectRoom: (room: any) => void;
  selectedRoomId?: string;
}

export default function ChatSidebar({ onSelectRoom, selectedRoomId }: ChatSidebarProps) {
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const router = useRouter();
  const [rooms, setRooms] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"chats" | "friends">("chats");

  useEffect(() => {
    fetchRooms();
    fetchFriends();
    fetchPendingRequests();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on("friendRequestReceived", (data: any) => {
        fetchPendingRequests();
    });

    socket.on("friendRequestAccepted", (data: any) => {
        fetchFriends();
        fetchPendingRequests();
    });

    socket.on("friendRemoved", (data: any) => {
        fetchFriends();
        fetchRooms();
    });

    return () => {
        socket.off("friendRequestReceived");
        socket.off("friendRequestAccepted");
        socket.off("friendRemoved");
    };
  }, [socket]);

  const fetchRooms = async () => {
    try {
      const res = await API.get("/rooms");
      setRooms(res.data);
    } catch (err) {
      console.error("Failed to fetch rooms");
    }
  };

  const fetchFriends = async () => {
    try {
      const res = await API.get("/friends");
      setFriends(res.data);
    } catch (err) {
      console.error("Failed to fetch friends");
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const res = await API.get("/friends/pending");
      setPendingRequests(res.data);
    } catch (err) {
      console.error("Failed to fetch pending requests");
    }
  };

  const listToDisplay = activeTab === "chats" ? rooms : friends;

  const filteredList = listToDisplay.filter(item => {
    if (activeTab === "chats") {
      const name = item.isGroup ? item.groupName : (item.participants.find((p: any) => p._id !== user?._id)?.name || "Chat");
      return name.toLowerCase().includes(searchTerm.toLowerCase());
    } else {
      return item.name.toLowerCase().includes(searchTerm.toLowerCase());
    }
  });

  return (
    <aside className="w-80 h-full border-r border-zinc-800 bg-zinc-900/50 flex flex-col">
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold tracking-tight">Messages</h2>
          <div className="flex gap-2">
            <button 
              onClick={() => router.push("/requests")}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors relative"
            >
               <Bell className="w-4 h-4 text-zinc-400" />
               {pendingRequests.length > 0 && (
                 <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full border-2 border-zinc-900" />
               )}
            </button>
            <button 
              onClick={() => router.push("/users")}
              className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20"
            >
               <Plus className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
        </div>

        <div className="flex p-1 bg-zinc-950 rounded-xl mb-6">
          <button 
            onClick={() => setActiveTab("chats")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all",
              activeTab === "chats" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <MessageSquare className="w-3.5 h-3.5" /> Chats
          </button>
          <button 
             onClick={() => setActiveTab("friends")}
             className={cn(
               "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all",
               activeTab === "friends" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
             )}
          >
            <Users className="w-3.5 h-3.5" /> Friends
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 space-y-1 custom-scrollbar">
        {filteredList.map((item) => {
          if (activeTab === "chats") {
            const room = item;
            const otherParticipant = room.participants.find((p: any) => p._id !== user?._id);
            const isOnline = otherParticipant && onlineUsers.includes(otherParticipant._id);
            const name = room.isGroup ? room.groupName : (otherParticipant?.name || "Deleted User");
            const lastMsg = room.lastMessage?.content || "Start a conversation";

            return (
              <button 
                key={room._id}
                onClick={() => onSelectRoom(room)}
                className={cn(
                  "w-full flex items-center gap-4 p-3 rounded-2xl transition-all group",
                  selectedRoomId === room._id ? "bg-blue-600 shadow-lg shadow-blue-500/20" : "hover:bg-zinc-800/50"
                )}
              >
                <div className="relative flex-shrink-0">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg",
                    selectedRoomId === room._id ? "bg-white/20 text-white" : "bg-zinc-800 text-zinc-400"
                  )}>
                    {name[0]}
                  </div>
                  {!room.isGroup && isOnline && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-[3px] border-zinc-900 group-hover:border-zinc-800 transition-colors" />
                  )}
                </div>
                
                <div className="flex-1 text-left overflow-hidden">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className={cn(
                      "font-semibold truncate",
                      selectedRoomId === room._id ? "text-white" : "text-zinc-200"
                    )}>
                      {name}
                    </span>
                    <span className={cn(
                      "text-[10px]",
                      selectedRoomId === room._id ? "text-white/60" : "text-zinc-500"
                    )}>
                      12:45
                    </span>
                  </div>
                  <p className={cn(
                    "text-xs truncate",
                    selectedRoomId === room._id ? "text-white/80" : "text-zinc-500"
                  )}>
                    {lastMsg}
                  </p>
                </div>
              </button>
            );
          } else {
            const friend = item;
            const isOnline = onlineUsers.includes(friend._id);
            
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
                className="w-full flex items-center gap-4 p-3 rounded-2xl transition-all hover:bg-zinc-800/50 group"
              >
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center font-bold text-lg text-zinc-400">
                    {friend.name[0]}
                  </div>
                  {isOnline && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-[3px] border-zinc-900 group-hover:border-zinc-800 transition-colors" />
                  )}
                </div>
                <div className="flex-1 text-left overflow-hidden">
                  <span className="font-semibold text-zinc-200 block truncate">{friend.name}</span>
                  <span className="text-[10px] text-zinc-500 font-medium tracking-tight">Community Friend</span>
                </div>
                <div className="p-2 rounded-lg bg-zinc-800 text-zinc-500 group-hover:text-blue-400 group-hover:bg-blue-500/10 transition-all">
                  <MessageSquare className="w-4 h-4" />
                </div>
              </button>
            );
          }
        })}
      </div>

      <div className="p-4 bg-zinc-900 border-t border-zinc-800">
         <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg">
             {user?.name[0]}
           </div>
           <div className="flex-1 overflow-hidden">
             <div className="text-sm font-bold truncate">{user?.name}</div>
             <div className="text-[10px] text-zinc-500 truncate capitalize">
               {user?.role === "admin" ? "Admin Mode" : "Online"}
             </div>
           </div>
           <button className="p-2 rounded-lg hover:bg-zinc-800 transition-colors">
              <Settings className="w-4 h-4 text-zinc-500" />
           </button>
         </div>
      </div>
    </aside>
  );
}
