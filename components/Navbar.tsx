"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { resolveMediaUrl } from "@/lib/utils";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import { 
  MessageSquare, Users, LayoutGrid, 
  Bell, Home, User, LogOut, ShieldAlert 
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Dashboard", href: "/", icon: <Home className="w-4 h-4" /> },
    { name: "Chat", href: "/chat", icon: <MessageSquare className="w-4 h-4" /> },
    { name: "People", href: "/users", icon: <Users className="w-4 h-4" /> },
    { name: "Communities", href: "/groups", icon: <LayoutGrid className="w-4 h-4" /> },
    { name: "Requests", href: "/requests", icon: <Bell className="w-4 h-4" /> },
  ];

  if (!user) return null;

  return (
    <nav className={cn(
      "fixed top-0 inset-x-0 z-[60] px-6 py-5 transition-all duration-500",
      scrolled 
        ? "bg-chat-surface/70 backdrop-blur-2xl border-b border-chat-border shadow-2xl py-3" 
        : "bg-gradient-to-b from-chat-bg via-chat-bg/80 to-transparent"
    )}>
      <div className="w-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="p-2 bg-chat-accent rounded-xl shadow-lg shadow-chat-accent/20 group-hover:rotate-6 transition-transform">
            <Logo size="sm" />
          </div>
          <span className="text-xl font-black tracking-tighter text-chat-text uppercase hidden sm:block">Nexora</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-2 bg-chat-surface/30 backdrop-blur-xl border border-chat-border/50 p-1.5 rounded-2xl shadow-inner">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all relative overflow-hidden group",
                  isActive ? "text-chat-text bg-chat-raised shadow-md" : "text-chat-muted hover:text-chat-text hover:bg-chat-surface/40"
                )}
              >
                <span className={cn("transition-transform group-hover:scale-110", isActive && "text-chat-accent")}>
                  {link.icon}
                </span>
                <span>{link.name}</span>
                {isActive && (
                  <motion.div 
                    layoutId="navbar-active"
                    className="absolute inset-0 bg-chat-accent/5 -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          
          <div className="h-8 w-[1px] bg-chat-border/50 mx-1 hidden sm:block" />

          {/* User Profile */}
          <div className="flex items-center gap-3">
             <Link href="/profile" className="flex items-center gap-3 p-1.5 rounded-2xl bg-chat-surface/50 border border-chat-border hover:border-chat-accent/50 transition-all group shadow-sm">
                <div className="h-9 w-9 rounded-xl overflow-hidden bg-chat-raised ring-2 ring-transparent group-hover:ring-chat-accent/30 transition-all">
                   {user.profilePhoto ? (
                     <img src={resolveMediaUrl(user.profilePhoto)} className="h-full w-full object-cover" alt="" />
                   ) : (
                     <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-chat-accent to-blue-600 text-white font-black text-xs uppercase">
                        {user.name[0]}
                     </div>
                   )}
                </div>
                <div className="hidden lg:block pr-2">
                   <p className="text-[12px] font-black text-chat-text leading-none">{user.name}</p>
                   <div className="flex items-center gap-1.5 mt-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-chat-success shadow-[0_0_5px_currentColor]" />
                      <p className="text-[9px] text-chat-muted font-bold uppercase tracking-wider">Active</p>
                   </div>
                </div>
             </Link>

             <button 
                onClick={logout} 
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-chat-raised/50 border border-chat-border text-red-500 hover:bg-red-500/10 transition-all shadow-sm"
             >
                <LogOut className="w-5 h-5" />
             </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
