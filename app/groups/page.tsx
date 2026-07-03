"use client";

import API from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { 
  ArrowLeft, Plus, UserPlus, UserMinus, LogOut, 
  Trash2, Search, Camera, X, Users, Settings2, ShieldCheck,
  MoreVertical, Edit3, CheckCircle2, LayoutGrid
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { resolveMediaUrl } from "@/lib/utils";
import ThemeToggle from "@/components/ThemeToggle";

// Premium Skeleton Component
const GroupSkeleton = () => (
  <div className="relative overflow-hidden rounded-[2.5rem] border border-chat-border bg-chat-surface p-6 shadow-xl">
    <div className="flex gap-4">
      <div className="h-20 w-20 rounded-3xl bg-chat-bg animate-pulse" />
      <div className="flex-1 space-y-3">
        <div className="h-6 w-1/2 bg-chat-bg rounded-lg animate-pulse" />
        <div className="h-4 w-3/4 bg-chat-bg rounded-lg animate-pulse" />
        <div className="flex gap-2">
           {[1,2,3].map(i => <div key={i} className="h-8 w-8 rounded-xl bg-chat-bg animate-pulse" />)}
        </div>
      </div>
    </div>
    <div className="mt-6 h-12 w-full bg-chat-bg rounded-2xl animate-pulse" />
    <div className="absolute inset-0 animate-shimmer pointer-events-none" />
  </div>
);

export default function GroupsPage() {
  const { user, loading } = useAuth();
  const { socket } = useSocket();
  const router = useRouter();
  
  const [friends, setFriends] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState(""); // Friends search
  const [roomsSearchQuery, setRoomsSearchQuery] = useState(""); // Rooms search
  
  // Creation States
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupImageFile, setGroupImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Management States
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (user) {
      fetchData();
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!socket) return;

    const handleRoomUpdate = () => fetchData();
    
    socket.on("roomCreated", handleRoomUpdate);
    socket.on("roomUpdated", handleRoomUpdate);
    socket.on("roomDeleted", handleRoomUpdate);
    socket.on("removedFromRoom", handleRoomUpdate);

    return () => {
      socket.off("roomCreated", handleRoomUpdate);
      socket.off("roomUpdated", handleRoomUpdate);
      socket.off("roomDeleted", handleRoomUpdate);
      socket.off("removedFromRoom", handleRoomUpdate);
    };
  }, [socket]);

  const fetchData = async () => {
    try {
      setLoadingData(true);
      const [friendsRes, roomsRes] = await Promise.all([
        API.get("/friends/list"), 
        API.get("/rooms")
      ]);
      setFriends(friendsRes.data);
      setRooms(roomsRes.data.filter((r: any) => r.isGroup));
    } catch {
      toast.error("Failed to load data", { className: "toast-nexora" });
    } finally {
      setLoadingData(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setGroupImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const createGroup = async () => {
    if (!name.trim()) return toast.error("Please enter a group name");
    if (selectedUsers.length === 0) return toast.error("Please select at least one member");

    const toastId = toast.loading("Creating group...");
    try {
      const formData = new FormData();
      formData.append("groupName", name.trim());
      formData.append("description", description.trim());
      formData.append("participants", JSON.stringify(selectedUsers));
      if (groupImageFile) {
        formData.append("groupImage", groupImageFile);
      }

      await API.post("/rooms/group", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      toast.success("Group created successfully!", { id: toastId });
      
      // Realistic Celebration Effect
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#14b8a6', '#f43f5e']
      });

      setName("");
      setDescription("");
      setSelectedUsers([]);
      setGroupImageFile(null);
      setImagePreview(null);
      setIsCreating(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create group", { id: toastId });
    }
  };

  const updateGroup = async (roomId: string) => {
    const toastId = toast.loading("Updating group...");
    try {
      const formData = new FormData();
      if (editName.trim()) formData.append("groupName", editName.trim());
      formData.append("description", editDescription.trim());
      if (groupImageFile) formData.append("groupImage", groupImageFile);

      await API.put(`/rooms/${roomId}/update-details`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      toast.success("Group updated!", { id: toastId });
      setEditingRoomId(null);
      setGroupImageFile(null);
      setImagePreview(null);
      fetchData();
    } catch (error: any) {
      toast.error("Failed to update group", { id: toastId });
    }
  };

  const copyInvite = (roomId: string) => {
    const url = `${window.location.origin}/chat?room=${roomId}`;
    navigator.clipboard.writeText(url);
    toast.success("Invite link copied to clipboard", {
      icon: "🔗",
      className: "toast-nexora"
    });
  };

  const addMember = async (roomId: string, userId: string) => {
    try {
      await API.put(`/rooms/${roomId}/add`, { userIds: [userId] });
      toast.success("Member added");
      fetchData();
    } catch {
      toast.error("Failed to add member");
    }
  };

  const removeMember = async (roomId: string, userId: string) => {
    try {
      await API.put(`/rooms/${roomId}/remove`, { removeUserId: userId });
      toast.success("Member removed");
      fetchData();
    } catch {
      toast.error("Failed to remove member");
    }
  };

  const leaveRoom = async (roomId: string) => {
    if (!confirm("Are you sure you want to leave this group?")) return;
    try {
      await API.put(`/rooms/${roomId}/leave`);
      toast.success("Left group");
      fetchData();
    } catch {
      toast.error("Failed to leave group");
    }
  };

  const deleteRoom = async (roomId: string) => {
    if (!confirm("Are you sure you want to delete this group? All messages will be lost.")) return;
    try {
      await API.delete(`/rooms/${roomId}`);
      toast.success("Group deleted");
      fetchData();
    } catch {
      toast.error("Failed to delete group");
    }
  };

  const filteredFriends = friends.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRooms = rooms.filter(r => 
    r.name.toLowerCase().includes(roomsSearchQuery.toLowerCase()) || 
    (r.description && r.description.toLowerCase().includes(roomsSearchQuery.toLowerCase()))
  );

  if (loading || !user) return null;

  const { onlineUsers } = useSocket();

  return (
    <div className="relative min-h-screen bg-chat-bg text-chat-text overflow-x-hidden pt-24">
      {/* Animated Aura Background */}
      <div className="absolute inset-0 animate-aura pointer-events-none z-0" />
      
      <div className="relative z-10 mx-auto max-w-7xl space-y-8 p-4 md:p-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => router.push("/chat")}
              className="group flex items-center gap-2 text-chat-muted transition-colors hover:text-chat-text"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-chat-surface border border-chat-border group-hover:border-chat-accent/50 group-hover:bg-chat-raised transition-all">
                <ArrowLeft className="h-5 w-5" />
              </div>
              <span className="font-medium">Back to Chats</span>
            </motion.button>
          </div>

          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCreating(!isCreating)}
            className="flex items-center gap-2 rounded-2xl bg-chat-accent px-6 py-3 font-bold text-chat-bg shadow-lg shadow-chat-accent/20 hover:bg-chat-accent/90 transition-all"
          >
            {isCreating ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            {isCreating ? "Cancel" : "Create Group"}
          </motion.button>
        </div>

        <AnimatePresence>
          {isCreating && (
            <motion.div
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-3xl border border-chat-border bg-chat-surface p-8 shadow-2xl space-y-8">
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Group Image Upload */}
                  <div className="flex flex-col items-center gap-4">
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="group relative h-32 w-32 cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed border-chat-border bg-chat-bg transition-all hover:border-chat-accent/50"
                    >
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center text-chat-muted group-hover:text-chat-accent">
                          <Camera className="h-8 w-8 mb-2" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Upload</span>
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit3 className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleImageChange} 
                      className="hidden" 
                      accept="image/*" 
                    />
                    <div className="text-center">
                      <h2 className="text-lg font-bold">Group Avatar</h2>
                      <p className="text-xs text-chat-muted">Optional, but looks better</p>
                    </div>
                  </div>

                  {/* Group Details */}
                  <div className="flex-1 space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                       <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-chat-muted ml-1">Group Name</label>
                          <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Dream Team"
                            className="w-full rounded-2xl border border-chat-border bg-chat-bg px-5 py-4 text-lg font-semibold text-chat-text placeholder:text-chat-muted/40 focus:border-chat-accent/50 focus:outline-none focus:ring-4 focus:ring-chat-accent/10 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-chat-muted ml-1">Description</label>
                          <input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What's this group about?"
                            className="w-full rounded-2xl border border-chat-border bg-chat-bg px-5 py-4 text-sm font-medium text-chat-text placeholder:text-chat-muted/40 focus:border-chat-accent/50 focus:outline-none focus:ring-4 focus:ring-chat-accent/10 transition-all"
                          />
                        </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-1">
                        <label className="text-xs font-bold uppercase tracking-widest text-chat-muted">Select Members ({selectedUsers.length})</label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-chat-muted" />
                          <input 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search friends..."
                            className="rounded-full border border-chat-border bg-chat-bg py-1.5 pl-9 pr-4 text-xs focus:border-chat-accent/50 focus:outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div className="custom-scrollbar max-h-[200px] overflow-y-auto pr-2 grid gap-2 sm:grid-cols-2">
                        {filteredFriends.length > 0 ? filteredFriends.map((f) => {
                          const isSelected = selectedUsers.includes(f._id);
                          return (
                            <div 
                              key={f._id}
                              onClick={() => setSelectedUsers(prev => isSelected ? prev.filter(id => id !== f._id) : [...prev, f._id])}
                              className={`group flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition-all ${
                                isSelected 
                                  ? "border-chat-accent bg-chat-accent/5 shadow-inner" 
                                  : "border-chat-border bg-chat-bg hover:border-chat-muted/50"
                              }`}
                            >
                              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-chat-border bg-chat-surface">
                                {f.profilePhoto ? (
                                  <img src={resolveMediaUrl(f.profilePhoto)} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  <div className="flex h-full items-center justify-center text-chat-muted font-bold bg-chat-raised text-xs">
                                    {f.name[0]}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 overflow-hidden">
                                <p className="truncate text-sm font-bold">{f.name}</p>
                                <p className="truncate text-[10px] text-chat-muted">{f.email}</p>
                              </div>
                              {isSelected ? (
                                <div className="rounded-full bg-chat-accent p-1 text-chat-bg">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                </div>
                              ) : (
                                <div className="h-5 w-5 rounded-full border-2 border-chat-border transition-colors group-hover:border-chat-muted" />
                              )}
                            </div>
                          );
                        }) : (
                          <div className="col-span-full py-10 text-center space-y-2">
                             <Users className="h-8 w-8 mx-auto text-chat-muted/30" />
                             <p className="text-chat-muted text-sm font-medium">No friends found</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-chat-border">
                  <button
                    type="button"
                    onClick={createGroup}
                    disabled={!name.trim() || selectedUsers.length === 0}
                    className="group relative flex items-center gap-2 overflow-hidden rounded-2xl bg-chat-accent px-10 py-4 font-bold text-chat-bg shadow-xl transition-all hover:translate-y-[-2px] disabled:opacity-50 disabled:grayscale disabled:hover:translate-y-0"
                  >
                    <Plus className="h-5 w-5" />
                    Create Your Group
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-black/10 transition-all group-hover:h-full group-hover:opacity-10" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Groups List */}
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-1.5 rounded-full bg-chat-accent shadow-[0_0_10px_var(--chat-accent)]" />
              <h2 className="text-xl font-black uppercase tracking-widest text-chat-muted">Your Communities</h2>
            </div>
            
            <div className="relative max-w-sm flex-1">
               <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-chat-muted" />
               <input 
                  value={roomsSearchQuery}
                  onChange={(e) => setRoomsSearchQuery(e.target.value)}
                  placeholder="Find a group..."
                  className="w-full rounded-2xl border border-chat-border bg-chat-surface py-3 pl-10 pr-4 text-sm focus:border-chat-accent/50 focus:outline-none transition-all shadow-lg"
               />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {loadingData ? (
              // Realistic Loading State
              Array.from({ length: 4 }).map((_, i) => <GroupSkeleton key={i} />)
            ) : filteredRooms.length > 0 ? (
              filteredRooms.map((room) => {
                const isAdmin = room.admin === user._id || room.admin?._id === user._id;
                const adminInfo = typeof room.admin === 'object' ? room.admin : room.participants.find((p: any) => p._id === room.admin);
                const onlineCount = room.participants.filter((p: any) => onlineUsers.includes(p._id)).length;

                return (
                  <motion.div 
                    layout
                    key={room._id} 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="group relative overflow-hidden rounded-[2.5rem] border border-chat-border bg-chat-surface p-6 shadow-xl transition-all hover:border-chat-accent/30 hover:shadow-chat-accent/5 hover:bg-chat-raised/50"
                  >
                    <div className="flex gap-4">
                      {/* Avatar */}
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-3xl border border-chat-border bg-chat-bg shadow-lg">
                        {room.groupImage ? (
                          <img src={resolveMediaUrl(room.groupImage)} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-gradient-to-br from-chat-accent/20 to-chat-surface text-3xl font-black text-chat-accent">
                            {room.name[0]}
                          </div>
                        )}
                        {isAdmin && (
                          <div className="absolute bottom-0 inset-x-0 h-1/3 bg-chat-accent/80 flex items-center justify-center backdrop-blur-sm">
                             <ShieldCheck className="h-4 w-4 text-chat-bg" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-2 overflow-hidden">
                        <div className="flex items-start justify-between">
                          <div className="overflow-hidden">
                            <h3 className="truncate text-xl font-black">{room.name}</h3>
                            <p className="truncate text-xs text-chat-muted h-4">{room.description || "No description set"}</p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                             <button 
                               onClick={() => copyInvite(room._id)}
                               title="Copy Invite Link"
                               className="p-1.5 rounded-lg hover:bg-chat-accent/10 text-chat-muted hover:text-chat-accent transition-colors"
                             >
                                <Plus className="h-4 w-4 rotate-45" />
                             </button>
                             {isAdmin && (
                              <button 
                                onClick={() => {
                                  setEditingRoomId(room._id === editingRoomId ? null : room._id);
                                  setEditName(room.name);
                                  setEditDescription(room.description || "");
                                }}
                                className="p-1.5 rounded-lg hover:bg-chat-accent/10 text-chat-muted hover:text-chat-accent transition-colors"
                              >
                                <Settings2 className="h-4 w-4" />
                              </button>
                             )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-chat-muted">
                           <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              <span>{room.participants.length}</span>
                           </div>
                           <div className="flex items-center gap-1 text-chat-success">
                              <div className="h-1.5 w-1.5 rounded-full bg-chat-success shadow-[0_0_5px_currentColor]" />
                              <span>{onlineCount} Online</span>
                           </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-2">
                           {room.participants.slice(0, 6).map((p: any) => {
                             const isOnline = onlineUsers.includes(p._id);
                             return (
                               <div key={p._id} className="relative group/p">
                                  <div className={`h-8 w-8 overflow-hidden rounded-xl bg-chat-bg border shrink-0 transition-all ${isOnline ? 'border-chat-success' : 'border-chat-border'}`} title={p.name}>
                                    {p.profilePhoto ? (
                                        <img src={resolveMediaUrl(p.profilePhoto)} className="h-full w-full object-cover" />
                                    ) : (
                                      <div className="flex h-full items-center justify-center text-[10px] font-bold uppercase">{p.name[0]}</div>
                                    )}
                                  </div>
                                  {isOnline && (
                                    <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-chat-surface bg-chat-success" />
                                  )}
                               </div>
                             );
                           })}
                           {room.participants.length > 6 && (
                             <div className="flex h-8 items-center rounded-xl bg-chat-accent/10 px-2 text-[10px] font-bold text-chat-accent border border-chat-accent/20">
                               +{room.participants.length - 6}
                             </div>
                           )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between gap-4 border-t border-chat-border/40 pt-5">
                       <button
                         onClick={() => router.push(`/chat?room=${room._id}`)}
                         className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-chat-raised py-3.5 text-sm font-bold transition-all hover:bg-chat-accent hover:text-chat-bg hover:translate-y-[-2px] active:translate-y-0"
                       >
                         Enter Community
                       </button>

                       <div className="flex gap-2">
                         <button
                           onClick={() => leaveRoom(room._id)}
                           title="Leave Group"
                           className="flex h-12 w-12 items-center justify-center rounded-2xl border border-chat-border bg-chat-surface text-chat-muted transition-all hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400"
                         >
                           <LogOut className="h-5 w-5" />
                         </button>
                         {isAdmin && (
                           <button
                             onClick={() => deleteRoom(room._id)}
                             title="Delete Group"
                             className="flex h-12 w-12 items-center justify-center rounded-2xl border border-chat-border bg-chat-surface text-chat-muted transition-all hover:border-red-500/50 hover:bg-red-500/20 hover:text-red-400"
                           >
                             <Trash2 className="h-5 w-5" />
                           </button>
                         )}
                       </div>
                    </div>

                    <AnimatePresence>
                      {editingRoomId === room._id && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-6 space-y-6 overflow-hidden border-t border-chat-accent/20 pt-6"
                        >
                          <div className="space-y-4">
                            <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-chat-accent">
                               <Settings2 className="h-3 w-3" /> Management
                            </h4>
                            
                            <div className="space-y-3">
                              <input 
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="Group Name"
                                className="w-full rounded-xl border border-chat-border bg-chat-bg px-4 py-3 text-sm focus:border-chat-accent/50 focus:outline-none"
                              />
                              <textarea 
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                placeholder="Group Description (Optional)"
                                rows={2}
                                className="w-full rounded-xl border border-chat-border bg-chat-bg px-4 py-3 text-sm focus:border-chat-accent/50 focus:outline-none resize-none"
                              />
                              <button 
                                onClick={() => updateGroup(room._id)}
                                className="w-full rounded-xl bg-chat-accent py-3 text-chat-bg font-bold hover:bg-chat-accent/90"
                              >
                                Save Changes
                              </button>
                            </div>

                            <div className="space-y-2">
                               <p className="flex items-center justify-between text-[10px] font-bold text-chat-muted uppercase tracking-wider">
                                  <span>Add Friends</span>
                                  <span>Invite friends who are not here</span>
                               </p>
                               <div className="flex flex-wrap gap-2">
                                 {friends
                                    .filter((f) => !room.participants.some((p: any) => p._id === f._id))
                                    .map((f) => (
                                      <button
                                        key={f._id}
                                        onClick={() => addMember(room._id, f._id)}
                                        className="flex items-center gap-2 rounded-xl bg-chat-bg border border-chat-border px-3 py-2 text-xs font-bold hover:border-chat-accent hover:text-chat-accent transition-all"
                                      >
                                        <Plus className="h-3 w-3" /> {f.name}
                                      </button>
                                    ))
                                 }
                                 {friends.filter((f) => !room.participants.some((p: any) => p._id === f._id)).length === 0 && (
                                   <p className="text-[10px] text-chat-muted italic py-2">Whole squad is already present.</p>
                                 )}
                               </div>
                            </div>

                            <div className="space-y-2">
                               <p className="text-[10px] font-bold text-chat-muted uppercase tracking-wider">Member Actions</p>
                               <div className="grid gap-2 sm:grid-cols-2">
                                 {room.participants.map((p: any) => (
                                   <div key={p._id} className="flex items-center justify-between rounded-xl bg-chat-bg border border-chat-border p-2">
                                      <div className="flex items-center gap-2 overflow-hidden">
                                        <div className="relative h-7 w-7 rounded-lg bg-chat-surface border border-chat-border flex items-center justify-center text-[8px] overflow-hidden shrink-0">
                                           {p.profilePhoto ? <img src={resolveMediaUrl(p.profilePhoto)} /> : <span>{p.name[0]}</span>}
                                           {onlineUsers.includes(p._id) && (
                                              <span className="absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full bg-chat-success" />
                                           )}
                                        </div>
                                        <span className="truncate text-xs font-bold">{p.name} {p._id === user._id && "(You)"}</span>
                                      </div>
                                      {isAdmin && p._id !== user._id && (
                                        <button 
                                          onClick={() => removeMember(room._id, p._id)}
                                          className="p-1 rounded-lg text-red-400 hover:bg-red-400/10"
                                        >
                                          <UserMinus className="h-3 w-3" />
                                        </button>
                                      )}
                                   </div>
                                 ))}
                               </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center border-2 border-dashed border-chat-border rounded-[3rem] py-24 space-y-6">
                 <div className="h-24 w-24 rounded-[2rem] bg-chat-accent/5 flex items-center justify-center border border-chat-accent/10">
                    <Users className="h-12 w-12 text-chat-accent/30" />
                 </div>
                 <div className="text-center space-y-2">
                   <h3 className="text-2xl font-black">{roomsSearchQuery ? "No results found" : "No Communities Yet"}</h3>
                   <p className="text-chat-muted max-w-xs mx-auto">
                     {roomsSearchQuery ? "Try searching for something else or create a new group." : "Create a group to start collaborating with your friends in real-time."}
                   </p>
                 </div>
                 {!roomsSearchQuery && (
                   <button 
                     onClick={() => setIsCreating(true)}
                     className="rounded-2xl bg-chat-raised px-8 py-3 text-sm font-bold text-chat-accent border border-chat-accent/20 hover:bg-chat-accent hover:text-chat-bg transition-all"
                   >
                     Launch First Group
                   </button>
                 )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
