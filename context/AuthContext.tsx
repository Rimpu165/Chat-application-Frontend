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
  coverPhoto?: string;
  bio?: string;
  status: "online" | "offline";
  isBlocked: boolean;
  isPrivate: boolean;
  gallery: string[];
  friends: string[];
  age?: number;
  gender: "Male" | "Female" | "Other" | "Secret";
  location?: string;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    github?: string;
    linkedin?: string;
  };
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (data: any) => Promise<void>;
  signup: (data: any, photoFile?: File | null) => Promise<void>;
  logout: () => void;
  updateUser: (data: any) => void;
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

    // Apply stored or default theme on mount
    const savedTheme = localStorage.getItem("theme") as "dark" | "light" | null;
    const initialTheme = savedTheme || "dark";
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(initialTheme);
    root.style.colorScheme = initialTheme;

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

  const signup = async (data: any, photoFile?: File | null) => {
    try {
      await API.post("/auth/signup", data);
      if (photoFile) {
        const loginRes = await API.post("/auth/login", {
          email: data.email,
          password: data.password,
        });
        const accessToken = loginRes.data.token;
        localStorage.setItem("token", accessToken);
        localStorage.setItem("user", JSON.stringify(loginRes.data.user));
        setToken(accessToken);
        setUser(loginRes.data.user);

        const formData = new FormData();
        formData.append("photo", photoFile);
        const uploadRes = await API.post("/users/profile-photo", formData, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const updatedUser = uploadRes.data?.user || loginRes.data.user;
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        toast.success("Account created with profile photo!");
        router.push("/chat");
        return;
      }

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
