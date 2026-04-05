"use client";

import { useAuth } from "@/context/AuthContext";
import API from "@/lib/api";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { 
  Users, 
  MessageSquare, 
  ShieldAlert, 
  Trash2, 
  Lock, 
  Unlock, 
  UserPlus, 
  Search,
  LayoutDashboard,
  Settings,
  LogOut,
  RefreshCcw,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface Stats {
  totalUsers: number;
  totalRooms: number;
  totalMessages: number;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  isBlocked: boolean;
  createdAt: string;
}

interface Room {
  _id: string;
  name?: string;
  isGroup: boolean;
  participants: any[];
  admin?: any;
  createdAt: string;
}

export default function AdminDashboard() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"users" | "rooms">("users");

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/login");
    } else if (user?.role === "admin") {
      fetchData();
    }
  }, [user, loading, router]);

  const fetchData = async () => {
    setIsDataLoading(true);
    try {
      const [statsRes, usersRes, roomsRes] = await Promise.all([
        API.get("/admin/stats"),
        API.get("/admin/users"),
        API.get("/admin/rooms")
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setRooms(roomsRes.data);
    } catch (err) {
      toast.error("Failed to load admin data");
    } finally {
      setIsDataLoading(false);
    }
  };


  const toggleBlock = async (userId: string) => {
    try {
      const res = await API.patch(`/admin/users/${userId}/block`);
      setUsers(users.map(u => u._id === userId ? { ...u, isBlocked: !u.isBlocked } : u));
      toast.success(res.data.message);
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const deleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await API.delete(`/admin/users/${userId}`);
      setUsers(users.filter(u => u._id !== userId));
      toast.success("User deleted");
      fetchData();
    } catch (err) {
      toast.error("Failed to delete user");
    }
  };

  const deleteRoom = async (roomId: string) => {
    if (!window.confirm("Are you sure you want to delete this room?")) return;
    try {
      await API.delete(`/admin/rooms/${roomId}`);
      setRooms(rooms.filter(r => r._id !== roomId));
      toast.success("Room deleted");
    } catch (err) {
      toast.error("Failed to delete room");
    }
  };

  const changeRole = async (userId: string, newRole: string) => {
    try {
      await API.patch(`/admin/users/${userId}/role`, { role: newRole });
      setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
      toast.success("Role updated");
    } catch (err) {
      toast.error("Failed to update role");
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRooms = rooms.filter(r => 
    (r.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    r.participants.some(p => (p.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()))
  );

  if (loading || !user) return null;

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col p-6 hidden lg:flex">
        <div className="flex items-center gap-3 mb-12">
          <div className="bg-blue-600 p-2 rounded-xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold">Admin Panel</span>
        </div>

        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => setActiveTab("users")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === "users" ? "bg-zinc-800 text-white font-medium" : "text-zinc-500 hover:bg-zinc-800/50 hover:text-white"
            }`}
          >
            <Users className="w-5 h-5" /> Users
          </button>
          <button 
             onClick={() => setActiveTab("rooms")}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
               activeTab === "rooms" ? "bg-zinc-800 text-white font-medium" : "text-zinc-500 hover:bg-zinc-800/50 hover:text-white"
             }`}
          >
            <MessageSquare className="w-5 h-5" /> Rooms
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-500 hover:bg-zinc-800/50 hover:text-white transition-all">
            <Settings className="w-5 h-5" /> Settings
          </button>
        </nav>

        <button 
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-all font-medium"
        >
          <LogOut className="w-5 h-5" /> Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-black p-6 md:p-10 relative">
        <div className="absolute top-0 right-0 w-[40%] h-[30%] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-6xl mx-auto">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2">System Overview</h1>
              <p className="text-zinc-500">Manage your application performance and users.</p>
            </div>
            <button 
              onClick={fetchData}
              className="flex items-center gap-2 px-6 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-zinc-700 transition-all"
            >
              <RefreshCcw className={`w-4 h-4 ${isDataLoading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </header>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { label: "Total Users", val: stats?.totalUsers || 0, icon: <Users className="text-blue-400" />, color: "blue" },
              { label: "Active Rooms", val: stats?.totalRooms || 0, icon: <MessageSquare className="text-purple-400" />, color: "purple" },
              { label: "Total Messages", val: stats?.totalMessages || 0, icon: <CheckCircle2 className="text-emerald-400" />, color: "emerald" }
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-2xl bg-${s.color}-500/10`}>
                    {s.icon}
                  </div>
                </div>
                <div className="text-4xl font-bold mb-1">{s.val}</div>
                <div className="text-zinc-500 font-medium">{s.label}</div>
              </motion.div>
            ))}
          </div>

          {/* List Section */}
          <section className="bg-zinc-900/30 border border-zinc-800 rounded-[32px] overflow-hidden backdrop-blur-md">
            <div className="p-8 border-b border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <h2 className="text-xl font-bold capitalize">{activeTab} Management</h2>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder={`Search ${activeTab}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-zinc-900/50 text-zinc-500 text-xs uppercase font-bold">
                  {activeTab === "users" ? (
                    <tr>
                      <th className="px-8 py-4">User</th>
                      <th className="px-8 py-4">Status</th>
                      <th className="px-8 py-4">Role</th>
                      <th className="px-8 py-4">Blocked</th>
                      <th className="px-8 py-4 text-right">Actions</th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="px-8 py-4">Room / Members</th>
                      <th className="px-8 py-4">Type</th>
                      <th className="px-8 py-4">Admin</th>
                      <th className="px-8 py-4">Created</th>
                      <th className="px-8 py-4 text-right">Actions</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {activeTab === "users" ? (
                    filteredUsers.map((u) => (
                      <tr key={u._id} className="group hover:bg-zinc-800/30 transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-zinc-400">
                              {u.name[0]}
                            </div>
                            <div>
                              <div className="font-semibold text-white">{u.name}</div>
                              <div className="text-xs text-zinc-500">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                           <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                             u.status === 'online' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-800 text-zinc-500'
                           }`}>
                             {u.status}
                           </span>
                        </td>
                        <td className="px-8 py-6">
                          <select 
                            value={u.role}
                            onChange={(e) => changeRole(u._id, e.target.value)}
                            className="bg-zinc-950 border border-zinc-800 rounded-lg text-xs py-1 px-2 focus:outline-none"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-8 py-6">
                          {u.isBlocked ? (
                            <span className="flex items-center gap-1 text-red-500 text-xs font-medium">
                              <XCircle className="w-3 h-3" /> Blocked
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-emerald-500 text-xs font-medium">
                              <CheckCircle2 className="w-3 h-3" /> Active
                            </span>
                          )}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => toggleBlock(u._id)}
                              title={u.isBlocked ? "Unblock" : "Block"}
                              className={`p-2 rounded-lg transition-colors ${
                                u.isBlocked ? 'text-emerald-400 hover:bg-emerald-400/10' : 'text-amber-400 hover:bg-amber-400/10'
                              }`}
                            >
                              {u.isBlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                            </button>
                            <button 
                              onClick={() => deleteUser(u._id)}
                              title="Delete"
                              className="p-2 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    filteredRooms.map((r) => (
                      <tr key={r._id} className="group hover:bg-zinc-800/30 transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center font-bold text-blue-400">
                              {r.isGroup ? r.name?.[0] : (r.participants[0]?.name?.[0] || "?")}
                            </div>
                            <div>
                               <div className="font-semibold text-white">
                                 {r.isGroup ? r.name : `${r.participants[0]?.name} & ${r.participants[1]?.name || '...'}`}
                               </div>
                               <div className="text-xs text-zinc-500">{r.participants.length} members</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                           <span className={cn(
                             "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                              r.isGroup ? "bg-purple-500/10 text-purple-400" : "bg-blue-500/10 text-blue-400"
                           )}>
                             {r.isGroup ? "Group" : "Direct"}
                           </span>
                        </td>
                        <td className="px-8 py-6 text-sm text-zinc-400">
                           {r.admin?.name || "System"}
                        </td>
                        <td className="px-8 py-6 text-xs text-zinc-500">
                           {new Date(r.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => deleteRoom(r._id)}
                              title="Delete Room"
                              className="p-2 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                  {((activeTab === "users" && filteredUsers.length === 0) || (activeTab === "rooms" && filteredRooms.length === 0)) && (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center text-zinc-600 font-medium">
                        No {activeTab} found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
