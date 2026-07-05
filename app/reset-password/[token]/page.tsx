"use client";

import { motion } from "framer-motion";
import { MessageSquare, Lock, ArrowRight, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import API from "@/lib/api";
import toast from "react-hot-toast";

export default function ResetPassword() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  const [formData, setFormData] = useState({ password: "", confirmPassword: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const res = await API.post(`/auth/reset-password/${token}`, {
        password: formData.password,
      });
      toast.success(res.data?.message || "Password reset successfully!");
      setIsSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to reset password. Link may be invalid or expired.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-chat-bg p-6 lg:p-12 selection:bg-chat-accent/35">
      {/* Floating Back to Login Button */}
      <Link 
        href="/login" 
        className="absolute left-6 top-6 z-20 flex items-center gap-2 rounded-xl bg-white/80 dark:bg-black/25 border border-black/10 dark:border-white/10 px-4 py-2 text-xs font-bold text-chat-muted hover:text-chat-text hover:scale-[1.03] active:scale-[0.97] transition-all shadow-sm backdrop-blur-md"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Login
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
          <h1 className="mb-1 text-3xl font-black tracking-tight text-transparent bg-gradient-to-r from-chat-text via-chat-text to-chat-accent bg-clip-text">
            New Password
          </h1>
          <p className="text-xs font-semibold text-chat-muted tracking-tight">
            {isSuccess 
              ? "Your password has been successfully updated." 
              : "Please enter your secure new password below."}
          </p>
        </div>

        {isSuccess ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center text-center space-y-4 py-4"
          >
            <CheckCircle className="h-16 w-16 text-chat-success animate-bounce" />
            <h3 className="text-sm font-bold text-chat-text">Reset Successful</h3>
            <p className="text-xs text-chat-muted">
              Redirecting you to the login screen in a few seconds...
            </p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="pl-2 text-[11px] font-black uppercase tracking-wider text-chat-muted">New Password</label>
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

            <div className="space-y-2">
              <label className="pl-2 text-[11px] font-black uppercase tracking-wider text-chat-muted">Confirm Password</label>
              <div className="group relative">
                <Lock className="absolute left-4.5 top-1/2 h-4 w-4 -translate-y-1/2 text-chat-muted transition-colors group-focus-within:text-chat-accent" />
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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
                  Update Password <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
