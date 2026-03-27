"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ChatSidebar from "@/components/ChatSidebar";
import ChatWindow from "@/components/ChatWindow";
import { Building2, Plus, MessageSquare, Zap, Shield, Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ChatPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [selectedRoom, setSelectedRoom] = useState<any>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) return null;

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      <div className="flex w-full h-full relative z-10 transition-all duration-500">
        
        {/* Main Sidebar Area */}
        <ChatSidebar 
          onSelectRoom={setSelectedRoom} 
          selectedRoomId={selectedRoom?._id}
        />

        {/* Dynamic Center/Right Area */}
        <div className="flex-1 flex flex-col h-full bg-black relative">
          <AnimatePresence mode="wait">
            {selectedRoom ? (
               <motion.div 
                 key={selectedRoom._id}
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -20 }}
                 transition={{ duration: 0.3, ease: "easeOut" }}
                 className="flex-1"
               >
                 <ChatWindow 
                   room={selectedRoom} 
                   onClose={() => setSelectedRoom(null)} 
                 />
               </motion.div>
            ) : (
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden"
               >
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
                 
                 <div className="relative mb-12 group">
                   <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-3xl blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
                   <div className="bg-zinc-900/50 backdrop-blur-3xl border border-zinc-800 p-8 rounded-3xl relative">
                     <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/20 group-hover:scale-110 group-hover:rotate-6 transition-transform">
                        <MessageSquare className="w-10 h-10 text-white" />
                     </div>
                     <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome, {user.name}</h1>
                     <p className="text-zinc-500 max-w-xs mx-auto text-sm leading-relaxed">
                       Aura keeps your conversations encrypted and lightning fast. Choose a chat to get started.
                     </p>
                   </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4 max-w-sm w-full relative">
                   <button className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all group flex flex-col items-center gap-3">
                      <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                        <Plus className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-zinc-400">New Direct</span>
                   </button>
                   <button className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all group flex flex-col items-center gap-3">
                      <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-zinc-400">Join Group</span>
                   </button>
                 </div>

                 <div className="mt-20 flex gap-8 text-zinc-700">
                    {[Zap, Shield, Bell].map((Icon, i) => (
                      <div key={i} className="flex flex-col items-center gap-2">
                        <Icon className="w-5 h-5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-800">Verified</span>
                      </div>
                    ))}
                 </div>
               </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
