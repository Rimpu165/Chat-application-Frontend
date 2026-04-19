"use client";

import API from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import { 
  ArrowLeft, 
  Camera, 
  Save, 
  Trash2, 
  ShieldCheck, 
  ShieldOff, 
  Image as ImageIcon, 
  Plus, 
  X, 
  Info,
  User as UserIcon,
  LayoutDashboard,
  Activity as ActivityIcon,
  Send,
  Briefcase,
  Code,
  MapPin,
  Heart
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";
import { resolveMediaUrl } from "@/lib/utils";

export default function ProfilePage() {
  const { user, loading, updateUser, logout } = useAuth();
  const router = useRouter();
  
  // Basic Info States
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [status, setStatus] = useState(user?.status || "online");
  const [isPrivate, setIsPrivate] = useState(user?.isPrivate || false);
  const [age, setAge] = useState<number | string>(user?.age || "");
  const [gender, setGender] = useState(user?.gender || "Secret");
  const [location, setLocation] = useState(user?.location || "");
  const [socialLinks, setSocialLinks] = useState({
    instagram: user?.socialLinks?.instagram || "",
    twitter: user?.socialLinks?.twitter || "",
    linkedin: user?.socialLinks?.linkedin || "",
    github: user?.socialLinks?.github || ""
  });
  
  // Media States
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<FileList | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"about" | "gallery">("about");

  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setBio(user.bio || "");
      setIsPrivate(user.isPrivate || false);
      setAge(user.age || "");
      setGender(user.gender || "Secret");
      setLocation(user.location || "");
      setSocialLinks({
        instagram: user.socialLinks?.instagram || "",
        twitter: user.socialLinks?.twitter || "",
        linkedin: user.socialLinks?.linkedin || "",
        github: user.socialLinks?.github || ""
      });
    }
  }, [user]);

  if (loading || !user) return null;

  const onUpdateProfile = async () => {
    setIsSaving(true);
    try {
      const res = await API.put("/users", { 
        name, status, bio, isPrivate, age: age === "" ? null : Number(age), gender, location, socialLinks 
      });
      updateUser(res.data.user);
      toast.success("Profile refined!", { icon: "✨" });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const uploadMedia = async (type: "profile" | "cover" | "gallery", filesOverride?: FileList | File | null) => {
    const toastId = toast.loading(`Uploading ${type}...`);
    try {
      const fd = new FormData();
      if (type === "profile") {
        const file = filesOverride instanceof File ? filesOverride : profileFile;
        if (!file) throw new Error("No file selected");
        fd.append("photo", file);
        const res = await API.put("/users/profile-photo", fd);
        updateUser(res.data.user);
        setProfileFile(null);
      } else if (type === "cover") {
        const file = filesOverride instanceof File ? filesOverride : coverFile;
        if (!file) throw new Error("No file selected");
        fd.append("cover", file);
        const res = await API.post("/users/cover-photo", fd);
        updateUser(res.data.user);
        setCoverFile(null);
      } else if (type === "gallery") {
        const files = (filesOverride instanceof FileList) ? filesOverride : galleryFiles;
        if (!files || files.length === 0) throw new Error("No files selected");
        Array.from(files).forEach(f => fd.append("images", f));
        const res = await API.post("/users/gallery", fd);
        updateUser(res.data.user);
        setGalleryFiles(null);
      }
      toast.success(`${type} refined!`, { id: toastId });
    } catch (error: any) {
      toast.error(error.message || "Upload failed", { id: toastId });
    }
  };

  const removeFromGallery = async (imageUrl: string) => {
    try {
      const res = await API.delete("/users/gallery", { data: { imageUrl } });
      updateUser(res.data.user);
      toast.success("Image removed");
    } catch {
      toast.error("Failed to remove image");
    }
  };

  const onDeleteAccount = async () => {
    if (!window.confirm("Permanently erase your Nexora account? This cannot be undone.")) return;
    try {
      await API.delete("/users");
      logout();
    } catch {
      toast.error("Failed to delete account");
    }
  };

  const profileUrl = resolveMediaUrl(user.profilePhoto);
  const coverUrl = resolveMediaUrl(user.coverPhoto);

  return (
    <div className="min-h-screen bg-chat-bg text-chat-text selection:bg-blue-500/30">
      
      {/* Cover Backdrop */}
      <div className="relative h-40 md:h-52 w-full overflow-hidden bg-zinc-900 border-b border-zinc-800">
        {coverUrl ? (
          <img src={coverUrl} alt="Cover" className="h-full w-full object-cover opacity-60" />
        ) : (
          <div className="h-full w-full bg-linear-to-br from-blue-600/20 via-purple-600/20 to-zinc-950" />
        )}
        
        <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-zinc-950 to-transparent" />
        
        <div className="absolute right-6 bottom-6 flex items-center gap-3">
           <ThemeToggle />
           <button 
             onClick={() => coverInputRef.current?.click()}
             className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-xs font-bold backdrop-blur-md transition-all hover:bg-white/20"
           >
             <Camera className="h-4 w-4" /> Change Cover
           </button>
        </div>
        <input ref={coverInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadMedia("cover", file);
        }} />

        <button
          onClick={() => router.push("/")}
          className="absolute left-6 top-6 flex items-center gap-2 rounded-xl bg-black/20 p-3 text-xs font-bold backdrop-blur-md transition-all hover:bg-black/40"
        >
          <ArrowLeft className="h-4 w-4" /> Exit Edit
        </button>
      </div>

      <div className="mx-auto -mt-20 max-w-5xl px-6 pb-20">
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-end">
          <div className="relative group/avatar">
            <div className="h-40 w-40 overflow-hidden rounded-[40px] border-[6px] border-zinc-950 bg-zinc-900 shadow-2xl">
              {profileUrl ? (
                <img src={profileUrl} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-5xl font-black text-zinc-700">
                  {user.name[0]}
                </div>
              )}
            </div>
            <button 
              onClick={() => profileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30 transition-transform hover:scale-110 active:scale-95"
            >
              <Camera className="h-5 w-5" />
            </button>
            <input ref={profileInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadMedia("profile", file);
            }} />
          </div>

          <div className="flex-1 space-y-1">
            <h1 className="text-4xl font-black tracking-tighter uppercase">{user.name}</h1>
            <p className="font-medium text-zinc-500 uppercase tracking-widest text-xs">Community Member Since {new Date(user.createdAt).getFullYear()}</p>
          </div>

          <div className="flex gap-2">
            <button
               onClick={() => setActiveTab("about")}
               className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition-all ${activeTab === 'about' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <UserIcon className="h-4 w-4" /> About
            </button>
            <button
               onClick={() => setActiveTab("gallery")}
               className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition-all ${activeTab === 'gallery' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <ImageIcon className="h-4 w-4" /> Gallery
            </button>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Info Columns */}
          <div className="lg:col-span-2 space-y-8">
            <AnimatePresence mode="wait">
              {activeTab === "about" ? (
                <motion.div
                  key="about"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-8 rounded-[40px] border border-zinc-800 bg-zinc-900/40 p-10 backdrop-blur-xl"
                >
                  <div className="grid gap-8 md:grid-cols-2">
                    <div className="space-y-4">
                      <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                        <Info className="h-3 w-3" /> Full Name
                      </label>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 h-14 px-6 text-sm font-bold focus:border-blue-500/50 focus:outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                        <Save className="h-3 w-3" /> Status
                      </label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as any)}
                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 h-14 px-6 text-sm font-bold focus:border-blue-500/50 focus:outline-none transition-all"
                      >
                        <option value="online">Available</option>
                        <option value="offline">Invisible</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-8 md:grid-cols-3">
                    <div className="space-y-4">
                      <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                        Age
                      </label>
                      <input
                        type="number"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 h-14 px-6 text-sm font-bold focus:border-blue-500/50 focus:outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                        Gender
                      </label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value as any)}
                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 h-14 px-6 text-sm font-bold focus:border-blue-500/50 focus:outline-none transition-all"
                      >
                        <option value="Secret">Secret</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-4">
                      <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                        Location
                      </label>
                      <input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 h-14 px-6 text-sm font-bold focus:border-blue-500/50 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-6 pt-4">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                       Social Connections
                    </label>
                    <div className="grid gap-4 md:grid-cols-2 text-zinc-400">
                       <div className="flex items-center gap-3 bg-zinc-950 p-4 rounded-2xl border border-zinc-800 text-zinc-400">
                          <Camera className="h-4 w-4" />
                          <input 
                            placeholder="Instagram username" 
                            className="bg-transparent text-sm focus:outline-none w-full" 
                            value={socialLinks.instagram}
                            onChange={(e) => setSocialLinks({...socialLinks, instagram: e.target.value})}
                          />
                       </div>
                       <div className="flex items-center gap-3 bg-zinc-950 p-4 rounded-2xl border border-zinc-800 text-zinc-400">
                          <Send className="h-4 w-4" />
                          <input 
                            placeholder="Twitter handle" 
                            className="bg-transparent text-sm focus:outline-none w-full" 
                            value={socialLinks.twitter}
                            onChange={(e) => setSocialLinks({...socialLinks, twitter: e.target.value})}
                          />
                       </div>
                       <div className="flex items-center gap-3 bg-zinc-950 p-4 rounded-2xl border border-zinc-800 text-zinc-400">
                          <Briefcase className="h-4 w-4" />
                          <input 
                            placeholder="LinkedIn URL" 
                            className="bg-transparent text-sm focus:outline-none w-full" 
                            value={socialLinks.linkedin}
                            onChange={(e) => setSocialLinks({...socialLinks, linkedin: e.target.value})}
                          />
                       </div>
                       <div className="flex items-center gap-3 bg-zinc-950 p-4 rounded-2xl border border-zinc-800 text-zinc-400">
                          <Code className="h-4 w-4" />
                          <input 
                            placeholder="GitHub username" 
                            className="bg-transparent text-sm focus:outline-none w-full" 
                            value={socialLinks.github}
                            onChange={(e) => setSocialLinks({...socialLinks, github: e.target.value})}
                          />
                       </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                    <LayoutDashboard className="h-3 w-3" /> Biography
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell the Nexora world about yourself..."
                      rows={4}
                      className="w-full rounded-3xl border border-zinc-800 bg-zinc-950 p-6 text-sm font-medium focus:border-blue-500/50 focus:outline-none transition-all resize-none"
                    />
                    <div className="flex justify-end">
                      <span className="text-[10px] text-zinc-500 bg-zinc-800 px-2 py-1 rounded-full uppercase font-bold tracking-tighter">
                        {bio.length} / 200
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-zinc-800 pt-8">
                    <div className="flex items-center gap-3">
                       <div className={`p-3 rounded-2xl transition-colors ${isPrivate ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>
                          {isPrivate ? <ShieldOff className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                       </div>
                       <div>
                          <p className="text-sm font-bold">{isPrivate ? 'Private Profile' : 'Public Profile'}</p>
                          <p className="text-xs text-zinc-500">{isPrivate ? 'Only friends can see your details.' : 'Everyone on Nexora can see your profile.'}</p>
                       </div>
                    </div>
                    <button 
                      onClick={() => setIsPrivate(!isPrivate)}
                      className={`h-8 w-14 rounded-full p-1 transition-all ${isPrivate ? 'bg-amber-500' : 'bg-zinc-800'}`}
                    >
                      <div className={`h-6 w-6 rounded-full bg-white transition-transform ${isPrivate ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={onUpdateProfile}
                      disabled={isSaving}
                      className="flex-1 rounded-2xl bg-white h-14 font-black text-black hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-2xl shadow-white/5"
                    >
                      Save Portfolio
                    </button>
                    <button
                       onClick={onDeleteAccount}
                       className="h-14 w-14 rounded-2xl bg-zinc-950 border border-red-500/30 flex items-center justify-center text-red-500 hover:bg-red-500/10 transition-all"
                    >
                       <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="gallery"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-8 rounded-[40px] border border-zinc-800 bg-zinc-900/40 p-10 backdrop-blur-xl"
                >
                  <div className="flex items-center justify-between">
                     <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
                        <ImageIcon className="h-6 w-6 text-blue-500" /> My Gallery
                     </h2>
                     <button 
                       onClick={() => galleryInputRef.current?.click()}
                       className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold transition-all hover:bg-blue-500"
                     >
                       <Plus className="h-4 w-4" /> Add Photos
                     </button>
                     <input 
                       ref={galleryInputRef} 
                       type="file" 
                       multiple 
                       className="hidden" 
                       onChange={(e) => {
                         if (e.target.files?.length) uploadMedia("gallery", e.target.files);
                       }} 
                     />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {user.gallery && user.gallery.length > 0 ? user.gallery.map((img: string, idx: number) => (
                      <div key={idx} className="group relative aspect-square overflow-hidden rounded-3xl bg-zinc-800 border border-zinc-800">
                        <img src={resolveMediaUrl(img)} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button 
                            onClick={() => removeFromGallery(img)}
                            className="h-10 w-10 rounded-xl bg-red-600 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
                          >
                             <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    )) : (
                      <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4">
                         <div className="h-20 w-20 rounded-[32px] bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-700">
                            <ImageIcon className="h-10 w-10" />
                         </div>
                         <p className="text-zinc-500 font-medium">No images uploaded yet.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Activity Column */}
          <div className="space-y-6">
             <div className="rounded-[40px] border border-zinc-800 bg-zinc-900/60 p-8 space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Quick Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-zinc-950 p-4 rounded-3xl border border-zinc-800">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase">Friends</p>
                      <p className="text-2xl font-black">{user.friends?.length || 0}</p>
                   </div>
                   <div className="bg-zinc-950 p-4 rounded-3xl border border-zinc-800">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase">Gallery</p>
                      <p className="text-2xl font-black">{user.gallery?.length || 0}</p>
                   </div>
                </div>
             </div>

             <div className="rounded-[40px] border border-zinc-800 bg-linear-to-br from-blue-600/10 to-purple-600/10 p-8">
                <h3 className="text-sm font-bold mb-4">Nexora Passport</h3>
                <p className="text-xs text-zinc-400 leading-relaxed mb-6">Your profile is your identity across the network. Keep it updated for better community discoverability.</p>
                <div className="flex items-center gap-4 text-xs font-black uppercase">
                   <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400">
                      <ShieldCheck className="h-5 w-5" />
                   </div>
                   Account Verified
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
