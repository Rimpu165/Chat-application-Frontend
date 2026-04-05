"use client";

import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { MessageSquare, Lock, Mail, User, ArrowRight, Loader2, ImagePlus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function Signup() {
  const { signup } = useAuth();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-chat-bg p-6 lg:p-12">
      <div className="absolute left-1/2 top-0 z-0 h-[40%] w-[80%] -translate-x-1/2 rounded-full bg-teal-500/15 blur-[150px]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45 }}
        className="relative z-10 w-full max-w-md rounded-3xl border border-chat-border bg-chat-surface/90 p-8 shadow-2xl backdrop-blur-xl md:p-10"
      >
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="mb-4 rounded-2xl bg-linear-to-br from-chat-accent to-teal-600 p-3 text-chat-bg shadow-lg">
            <MessageSquare className="h-8 w-8" />
          </div>
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-chat-text">Create account</h1>
          <p className="text-sm text-chat-muted">Profile photo uploads to your API after signup</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="pl-2 text-sm font-medium text-chat-muted">Profile photo (optional)</label>
            <label className="flex w-full cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-chat-border bg-chat-bg/50 px-4 py-4 transition-colors hover:border-chat-accent/40">
              {photoPreview ? (
                <img src={photoPreview} alt="" className="h-12 w-12 rounded-xl object-cover" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-chat-raised">
                  <ImagePlus className="h-5 w-5 text-chat-muted" />
                </div>
              )}
              <div className="text-sm text-chat-muted">
                <p className="font-medium text-chat-text">Tap to upload</p>
                <p className="text-xs">JPG or PNG</p>
              </div>
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
          </div>

          <div className="space-y-2">
            <label className="pl-2 text-sm font-medium text-chat-muted">Name</label>
            <div className="group relative">
              <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-chat-muted transition-colors group-focus-within:text-chat-accent" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-2xl border border-chat-border bg-chat-bg/80 py-4 pl-12 pr-4 text-chat-text placeholder:text-chat-muted/70 focus:border-chat-accent/50 focus:outline-none focus:ring-2 focus:ring-chat-accent/25"
                placeholder="Your name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="pl-2 text-sm font-medium text-chat-muted">Email</label>
            <div className="group relative">
              <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-chat-muted transition-colors group-focus-within:text-chat-accent" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-2xl border border-chat-border bg-chat-bg/80 py-4 pl-12 pr-4 text-chat-text placeholder:text-chat-muted/70 focus:border-chat-accent/50 focus:outline-none focus:ring-2 focus:ring-chat-accent/25"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="pl-2 text-sm font-medium text-chat-muted">Password</label>
            <div className="group relative">
              <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-chat-muted transition-colors group-focus-within:text-chat-accent" />
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full rounded-2xl border border-chat-border bg-chat-bg/80 py-4 pl-12 pr-4 text-chat-text placeholder:text-chat-muted/70 focus:border-chat-accent/50 focus:outline-none focus:ring-2 focus:ring-chat-accent/25"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="group flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-chat-accent font-bold text-chat-bg shadow-lg shadow-chat-accent/20 transition-all hover:opacity-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                Continue <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-10 border-t border-chat-border pt-8 text-center">
          <p className="text-sm text-chat-muted">
            Already registered?{" "}
            <Link href="/login" className="font-medium text-chat-accent hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
