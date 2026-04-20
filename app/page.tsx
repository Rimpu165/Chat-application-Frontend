"use client";

import { 
  MessageSquare, Shield, Zap, ArrowRight, Settings, 
  Users, LayoutGrid, Heart, Video, Phone, ShieldCheck,
  TrendingUp, Activity, UserPlus, Globe, Image as ImageIcon,
  Camera, Send, Briefcase, Mail, MapPin, Code
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { resolveMediaUrl } from "@/lib/utils";
import Logo from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";

export default function Home() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (loading) return (
    <div className="flex h-screen w-full items-center justify-center bg-chat-bg">
       <div className="h-10 w-10 animate-spin rounded-full border-4 border-chat-accent border-t-transparent" />
    </div>
  );

  // LOGGED IN DASHBOARD VIEW
  if (user) {
    return (
      <div className="min-h-screen bg-chat-bg text-chat-text overflow-x-hidden relative">
        <div className="absolute top-0 right-0 w-[50%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[30%] h-[40%] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none" />

        <main className="max-w-7xl mx-auto px-6 pt-32 pb-20">
           
           <header className="mb-12">
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-5xl md:text-7xl font-black tracking-tighter mb-4 text-chat-text"
              >
                Welcome back, <br/>
                <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">{user.name}</span>
              </motion.h1>
              <div className="flex flex-wrap gap-4 mt-8">
                 <Link href="/chat" className="flex items-center gap-3 px-8 h-14 rounded-3xl bg-blue-600 text-white font-black text-lg hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 active:scale-95 group">
                    <MessageSquare className="h-5 w-5 group-hover:rotate-12 transition-transform" /> Chat Now
                 </Link>
                 <Link href="/users" className="flex items-center gap-3 px-8 h-14 rounded-3xl bg-chat-raised border border-chat-border text-chat-text font-black text-lg hover:bg-chat-surface transition-all active:scale-95 group">
                    <Users className="h-5 w-5 group-hover:scale-110 transition-transform" /> Explore People
                 </Link>
              </div>
           </header>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Quick Links */}
              <Link href="/requests" className="lg:col-span-2 p-8 rounded-[40px] bg-chat-surface/40 border border-chat-border flex flex-col justify-between hover:border-chat-muted transition-all group overflow-hidden relative">
                 <div className="absolute top-0 right-0 p-8 text-chat-border group-hover:text-blue-500/20 transition-colors">
                    <UserPlus className="h-24 w-24" />
                 </div>
                 <div>
                    <h3 className="text-2xl font-bold mb-2">Network Requests</h3>
                    <p className="text-chat-muted text-sm font-medium">Manage your friend requests and connections.</p>
                 </div>
                 <div className="mt-8 flex items-center gap-2 text-blue-400 font-bold text-sm">
                    Go Manage <ArrowRight className="h-4 w-4" />
                 </div>
              </Link>

              <Link href="/groups" className="p-8 rounded-[40px] bg-chat-surface/40 border border-chat-border flex flex-col justify-between hover:border-chat-muted transition-all group grow">
                 <div className="bg-purple-500/10 p-3 rounded-2xl w-fit mb-6 text-purple-400">
                    <LayoutGrid className="h-6 w-6" />
                 </div>
                 <div>
                    <h3 className="text-xl font-bold">Communities</h3>
                    <p className="text-chat-muted text-xs mt-1">Join or start global groups.</p>
                 </div>
              </Link>

              <Link href="/profile" className="p-8 rounded-[40px] bg-chat-surface/40 border border-chat-border flex flex-col justify-between hover:border-chat-muted transition-all group grow">
                 <div className="bg-teal-500/10 p-3 rounded-2xl w-fit mb-6 text-teal-400">
                    <ImageIcon className="h-6 w-6" />
                 </div>
                 <div>
                    <h3 className="text-xl font-bold">Galleria</h3>
                    <p className="text-chat-muted text-xs mt-1">Manage your social showcase.</p>
                 </div>
              </Link>

              {/* Status Section */}
              <div className="lg:col-span-3 p-8 rounded-[40px] bg-blue-600/5 border border-blue-500/20 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-1">
                   <p className="text-xs font-black uppercase text-blue-400 tracking-widest">Network Status</p>
                   <p className="text-2xl font-bold leading-tight">Your Nexora presence is currently <span className="text-blue-300">Live</span></p>
                </div>
                <div className="flex flex-col justify-center">
                   <p className="text-chat-muted text-xs font-bold uppercase mb-1">Total Connections</p>
                   <p className="text-3xl font-black">{user.friends?.length || 0}</p>
                </div>
                <div className="flex flex-col justify-center">
                   <p className="text-chat-muted text-xs font-bold uppercase mb-1">Items in Gallery</p>
                   <p className="text-3xl font-black">{user.gallery?.length || 0}</p>
                </div>
              </div>

              <div className="p-8 rounded-[40px] bg-linear-to-br from-blue-600 to-indigo-600 text-white flex flex-col justify-center relative overflow-hidden active:scale-[0.98] cursor-pointer" onClick={() => router.push("/chat")}>
                 <div className="absolute -right-4 -bottom-4 opacity-10">
                    <Globe className="h-32 w-32" />
                 </div>
                 <h3 className="text-xl font-black mb-1">Chat Home</h3>
                 <p className="text-white/70 text-xs">Jump back into your messages.</p>
              </div>

           </div>
        </main>

        <footer className="border-t border-chat-surface bg-chat-bg/50 py-20 px-6">
           <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
              <div className="space-y-6">
                    <Logo size="md" showText />
                    <p className="text-chat-muted text-sm leading-relaxed">
                       The next generation of social networking. Real-time, secure, and built for discovery.
                    </p>
                    <div className="flex gap-4">
                       <button className="h-10 w-10 rounded-xl bg-chat-surface border border-chat-border flex items-center justify-center text-chat-muted hover:text-blue-400 transition-all">
                          <Camera className="h-5 w-5" />
                       </button>
                       <button className="h-10 w-10 rounded-xl bg-chat-surface border border-chat-border flex items-center justify-center text-chat-muted hover:text-blue-400 transition-all">
                          <Send className="h-5 w-5" />
                       </button>
                       <button className="h-10 w-10 rounded-xl bg-chat-surface border border-chat-border flex items-center justify-center text-chat-muted hover:text-blue-400 transition-all">
                          <Briefcase className="h-5 w-5" />
                       </button>
                    </div>
              </div>
              
              <div className="space-y-6">
                 <h4 className="text-sm font-black uppercase tracking-widest text-chat-text">Platform</h4>
                 <ul className="space-y-3 text-chat-muted text-sm font-medium">
                    <li className="hover:text-blue-400 cursor-pointer transition-colors">Global Chat</li>
                    <li className="hover:text-blue-400 cursor-pointer transition-colors">Shared Groups</li>
                    <li className="hover:text-blue-400 cursor-pointer transition-colors">Friend Engine</li>
                    <li className="hover:text-blue-400 cursor-pointer transition-colors">Media Galleria</li>
                 </ul>
              </div>

              <div className="space-y-6">
                 <h4 className="text-sm font-black uppercase tracking-widest text-chat-text">Resources</h4>
                 <ul className="space-y-3 text-chat-muted text-sm font-medium">
                    <li className="hover:text-blue-400 cursor-pointer transition-colors">Help Center</li>
                    <li className="hover:text-blue-400 cursor-pointer transition-colors">Privacy Policy</li>
                    <li className="hover:text-blue-400 cursor-pointer transition-colors">Terms of Service</li>
                    <li className="hover:text-blue-400 cursor-pointer transition-colors">Cookie Settings</li>
                 </ul>
              </div>

              <div className="space-y-6">
                 <h4 className="text-sm font-black uppercase tracking-widest text-chat-text">Contact</h4>
                 <ul className="space-y-3 text-chat-muted text-sm font-medium">
                    <li className="flex items-center gap-3"><Mail className="h-4 w-4" /> support@nexora.chat</li>
                    <li className="flex items-center gap-3"><MapPin className="h-4 w-4" /> Silicon Valley, CA</li>
                    <li className="flex items-center gap-3 font-bold text-blue-400 underline cursor-pointer">Live Status: Operational</li>
                 </ul>
              </div>
           </div>
           
           <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-chat-surface flex flex-col md:flex-row justify-between items-center gap-6">
              <p className="text-chat-muted text-xs font-bold uppercase tracking-widest">© {new Date().getFullYear()} NEXORA CHAT. ALL RIGHTS RESERVED.</p>
              <div className="flex gap-8 text-chat-muted text-xs font-bold">
                 <span>SECURED BY JWT</span>
                 <span>PULSE DISCOVERY</span>
              </div>
           </div>
        </footer>
      </div>
    );
  }

  // PUBLIC LANDING PAGE VIEW
  return (
    <div className="relative min-h-screen overflow-hidden bg-chat-bg flex flex-col">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -left-[10%] -top-[10%] h-[40%] w-[40%] rounded-full bg-chat-accent/15 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] h-[40%] w-[40%] rounded-full bg-teal-600/10 blur-[120px]" />
      </div>

      <nav className={`fixed inset-x-0 top-0 z-50 flex items-center justify-between px-8 py-6 transition-all ${scrolled ? 'bg-chat-bg/80 backdrop-blur-xl border-b border-chat-border' : ''}`}>
        <Logo size="md" showText />
        <div className="flex gap-3">
          <Link
            href="/login"
            className="rounded-full px-5 py-2.5 text-sm font-semibold text-chat-muted transition-colors hover:text-chat-text"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-chat-accent px-5 py-2.5 text-sm font-black tracking-tight text-chat-bg shadow-md shadow-chat-accent/20 transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Create account
          </Link>
        </div>
      </nav>

      <main className="relative z-10 mx-auto flex max-w-7xl flex-col items-center px-6 py-32 lg:py-48 flex-1">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="mb-16 text-center"
        >
          <div className="mb-10 inline-flex items-center gap-2 rounded-full border border-chat-border bg-chat-surface/50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-chat-muted backdrop-blur-sm">
            <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
            Social Engine 2.0
          </div>
          <h1 className="mb-6 text-6xl md:text-8xl lg:text-9xl font-black leading-[0.9] tracking-tighter">
            Instant <br />
            <span className="bg-gradient-to-r from-blue-400 via-teal-300 to-indigo-500 bg-clip-text text-transparent">
              Networking
            </span>
          </h1>
          <p className="mx-auto max-w-lg text-lg leading-relaxed text-chat-muted font-medium md:text-xl mt-6">
            Beyond just chat. Nexora provides premium social showcases, private galleries, and real-time community engines.
          </p>

          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            <Link
              href="/signup"
              className="group flex h-16 items-center gap-3 rounded-3xl bg-white px-10 font-black text-black shadow-2xl shadow-white/5 transition-all hover:opacity-90 active:scale-[0.98]"
            >
              Get Started <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
               href="/login"
               className="flex h-16 items-center px-10 rounded-3xl bg-chat-surface border border-chat-border font-black text-chat-text hover:bg-chat-raised transition-all"
            >
               Login
            </Link>
          </div>
        </motion.div>

        <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-3">
          {[
            {
              icon: <Zap className="text-blue-400" />,
              title: "Social Galleria",
              desc: "A dedicated space for your media. High quality, instant uploads, and private viewing controls.",
            },
            {
              icon: <Shield className="text-teal-400" />,
              title: "Privacy First",
              desc: "Togglable private profiles. You decide who sees your gallery and network stats.",
            },
            {
              icon: <Settings className="text-indigo-400" />,
              title: "Admin Panel",
              desc: "Full overview of network threads, active communities, and system-wide stats.",
            },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="rounded-[40px] border border-chat-border bg-chat-surface/40 p-10 backdrop-blur-sm transition-all hover:border-blue-500/30"
            >
              <div className="mb-6 inline-block rounded-2xl bg-chat-bg p-4 border border-chat-border">
                {feature.icon}
              </div>
              <h3 className="mb-3 text-2xl font-black tracking-tight text-chat-text">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-chat-muted font-medium">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>

      <footer className="border-t border-chat-surface bg-chat-bg/50 py-12 px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 text-sm text-chat-muted md:flex-row">
          <p className="font-bold uppercase tracking-widest text-[10px]">© {new Date().getFullYear()} Nexora · Engine v2.0</p>
          <div className="flex gap-8 font-black uppercase text-[10px]">
             <Camera className="h-4 w-4 hover:text-chat-text cursor-pointer" />
             <Send className="h-4 w-4 hover:text-chat-text cursor-pointer" />
             <Briefcase className="h-4 w-4 hover:text-chat-text cursor-pointer" />
             <Code className="h-4 w-4 hover:text-chat-text cursor-pointer" />
          </div>
        </div>
      </footer>
    </div>
  );
}

