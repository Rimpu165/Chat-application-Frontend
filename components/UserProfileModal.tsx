"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  ShieldCheck, 
  ShieldOff, 
  MessageCircle, 
  UserPlus, 
  Image as ImageIcon,
  MapPin,
  Calendar,
  Lock,
  Loader2,
  Undo2,
  Clock,
  Camera,
  Send,
  Briefcase,
  Code,
  Heart
} from "lucide-react";
import API from "@/lib/api";
import { resolveMediaUrl } from "@/lib/utils";
import toast from "react-hot-toast";

interface UserProfileModalProps {
  userId: string | null;
  onClose: () => void;
  onActionSuccess?: () => void;
  isOnline?: boolean;
}

export default function UserProfileModal({ userId, onClose, onActionSuccess, isOnline }: UserProfileModalProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/users/${userId}`);
      setProfile(res.data);
    } catch {
      toast.error("Failed to load profile");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleFriendAction = async () => {
    if (!profile) return;
    setActionLoading(true);
    try {
      if (profile.friendshipStatus === "none") {
        await API.post("/friends/send", { toUserId: profile._id });
        toast.success("Request sent");
      } else if (profile.friendshipStatus === "sent") {
        await API.delete(`/friends/cancel/${profile._id}`);
        toast.success("Request cancelled");
      }
      fetchProfile();
      if (onActionSuccess) onActionSuccess();
    } catch {
      toast.error("Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  if (!userId) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 backdrop-blur-md bg-black/60">
        <motion.div
           initial={{ opacity: 0, scale: 0.9, y: 20 }}
           animate={{ opacity: 1, scale: 1, y: 0 }}
           exit={{ opacity: 0, scale: 0.9, y: 20 }}
           className="relative w-full max-w-2xl bg-chat-surface rounded-[40px] border border-chat-border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 z-50 h-10 w-10 rounded-2xl bg-black/20 text-white backdrop-blur-md flex items-center justify-center hover:bg-black/40 transition-all active:scale-90"
          >
            <X className="h-5 w-5" />
          </button>

          {loading ? (
            <div className="flex h-96 w-full items-center justify-center">
               <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
            </div>
          ) : (
            <div className="overflow-y-auto custom-scrollbar flex-1">
              
              {/* Header/Cover */}
              <div className="relative h-48 w-full bg-chat-surface">
                {profile.coverPhoto && !profile.isPrivate ? (
                  <img src={resolveMediaUrl(profile.coverPhoto)} className="h-full w-full object-cover opacity-60" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-tr from-blue-600/20 to-purple-800/20" />
                )}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-chat-surface to-transparent" />
              </div>

              {/* Profile Details */}
              <div className="px-8 pb-10 -mt-16 relative">
                 <div className="flex flex-col md:flex-row items-end gap-6 mb-8">
                    <div className="relative">
                      <div className="h-32 w-32 rounded-[32px] border-[6px] border-chat-surface bg-chat-surface overflow-hidden shadow-xl">
                        {profile.profilePhoto ? (
                          <img src={resolveMediaUrl(profile.profilePhoto)} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-4xl font-black text-zinc-600">
                            {profile.name[0]}
                          </div>
                        )}
                      </div>
                      {isOnline && (
                        <div className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-chat-surface shadow-lg" />
                      )}
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h2 className="text-3xl font-black tracking-tighter uppercase">{profile.name}</h2>
                        {profile.isFriend && <ShieldCheck className="h-5 w-5 text-blue-500" />}
                      </div>
                      <p className="text-xs font-bold text-chat-muted uppercase tracking-widest">
                        {profile.isPrivate ? 'Private Profile' : 'Nexora Citizen'}
                      </p>
                    </div>
                 </div>

                 {profile.isPrivate && !profile.isFriend ? (
                   /* Locked State */
                   <div className="py-12 flex flex-col items-center text-center space-y-6 bg-chat-bg/40 rounded-[32px] border border-chat-border/50">
                      <div className="h-20 w-20 rounded-[32px] bg-amber-500/10 flex items-center justify-center text-amber-500">
                         <Lock className="h-10 w-10" />
                      </div>
                      <div className="space-y-2 max-w-xs">
                        <h3 className="text-xl font-bold uppercase tracking-tight">Profile Locked</h3>
                        <p className="text-sm text-chat-muted leading-relaxed">{profile.message || "This user's profile is private. Add them as a friend to see their gallery and details."}</p>
                      </div>
                      <button 
                        onClick={handleFriendAction}
                        disabled={actionLoading}
                        className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded-2xl font-black text-sm hover:bg-zinc-200 transition-all disabled:opacity-50"
                      >
                         {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : profile.friendshipStatus === "sent" ? <Clock className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                         {profile.friendshipStatus === "sent" ? "Request Pending" : "Send Friend Request"}
                      </button>
                   </div>
                 ) : (
                   /* Public / Friend State */
                   <div className="space-y-8">
                      {profile.bio && (
                        <div className="p-6 bg-chat-bg/40 rounded-3xl border border-chat-border/50">
                           <p className="text-sm font-medium text-zinc-300 italic">"{profile.bio}"</p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                         <div className="bg-chat-surface/40 p-4 rounded-2xl border border-chat-border">
                            <p className="text-[10px] font-black text-chat-muted uppercase tracking-widest mb-1">Mutual Friends</p>
                            <p className="text-xl font-black">{profile.mutualFriendsCount || 0}</p>
                         </div>
                         <div className="bg-chat-surface/40 p-4 rounded-2xl border border-chat-border">
                            <p className="text-[10px] font-black text-chat-muted uppercase tracking-widest mb-1">Age</p>
                            <p className="text-xl font-black">{profile.age || '—'}</p>
                         </div>
                         <div className="bg-chat-surface/40 p-4 rounded-2xl border border-chat-border">
                            <p className="text-[10px] font-black text-chat-muted uppercase tracking-widest mb-1">Gender</p>
                            <p className="text-xl font-black">{profile.gender || '—'}</p>
                         </div>
                         <div className="bg-chat-surface/40 p-4 rounded-2xl border border-chat-border">
                            <p className="text-[10px] font-black text-chat-muted uppercase tracking-widest mb-1">Items</p>
                            <p className="text-xl font-black">{profile.gallery?.length || 0}</p>
                         </div>
                      </div>

                      {profile.location && (
                        <div className="flex items-center gap-2 text-chat-muted text-sm font-medium">
                           <MapPin className="h-4 w-4" /> {profile.location}
                        </div>
                      )}

                      {profile.socialLinks && (
                        <div className="flex gap-3">
                           {profile.socialLinks.instagram && (
                              <a href={`https://instagram.com/${profile.socialLinks.instagram}`} target="_blank" className="p-3 rounded-xl bg-chat-surface border border-zinc-700 hover:text-pink-500 transition-all">
                                 <Camera className="h-5 w-5" />
                              </a>
                           )}
                           {profile.socialLinks.twitter && (
                              <a href={`https://twitter.com/${profile.socialLinks.twitter}`} target="_blank" className="p-3 rounded-xl bg-chat-surface border border-zinc-700 hover:text-blue-400 transition-all" rel="noreferrer">
                                 <Send className="h-5 w-5" />
                              </a>
                           )}
                           {profile.socialLinks.linkedin && (
                              <a href={profile.socialLinks.linkedin} target="_blank" className="p-3 rounded-xl bg-chat-surface border border-zinc-700 hover:text-blue-600 transition-all" rel="noreferrer">
                                 <Briefcase className="h-5 w-5" />
                              </a>
                           )}
                           {profile.socialLinks.github && (
                              <a href={`https://github.com/${profile.socialLinks.github}`} target="_blank" className="p-3 rounded-xl bg-chat-surface border border-zinc-700 hover:text-white transition-all" rel="noreferrer">
                                 <Code className="h-5 w-5" />
                              </a>
                           )}
                        </div>
                      )}

                      {profile.gallery && profile.gallery.length > 0 && (
                        <div className="space-y-4">
                           <h3 className="text-xs font-black uppercase tracking-[0.2em] text-chat-muted flex items-center gap-2 font-black">
                             <ImageIcon className="h-4 w-4" /> Gallery Highlights
                           </h3>
                           <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {profile.gallery.map((img: string, i: number) => (
                                <div key={i} className="aspect-square rounded-2xl overflow-hidden bg-chat-surface border border-chat-border group cursor-pointer">
                                  <img src={resolveMediaUrl(img)} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                                </div>
                              ))}
                           </div>
                        </div>
                      )}

                      <div className="flex gap-4 border-t border-chat-border pt-8">
                         {profile.isFriend ? (
                           <button 
                             onClick={() => toast.success("Opening chat...")}
                             className="flex-1 h-14 bg-blue-600 rounded-2xl font-black uppercase tracking-tight flex items-center justify-center gap-2 hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20"
                           >
                             <MessageCircle className="h-5 w-5" /> Send Message
                           </button>
                         ) : (
                           <button 
                              onClick={handleFriendAction}
                              disabled={actionLoading}
                              className="flex-1 h-14 bg-white text-black rounded-2xl font-black uppercase tracking-tight flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all"
                           >
                             {actionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserPlus className="h-5 w-5" />}
                             {profile.friendshipStatus === "sent" ? "Cancel Pending" : "Add to Network"}
                           </button>
                         )}
                      </div>
                   </div>
                 )}

              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
