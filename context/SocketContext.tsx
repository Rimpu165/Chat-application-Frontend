"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

export interface IncomingCallData {
  signal: RTCSessionDescriptionInit;
  from: string;
  name: string;
  isVideo: boolean;
}

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: string[];
  globalIncomingCall: IncomingCallData | null;
  clearGlobalIncomingCall: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [globalIncomingCall, setGlobalIncomingCall] = useState<IncomingCallData | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user?._id) {
      const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000", {
        query: { userId: user._id },
      });

      setSocket(socketInstance);

      socketInstance.on("getOnlineUsers", (users: string[]) => {
        setOnlineUsers(users);
      });

      // Global incoming call listener — works from ANY page
      socketInstance.on("incomingCall", (data: IncomingCallData) => {
        setGlobalIncomingCall(data);
      });

      // Auto-clear if caller ends before answer
      socketInstance.on("callEnded", () => {
        setGlobalIncomingCall(null);
      });

      return () => {
        socketInstance.close();
        setSocket(null);
      };
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
  }, [user?._id]);

  const clearGlobalIncomingCall = () => setGlobalIncomingCall(null);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, globalIncomingCall, clearGlobalIncomingCall }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error("useSocket must be used within SocketProvider");
  return context;
};
