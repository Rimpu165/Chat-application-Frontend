"use client";

import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
}

export default function Logo({ className, size = "md", showText = false }: LogoProps) {
  const sizes = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-20 w-20"
  };

  return (
    <div className={cn("flex items-center gap-3 group", className)}>
      <div className={cn(
        "relative rounded-2xl overflow-hidden transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3",
        sizes[size]
      )}>
        {/* We use logo.png from public folder. User should save their provided image as logo.png there. */}
        <img 
          src="/logo.png" 
          alt="Nexora Chat Logo" 
          className="h-full w-full object-cover"
          onError={(e) => {
            // Fallback to a nice gradient if logo.png is missing
            (e.target as HTMLImageElement).style.display = 'none';
            (e.target as HTMLImageElement).parentElement!.classList.add('bg-gradient-to-tr', 'from-blue-600', 'to-purple-600', 'flex', 'items-center', 'justify-center');
            (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-white font-black">N</span>';
          }}
        />
      </div>
      {showText && (
        <span className={cn(
          "font-black tracking-tighter text-chat-text uppercase",
          size === "sm" ? "text-sm" : size === "md" ? "text-xl" : "text-3xl"
        )}>
          Nexora <span className="text-chat-accent">Chat</span>
        </span>
      )}
    </div>
  );
}
