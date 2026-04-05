"use client";

import API from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, Plus, UserPlus, UserMinus, LogOut, Trash2 } from "lucide-react";

export default function GroupsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [friends, setFriends] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (user) {
      fetchData();
    }
  }, [user, loading, router]);

  const fetchData = async () => {
    try {
      const [friendsRes, roomsRes] = await Promise.all([API.get("/friends/list"), API.get("/rooms")]);
      setFriends(friendsRes.data);
      setRooms(roomsRes.data.filter((r: any) => r.isGroup));
    } catch {
      toast.error("Failed to load groups");
    }
  };

  const createGroup = async () => {
    if (!name.trim() || selectedUsers.length === 0) return;
    try {
      await API.post("/rooms/group", { groupName: name, participants: selectedUsers });
      toast.success("Group created");
      setName("");
      setSelectedUsers([]);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create group");
    }
  };

  const addMember = async (roomId: string, userId: string) => {
    try {
      await API.put(`/rooms/${roomId}/add`, { userIds: [userId] });
      fetchData();
    } catch {
      toast.error("Cannot add member");
    }
  };

  const removeMember = async (roomId: string, userId: string) => {
    try {
      await API.put(`/rooms/${roomId}/remove`, { removeUserId: userId });
      fetchData();
    } catch {
      toast.error("Cannot remove member");
    }
  };

  const leaveGroup = async (roomId: string) => {
    try {
      await API.put(`/rooms/${roomId}/leave`);
      fetchData();
    } catch {
      toast.error("Cannot leave group");
    }
  };

  const deleteGroup = async (roomId: string) => {
    try {
      await API.delete(`/rooms/${roomId}`);
      fetchData();
    } catch {
      toast.error("Cannot delete group");
    }
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-chat-bg p-6 text-chat-text">
      <div className="mx-auto max-w-5xl space-y-6">
        <button
          type="button"
          onClick={() => router.push("/chat")}
          className="flex items-center gap-2 text-chat-muted transition-colors hover:text-chat-text"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="space-y-4 rounded-3xl border border-chat-border bg-chat-surface p-6">
          <h1 className="text-2xl font-bold tracking-tight">Create group</h1>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Group name"
            className="w-full rounded-xl border border-chat-border bg-chat-bg px-4 py-3 text-chat-text placeholder:text-chat-muted/60 focus:border-chat-accent/50 focus:outline-none focus:ring-2 focus:ring-chat-accent/20"
          />
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {friends.map((f) => (
              <label key={f._id} className="flex cursor-pointer items-center gap-2 rounded-xl border border-chat-border bg-chat-bg p-3 text-sm">
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(f._id)}
                  onChange={(e) => {
                    setSelectedUsers((prev) => (e.target.checked ? [...prev, f._id] : prev.filter((id) => id !== f._id)));
                  }}
                />
                {f.name}
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={createGroup}
            className="flex items-center gap-2 rounded-xl bg-chat-accent px-5 py-3 font-semibold text-chat-bg"
          >
            <Plus className="h-4 w-4" /> Create group
          </button>
        </div>

        <div className="space-y-4">
          {rooms.map((room) => (
            <div key={room._id} className="rounded-2xl border border-chat-border bg-chat-surface p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="text-lg font-bold">{room.name}</h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => leaveGroup(room._id)}
                    className="flex items-center gap-1 rounded-lg bg-chat-raised px-3 py-2 text-xs"
                  >
                    <LogOut className="h-3 w-3" /> Leave
                  </button>
                  {room.admin === user._id && (
                    <button
                      type="button"
                      onClick={() => deleteGroup(room._id)}
                      className="flex items-center gap-1 rounded-lg bg-red-600/15 px-3 py-2 text-xs text-red-400"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  )}
                </div>
              </div>
              <div className="mb-3 flex flex-wrap gap-2">
                {room.participants.map((p: any) => (
                  <div key={p._id} className="flex items-center gap-2 rounded-full bg-chat-raised px-3 py-1 text-xs">
                    {p.name}
                    {room.admin === user._id && p._id !== user._id && (
                      <button type="button" title="Remove member" onClick={() => removeMember(room._id, p._id)}>
                        <UserMinus className="h-3 w-3 text-red-400" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {room.admin === user._id && (
                <div className="flex flex-wrap gap-2">
                  {friends
                    .filter((f) => !room.participants.some((p: any) => p._id === f._id))
                    .map((f) => (
                      <button
                        key={f._id}
                        type="button"
                        onClick={() => addMember(room._id, f._id)}
                        className="flex items-center gap-1 rounded-lg bg-chat-raised px-2 py-1 text-xs"
                      >
                        <UserPlus className="h-3 w-3" /> {f.name}
                      </button>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
