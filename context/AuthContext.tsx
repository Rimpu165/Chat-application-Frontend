"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import API from "@/lib/api";
import toast from "react-hot-toast";

interface User {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  profilePhoto?: string;
  status: "online" | "offline";
  isBlocked: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (data: any) => Promise<void>;
  signup: (data: any) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (data: any) => {
    try {
      const res = await API.post("/auth/login", data);
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      toast.success("Logged in successfully!");
      if (res.data.user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/chat");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Login failed");
      throw error;
    }
  };

  const signup = async (data: any) => {
    try {
      await API.post("/auth/signup", data);
      toast.success("Account created! Please login.");
      router.push("/login");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Signup failed");
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out");
    router.push("/login");
  };

  const updateUser = (data: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...data };
      setUser(updated);
      localStorage.setItem("user", JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, signup, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
