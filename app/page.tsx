"use client";

import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { MessageSquare, Shield, Zap, ArrowRight, User, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (user.role === "admin") router.push("/admin");
      else router.push("/chat");
    }
  }, [user, loading, router]);

  if (loading) return null;

  return (
    <div className="min-h-screen bg-zinc-950 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
      </div>

      <nav className="relative z-10 p-6 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="bg-gradient-to-tr from-blue-600 to-purple-600 p-2 rounded-xl group-hover:rotate-12 transition-transform duration-300">
            <MessageSquare className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-zinc-50 to-zinc-400">
            Aura Chat
          </span>
        </div>
        <div className="flex gap-4">
          <Link href="/login" className="px-6 py-2.5 rounded-full text-zinc-400 hover:text-white transition-colors">
            Login
          </Link>
          <Link href="/signup" className="px-6 py-2.5 rounded-full bg-white text-black font-medium hover:bg-zinc-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)]">
            Get Started
          </Link>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-20 lg:py-32 flex flex-col items-center">
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.6 }}
           className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-400 mb-8">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Empowering Modern Communication
          </div>
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 leading-[1.1]">
            Elevate Your <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
              Connections
            </span>
          </h1>
          <p className="max-w-xl mx-auto text-zinc-400 text-lg md:text-xl leading-relaxed">
            Experience real-time messaging with a premium touch. Secure, fast, and engineered for the future.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-12">
            <Link href="/signup" className="group h-14 px-10 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300">
              Start Chatting <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <div className="flex -space-x-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-zinc-950 bg-zinc-800" />
              ))}
              <div className="w-10 h-10 rounded-full border-2 border-zinc-950 bg-zinc-900 text-[10px] flex items-center justify-center text-zinc-400">
                +1k
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          {[
            { icon: <Zap className="text-blue-400" />, title: "Hyper-Fast", desc: "Instant real-time messaging powered by Socket.io" },
            { icon: <Shield className="text-purple-400" />, title: "Secure", desc: "End-to-end focus with JWT authentication" },
            { icon: <Settings className="text-pink-400" />, title: "Admin Tools", desc: "Comprehensive dashboard for system management" }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors group"
            >
              <div className="mb-4 p-3 rounded-2xl bg-zinc-800 inline-block group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>

      <footer className="relative z-10 border-t border-zinc-900 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-zinc-600 text-sm">
          <p>© 2024 Aura Chat Inc. All rights reserved.</p>
          <div className="flex gap-8 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
