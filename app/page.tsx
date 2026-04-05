"use client";

import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { MessageSquare, Shield, Zap, ArrowRight, Settings } from "lucide-react";
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
    <div className="relative min-h-screen overflow-hidden bg-chat-bg">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -left-[10%] -top-[10%] h-[40%] w-[40%] rounded-full bg-chat-accent/15 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] h-[40%] w-[40%] rounded-full bg-teal-600/10 blur-[120px]" />
      </div>

      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between p-6">
        <div className="group flex cursor-pointer items-center gap-2">
          <div className="rounded-xl bg-chat-accent p-2 text-chat-bg shadow-lg shadow-chat-accent/25 transition-transform duration-300 group-hover:rotate-6">
            <MessageSquare className="h-6 w-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-chat-text">Nexora</span>
        </div>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="rounded-full px-5 py-2.5 text-sm font-medium text-chat-muted transition-colors hover:text-chat-text"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-chat-accent px-5 py-2.5 text-sm font-semibold text-chat-bg shadow-md shadow-chat-accent/20 transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Get started
          </Link>
        </div>
      </nav>

      <main className="relative z-10 mx-auto flex max-w-7xl flex-col items-center px-6 py-16 lg:py-28">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="mb-16 text-center"
        >
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-chat-border bg-chat-surface/80 px-4 py-1.5 text-xs font-medium text-chat-muted backdrop-blur-sm">
            <span className="h-2 w-2 animate-pulse rounded-full bg-chat-success" />
            Real-time · Socket.IO · JWT
          </div>
          <h1 className="mb-6 text-5xl font-bold leading-[1.08] tracking-tighter md:text-7xl lg:text-8xl">
            Chat that feels{" "}
            <span className="bg-gradient-to-r from-chat-accent via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              instant
            </span>
          </h1>
          <p className="mx-auto max-w-lg text-lg leading-relaxed text-chat-muted md:text-xl">
            Direct messages, groups, friend requests, calls, and live presence — all driven by your API, not mock data.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            <Link
              href="/signup"
              className="group flex h-14 items-center gap-2 rounded-2xl bg-chat-accent px-10 font-semibold text-chat-bg shadow-xl shadow-chat-accent/25 transition-all hover:opacity-95 active:scale-[0.98]"
            >
              Create account <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <p className="max-w-[200px] text-left text-xs leading-relaxed text-chat-muted">
              Connect your backend at <span className="font-mono text-chat-accent/90">localhost:5000</span> — same as production.
            </p>
          </div>
        </motion.div>

        <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-3">
          {[
            {
              icon: <Zap className="text-chat-accent" />,
              title: "Live sync",
              desc: "Rooms and previews update on every message via Socket.IO — no manual refresh.",
            },
            {
              icon: <Shield className="text-teal-400" />,
              title: "Secure sessions",
              desc: "JWT auth on every REST call; invalid sessions clear and return you to login.",
            },
            {
              icon: <Settings className="text-cyan-400" />,
              title: "Admin ready",
              desc: "Dashboard hooks into /api/admin for users, rooms, and roles.",
            },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              viewport={{ once: true }}
              className="rounded-3xl border border-chat-border bg-chat-surface/60 p-8 backdrop-blur-sm transition-colors hover:border-chat-accent/30"
            >
              <div className="mb-4 inline-block rounded-2xl bg-chat-raised p-3 transition-transform group-hover:scale-105">
                {feature.icon}
              </div>
              <h3 className="mb-2 text-xl font-semibold text-chat-text">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-chat-muted">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>

      <footer className="relative z-10 border-t border-chat-border py-10 px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm text-chat-muted md:flex-row">
          <p>© {new Date().getFullYear()} Nexora · Built for real backends</p>
          <div className="flex gap-8">
            <span className="text-chat-border">·</span>
            <span className="text-xs">REST + WebSockets</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
