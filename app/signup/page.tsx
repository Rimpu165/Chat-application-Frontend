"use client";
 
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { MessageSquare, Lock, Mail, User, ArrowRight, Loader2, ImagePlus, Plus, Camera, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
 
export default function Signup() {
  const { user, signup } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [isLoading, setIsLoading] = useState(false);
 
  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);
 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signup(formData, photoFile);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (user) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-chat-bg p-6 lg:p-12">
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div className="absolute -left-[10%] top-[10%] h-[40vh] w-[40vh] rounded-full bg-chat-accent/10 dark:bg-chat-accent/5 blur-[100px] animate-pulse" />
          <div className="absolute -right-[10%] bottom-[10%] h-[40vh] w-[40vh] rounded-full bg-teal-500/8 dark:bg-teal-500/4 blur-[100px] animate-pulse delay-1000" />
        </div>
        <div className="relative z-10 flex flex-col items-center text-center space-y-4">
          <div className="animate-bounce rounded-2xl bg-gradient-to-tr from-chat-accent via-indigo-500 to-purple-600 p-4 text-white shadow-lg shadow-chat-accent/25">
            <MessageSquare className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-transparent bg-gradient-to-r from-chat-text via-chat-text to-chat-accent bg-clip-text">
            Entering Chatiq...
          </h2>
          <div className="flex items-center gap-2 text-xs font-bold text-chat-muted">
            <Loader2 className="h-4 w-4 animate-spin text-chat-accent" />
            <span>Loading dashboard</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-chat-bg p-6 lg:p-12 selection:bg-chat-accent/35">
      {/* Floating Back to Home Button */}
      <Link 
        href="/" 
        className="absolute left-6 top-6 z-20 flex items-center gap-2 rounded-xl bg-white/80 dark:bg-black/25 border border-black/10 dark:border-white/10 px-4 py-2 text-xs font-bold text-chat-muted hover:text-chat-text hover:scale-[1.03] active:scale-[0.97] transition-all shadow-sm backdrop-blur-md"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Home
      </Link>
      {/* Radiant Moving Aura Blobs */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -left-[10%] top-[10%] h-[40vh] w-[40vh] rounded-full bg-chat-accent/10 dark:bg-chat-accent/5 blur-[100px] animate-pulse" />
        <div className="absolute -right-[10%] bottom-[10%] h-[40vh] w-[40vh] rounded-full bg-teal-500/8 dark:bg-teal-500/4 blur-[100px] animate-pulse delay-1000" />
      </div>
 
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45 }}
        className="relative z-10 w-full max-w-md rounded-[2.5rem] border border-black/10 dark:border-white/10 bg-white/95 dark:bg-black/40 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.04)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-2xl md:p-10"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-5 rounded-2xl bg-gradient-to-tr from-chat-accent via-indigo-500 to-purple-600 p-3.5 text-white shadow-lg shadow-chat-accent/25 hover:scale-105 transition-transform duration-300">
            <MessageSquare className="h-7 w-7" />
          </div>
          <h1 className="mb-1 text-3xl font-black tracking-tight text-transparent bg-gradient-to-r from-chat-text via-chat-text to-chat-accent bg-clip-text">Create account</h1>
          <p className="text-xs font-semibold text-chat-muted tracking-tight">Upload photo and fill details below</p>
        </div>
 
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center justify-center py-2">
            <div className="relative group w-24 h-24">
              <label className="flex w-full h-full cursor-pointer items-center justify-center rounded-full border border-dashed border-black/15 dark:border-white/15 bg-slate-50 dark:bg-white/5 hover:border-chat-accent/55 overflow-hidden transition-all duration-300 shadow-inner">
                {photoPreview ? (
                  <img src={photoPreview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-chat-muted hover:text-chat-accent transition-colors">
                    <Camera className="h-6 w-6" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setPhotoFile(file);
                    setPhotoPreview(file ? URL.createObjectURL(file) : "");
                  }}
                />
              </label>
              <div className="pointer-events-none absolute bottom-0 right-0 p-1.5 bg-chat-accent rounded-full text-white shadow-md">
                <Plus className="w-3.5 h-3.5" />
              </div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-chat-muted mt-2.5">Profile Photo (Optional)</span>
          </div>
 
          <div className="space-y-2">
            <label className="pl-2 text-[11px] font-black uppercase tracking-wider text-chat-muted">Name</label>
            <div className="group relative">
              <User className="absolute left-4.5 top-1/2 h-4 w-4 -translate-y-1/2 text-chat-muted transition-colors group-focus-within:text-chat-accent" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-2xl border border-black/10 dark:border-white/10 bg-slate-50 dark:bg-white/5 py-3.5 pl-12 pr-4 text-xs text-chat-text placeholder:text-chat-muted/60 focus:border-chat-accent/50 focus:bg-white dark:focus:bg-black/10 focus:outline-none transition-all duration-300"
                placeholder="Your name"
              />
            </div>
          </div>
 
          <div className="space-y-2">
            <label className="pl-2 text-[11px] font-black uppercase tracking-wider text-chat-muted">Email</label>
            <div className="group relative">
              <Mail className="absolute left-4.5 top-1/2 h-4 w-4 -translate-y-1/2 text-chat-muted transition-colors group-focus-within:text-chat-accent" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-2xl border border-black/10 dark:border-white/10 bg-slate-50 dark:bg-white/5 py-3.5 pl-12 pr-4 text-xs text-chat-text placeholder:text-chat-muted/60 focus:border-chat-accent/50 focus:bg-white dark:focus:bg-black/10 focus:outline-none transition-all duration-300"
                placeholder="you@example.com"
              />
            </div>
          </div>
 
          <div className="space-y-2">
            <label className="pl-2 text-[11px] font-black uppercase tracking-wider text-chat-muted">Password</label>
            <div className="group relative">
              <Lock className="absolute left-4.5 top-1/2 h-4 w-4 -translate-y-1/2 text-chat-muted transition-colors group-focus-within:text-chat-accent" />
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full rounded-2xl border border-black/10 dark:border-white/10 bg-slate-50 dark:bg-white/5 py-3.5 pl-12 pr-4 text-xs text-chat-text placeholder:text-chat-muted/60 focus:border-chat-accent/50 focus:bg-white dark:focus:bg-black/10 focus:outline-none transition-all duration-300"
                placeholder="••••••••"
              />
            </div>
          </div>
 
          <button
            type="submit"
            disabled={isLoading}
            className="group flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-chat-accent via-indigo-500 to-purple-600 font-bold text-white shadow-lg shadow-chat-accent/20 transition-all hover:translate-y-[-1px] hover:shadow-xl hover:shadow-chat-accent/25 active:translate-y-[1px] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                Continue <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>
 
        <div className="mt-8 border-t border-black/5 dark:border-white/5 pt-6 text-center">
          <p className="text-xs text-chat-muted font-medium">
            Already registered?{" "}
            <Link href="/login" className="font-bold text-chat-accent hover:underline transition-all">
              Log in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
