"use client";

import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { MessageSquare, Lock, Mail, User, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function Signup() {
  const { signup } = useAuth();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signup(formData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 lg:p-12 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[40%] bg-purple-500/10 blur-[150px] rounded-full z-0" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 md:p-10 relative z-10 shadow-2xl backdrop-blur-xl"
      >
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="bg-gradient-to-tr from-purple-600 to-pink-600 p-3 rounded-2xl mb-4 shadow-lg shadow-purple-500/20">
            <MessageSquare className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Create Account</h1>
          <p className="text-zinc-500 text-sm">Join the most premium chat network</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400 pl-2">Full Name</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-purple-500 transition-colors w-5 h-5" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                placeholder="John Doe"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400 pl-2">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-purple-500 transition-colors w-5 h-5" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400 pl-2">Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-purple-500 transition-colors w-5 h-5" />
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            disabled={isLoading}
            className="w-full h-14 bg-white text-black font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-200 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-xl"
          >
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                Join Now <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-zinc-800 text-center">
          <p className="text-zinc-500 text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-white font-medium hover:underline">
              Log in instead
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
