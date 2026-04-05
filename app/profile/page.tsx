"use client";

import API from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { ArrowLeft, Camera, Save, Trash2 } from "lucide-react";

export default function ProfilePage() {
  const { user, loading, updateUser, logout } = useAuth();
  const router = useRouter();
  const [name, setName] = useState(user?.name || "");
  const [status, setStatus] = useState<"online" | "offline">((user?.status as "online" | "offline") || "online");
  const [file, setFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (loading || !user) return null;

  const onUpdateProfile = async () => {
    setIsSaving(true);
    try {
      const res = await API.put("/users", { name, status });
      updateUser(res.data.user);
      toast.success("Profile updated");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const onUploadPhoto = async () => {
    if (!file) return;
    const fd = new FormData();
    fd.append("photo", file);
    try {
      const res = await API.put("/users/profile-photo", fd);
      updateUser(res.data.user);
      toast.success("Profile photo updated");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to upload photo");
    }
  };

  const onDeleteAccount = async () => {
    if (!window.confirm("Delete account permanently?")) return;
    try {
      await API.delete("/users");
      logout();
    } catch {
      toast.error("Failed to delete account");
    }
  };

  return (
    <div className="min-h-screen bg-chat-bg p-6 text-chat-text">
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={() => router.push("/chat")}
          className="mb-6 flex items-center gap-2 text-chat-muted transition-colors hover:text-chat-text"
        >
          <ArrowLeft className="h-4 w-4" /> Back to chat
        </button>

        <div className="space-y-6 rounded-3xl border border-chat-border bg-chat-surface p-6 md:p-8">
          <h1 className="text-3xl font-bold tracking-tight">My profile</h1>

          <div className="flex flex-wrap items-center gap-4">
            {user.profilePhoto ? (
              <img src={user.profilePhoto} alt={user.name} className="h-20 w-20 rounded-2xl object-cover" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-chat-raised text-2xl font-bold text-chat-accent">
                {user.name[0]}
              </div>
            )}
            <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-chat-raised px-4 py-2 text-sm transition-colors hover:bg-chat-border/60">
              <Camera className="h-4 w-4" /> Select photo
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>
            <button
              type="button"
              onClick={onUploadPhoto}
              disabled={!file}
              className="rounded-xl bg-chat-accent px-4 py-2 text-sm font-medium text-chat-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Upload
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-chat-muted">Name</label>
              <input
                aria-label="Name"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-chat-border bg-chat-bg px-4 py-3 text-chat-text placeholder:text-chat-muted/60 focus:border-chat-accent/50 focus:outline-none focus:ring-2 focus:ring-chat-accent/20"
              />
            </div>
            <div>
              <label className="text-sm text-chat-muted">Status</label>
              <select
                aria-label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value as "online" | "offline")}
                className="mt-1 w-full rounded-xl border border-chat-border bg-chat-bg px-4 py-3 text-chat-text focus:border-chat-accent/50 focus:outline-none focus:ring-2 focus:ring-chat-accent/20"
              >
                <option value="online">Online</option>
                <option value="offline">Offline</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onUpdateProfile}
              disabled={isSaving}
              className="flex items-center gap-2 rounded-xl bg-chat-accent px-5 py-3 font-semibold text-chat-bg disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> Save changes
            </button>
            <button
              type="button"
              onClick={onDeleteAccount}
              className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-600/15 px-5 py-3 text-red-400"
            >
              <Trash2 className="h-4 w-4" /> Delete account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
