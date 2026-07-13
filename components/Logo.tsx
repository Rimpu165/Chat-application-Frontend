"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
}

export default function Logo({ className, size = "md", showText = false }: LogoProps) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const sizes = {
    sm: "h-6 w-6 md:h-7 md:w-7",
    md: "h-8 w-8 md:h-9 md:w-9",
    lg: "h-12 w-12 md:h-14 md:w-14",
    xl: "h-20 w-20 md:h-24 md:w-24"
  };

  return (
    <div className={cn("flex items-center gap-2 group", className)}>
      <div className={cn(
        "relative rounded-xl overflow-hidden transition-all duration-500 group-hover:scale-105",
        sizes[size]
      )}>
        <img 
          src={isDark ? "/darktheme.png" : "/lighttheme.png"} 
          alt="Chatiq Logo" 
          className="h-full w-full object-contain"
          onError={(e) => {
            // Fallback to a nice gradient if images are missing
            (e.target as HTMLImageElement).style.display = 'none';
            const parent = (e.target as HTMLImageElement).parentElement!;
            parent.classList.add('bg-gradient-to-tr', 'from-blue-600', 'to-purple-600', 'flex', 'items-center', 'justify-center');
            parent.innerHTML = '<span class="text-white font-black">N</span>';
          }}
        />
      </div>
      {showText && (
        <span className={cn(
          "font-black tracking-tighter text-chat-text uppercase",
          size === "sm" ? "text-sm" : size === "md" ? "text-xl" : "text-3xl"
        )}>
          Chat<span className="text-chat-accent">iq</span>
        </span>
      )}
    </div>
  );
}
