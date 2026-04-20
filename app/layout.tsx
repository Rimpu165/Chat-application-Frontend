import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { SocketProvider } from "@/context/SocketContext";
import { Toaster } from "react-hot-toast";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nexora Chat - Real-Time Social Messaging",
  description: "Instagram-style social chat with calls, groups, and live messaging",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased bg-chat-bg text-chat-text`}
      >
        <AuthProvider>
          <SocketProvider>
            <Navbar />
            {children}
            <Toaster
              position="bottom-right"
              toastOptions={{
                className: "toast-nexora",
                duration: 3200,
              }}
            />
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
