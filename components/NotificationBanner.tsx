"use client";

import { usePushNotification } from "@/hooks/usePushNotification";
import { Bell, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useState } from "react";

export default function NotificationBanner() {
  const { showBanner, subscribeUser, dismissBanner } = usePushNotification();
  const [loading, setLoading] = useState(false);

  const handleEnable = async () => {
    setLoading(true);
    const success = await subscribeUser();
    setLoading(false);
    if (success) {
      toast.success("Desktop alerts enabled!");
    } else {
      toast.error("Could not enable alerts. Please check browser settings.");
    }
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-6 right-6 z-[100] max-w-sm w-full bg-chat-surface/80 backdrop-blur-xl border border-chat-border/80 shadow-2xl p-5 rounded-2xl flex flex-col gap-4 overflow-hidden"
        >
          {/* Subtle Background Accent Glow */}
          <div className="absolute -top-10 -left-10 w-24 h-24 bg-chat-accent/10 rounded-full blur-2xl -z-10" />
          
          <div className="flex gap-4.5">
            <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-chat-accent/10 border border-chat-accent/20 text-chat-accent animate-pulse">
              <Bell className="w-5 h-5" />
            </div>
            
            <div className="flex flex-col gap-1 flex-1">
              <h4 className="text-sm font-black text-chat-text tracking-tight">
                Enable Notifications?
              </h4>
              <p className="text-xs text-chat-muted font-medium leading-normal">
                Receive instant alerts for new messages when the app is running in the background.
              </p>
            </div>

            <button
              onClick={dismissBanner}
              className="text-chat-muted hover:text-chat-text p-1 h-fit transition-colors rounded-lg hover:bg-chat-raised/50"
              title="Dismiss"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          <div className="flex items-center justify-end gap-2.5 mt-1 border-t border-chat-border/50 pt-3">
            <button
              onClick={dismissBanner}
              className="px-4 py-2 text-xs font-black rounded-xl border border-chat-border text-chat-text hover:bg-chat-raised/50 transition-all cursor-pointer"
            >
              Later
            </button>
            <button
              onClick={handleEnable}
              disabled={loading}
              className="px-4.5 py-2 text-xs font-black rounded-xl bg-chat-accent text-white hover:bg-chat-accent/90 transition-all cursor-pointer shadow-md shadow-chat-accent/20 flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>Enable Now</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
