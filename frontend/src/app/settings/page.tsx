"use client";

import Link from "next/link";
import { useState, useEffect, useRef, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/useAuthStore";

export default function SettingsPage() {
  const router = useRouter();
  const { user, token, logout, setAuth } = useAuthStore();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileBio, setProfileBio] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState({ cur: false, new: false, con: false });

  const [selectedTheme, setSelectedTheme] = useState<"light" | "dark" | "system">("light");

  const [notifications, setNotifications] = useState({
    emailUpdates: true,
    emailSecurity: true,
    emailMarketing: false,
    pushChat: true,
    pushEnergy: true,
    pushNewFeatures: false,
    soundEnabled: true,
    desktopAlerts: false,
  });
  const [notifSaving, setNotifSaving] = useState(false);

  const [deleteModal, setDeleteModal] = useState(false);

  const [authReady, setAuthReady] = useState(false);
  useEffect(() => { setAuthReady(true); }, []);

  useEffect(() => {
    if (!authReady) return;
    if (!user) { router.push("/login"); return; }
    setProfileName(user.name || "");
    setProfileEmail(user.email || "");
    setProfileBio(user.bio || "");
    const savedTheme = localStorage.getItem("Atlas-theme") as "light" | "dark" | "system" | null;
    if (savedTheme) setSelectedTheme(savedTheme);
    const savedNotifs = localStorage.getItem("Atlas-notifications");
    if (savedNotifs) try { setNotifications(JSON.parse(savedNotifs)); } catch { /* use defaults */ }
  }, [authReady, user, router]);

  useEffect(() => { applyTheme(selectedTheme); }, [selectedTheme]);

  const applyTheme = (theme: "light" | "dark" | "system") => {
    localStorage.setItem("Atlas-theme", theme);
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else if (theme === "light") root.classList.remove("dark");
    else root.classList.toggle("dark", window.matchMedia("(prefers-color-scheme: dark)").matches);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put("/user/update-details", { name: profileName, email: profileEmail, bio: profileBio });
      setAuth(res.data.data, token!);
      toast.success("Profile updated");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally { setLoading(false); }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) { toast.error("Passwords don't match"); return; }
    if (newPassword.length < 6) { toast.error("Password must be 6+ characters"); return; }
    setLoading(true);
    try {
      await api.put("/user/update-password", { currentPassword, newPassword });
      toast.success("Password updated");
      setCurrentPassword(""); setNewPassword(""); setConfirmNewPassword("");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally { setLoading(false); }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Select an image"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be < 5MB"); return; }
    setAvatarUploading(true);
    const formData = new FormData();
    formData.append("avatar", file);
    try {
      const res = await api.post("/user/upload-avatar", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setAuth(res.data.data.user, token!);
      toast.success("Avatar updated");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      await api.delete("/user/delete-account");
      logout();
      toast.success("Account deleted");
      router.push("/register");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Delete failed");
    } finally { setLoading(false); setDeleteModal(false); }
  };

  const handleSignOut = () => { logout(); toast.success("Signed out"); router.push("/login"); };

  const toggleNotif = (key: string) => {
    setNotifications((prev) => {
      const updated = { ...prev, [key]: !prev[key as keyof typeof prev] };
      localStorage.setItem("Atlas-notifications", JSON.stringify(updated));
      return updated;
    });
  };

  const handleNotifSave = () => {
    setNotifSaving(true);
    localStorage.setItem("Atlas-notifications", JSON.stringify(notifications));
    setTimeout(() => { setNotifSaving(false); toast.success("Preferences saved"); }, 600);
  };

  const tabs = [
    { id: "profile", icon: "person", label: "Profile" },
    { id: "appearance", icon: "palette", label: "Appearance" },
    { id: "security", icon: "security", label: "Security" },
    { id: "notifications", icon: "notifications", label: "Notifications" },
  ];

  if (!authReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-border/60 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-10 relative overflow-hidden selection:bg-foreground selection:text-background">
      <Toaster position="top-center" toastOptions={{ style: { borderRadius: '16px', background: 'var(--background)', color: 'var(--foreground)', fontSize: '13px', fontWeight: 600, boxShadow: '0 8px 32px rgba(0,0,0,0.08)' } }} />

      {/* Ambient blurs */}
      <div className="fixed top-[-20%] right-[-10%] w-[500px] h-[500px] bg-foreground/[0.03] rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-foreground/[0.02] rounded-full blur-[100px] pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="max-w-[820px] mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <Link href="/chat" className="w-9 h-9 rounded-xl bg-background/70 border border-border flex items-center justify-center hover:bg-background hover:shadow-md transition-all group">
            <span className="material-symbols-outlined text-[18px] text-foreground/60 group-hover:text-foreground transition-transform group-hover:-translate-x-0.5">arrow_back</span>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Settings</h1>
            <p className="text-[11px] text-foreground/40 font-medium">Manage your Atlas experience</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Sidebar */}
          <aside className="w-full md:w-44 shrink-0">
            <nav className="flex md:flex-row lg:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-none">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="relative flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-semibold rounded-xl transition-all duration-300 shrink-0"
                >
                  {activeTab === tab.id && (
                    <motion.div layoutId="tab" className="absolute inset-0 bg-background shadow-[0_2px_8px_rgba(27,28,26,0.06)] border border-border rounded-xl" transition={{ type: "spring", bounce: 0.15, duration: 0.5 }} />
                  )}
                  <span className={`material-symbols-outlined text-[18px] relative z-10 transition-colors ${
                    activeTab === tab.id ? "text-foreground" : "text-foreground/35"
                  }`}>{tab.icon}</span>
                  <span className={`relative z-10 transition-colors ${
                    activeTab === tab.id ? "text-foreground" : "text-foreground/50"
                  }`}>{tab.label}</span>
                </button>
              ))}
            </nav>
            <div className="mt-6 pt-4 border-t border-border">
              <button onClick={handleSignOut} className="flex items-center gap-2.5 px-4 py-2 text-[12px] font-semibold text-red-400 hover:text-red-500 transition-colors w-full rounded-xl hover:bg-red-50/50">
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Sign out
              </button>
            </div>
          </aside>

          {/* Main */}
          <main className="flex-1 w-full min-h-[480px]">
            <AnimatePresence mode="wait">
              {activeTab === "profile" && (
                <motion.div key="profile" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }} className="space-y-6">
                  <form onSubmit={handleProfileUpdate}>
                    <div className="bg-background/60 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-border shadow-[0_8px_40px_rgba(27,28,26,0.04)]">
                      <div className="flex items-start justify-between mb-8 pb-6 border-b border-border">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-foreground to-foreground/80 flex items-center justify-center text-background shadow-lg">
                            <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'wght' 300" }}>badge</span>
                          </div>
                          <div>
                            <h2 className="text-lg font-bold tracking-tight">Personal Information</h2>
                            <p className="text-[12px] text-foreground/40 font-medium">Your public profile details</p>
                          </div>
                        </div>
                        {user?.provider && user.provider !== "email" && (
                          <span className="flex items-center gap-1.5 text-[10px] font-semibold px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-full capitalize text-blue-700">
                            <span className="material-symbols-outlined text-[12px]">{user.provider === "google" ? "google" : "github"}</span>
                            {user.provider}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row items-start gap-8 mb-8">
                        <div className="relative group shrink-0">
                          <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-foreground to-foreground/80 flex items-center justify-center shadow-lg ring-2 ring-white/80 transition-transform group-hover:scale-[1.03] duration-300">
                            {user?.avatarUrl ? (
                              <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="material-symbols-outlined text-[48px] text-white/80" style={{ fontVariationSettings: "'wght' 200" }}>account_circle</span>
                            )}
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center cursor-pointer">
                              <span className="material-symbols-outlined text-white text-2xl opacity-0 group-hover:opacity-100 transition-opacity">photo_camera</span>
                            </button>
                          </div>
                          <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-background rounded-xl border-2 border-background flex items-center justify-center shadow-md text-foreground">
                            <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'wght' 300" }}>add</span>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <h3 className="text-sm font-semibold">Profile photo</h3>
                          <p className="text-[12px] text-foreground/50 leading-relaxed max-w-[260px]">JPG, PNG or WebP. At least 400x400px. Max 5MB.</p>
                          <div className="flex gap-2.5 pt-2">
                            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={avatarUploading} className="text-[11px] font-semibold px-4 py-2 bg-foreground text-background rounded-xl hover:bg-foreground/90 transition-all disabled:opacity-50 shadow-sm">
                              {avatarUploading ? "Uploading…" : "Change"}
                            </button>
                            {user?.avatarUrl && (
                              <button type="button" onClick={async () => {
                                setAvatarUploading(true);
                                try { const r = await api.put("/user/update-details", { avatarUrl: "" }); setAuth(r.data.data, token!); toast.success("Avatar removed"); } catch { toast.error("Failed to remove"); } finally { setAvatarUploading(false); }
                              }} disabled={avatarUploading} className="text-[11px] font-semibold px-4 py-2 border border-border rounded-xl hover:bg-background/60 transition-all disabled:opacity-50">
                                Remove
                              </button>
                            )}
                          </div>
                          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                        <InputField label="Full name" value={profileName} onChange={(v) => setProfileName(v)} icon="person" />
                        <InputField label="Email address" type="email" value={profileEmail} onChange={(v) => setProfileEmail(v)} icon="mail" />
                      </div>
                      <div className="mb-6">
                        <label className="block text-[10px] font-semibold text-foreground/40 uppercase tracking-wider mb-1.5 ml-1">Bio</label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-4 top-4 text-foreground/20 text-[18px]">stylus</span>
                          <textarea rows={4} value={profileBio} onChange={(e) => setProfileBio(e.target.value)}
                            className="w-full bg-background/50 border border-border rounded-2xl px-11 py-3.5 text-sm outline-none focus:ring-4 focus:ring-foreground/10 focus:border-foreground/30 transition-all resize-none shadow-sm placeholder:text-foreground/20"
                            placeholder="Tell the world about yourself…" />
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button type="submit" disabled={loading}
                          className="px-7 py-3 bg-foreground text-background rounded-xl text-[13px] font-semibold hover:bg-foreground/90 transition-all shadow-lg active:scale-[0.97] disabled:opacity-50">
                          {loading ? "Saving…" : "Save changes"}
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* Delete */}
                  <div className="bg-red-50/40 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-red-100/50 shadow-[0_8px_40px_rgba(27,28,26,0.03)]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-red-100/60 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[20px] text-red-500">delete_forever</span>
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-red-700">Delete account</h3>
                          <p className="text-[12px] text-red-600/60 leading-relaxed max-w-[320px]">Permanently removes your account, chats, and all associated data.</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => setDeleteModal(true)}
                        className="px-5 py-2.5 bg-background text-red-600 border border-red-200 rounded-xl text-[12px] font-semibold hover:bg-red-600 hover:text-white hover:border-red-600 transition-all shadow-sm shrink-0">
                        Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "appearance" && (
                <motion.div key="appearance" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
                  <div className="bg-background/60 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-border shadow-[0_8px_40px_rgba(27,28,26,0.04)]">
                    <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[22px] text-purple-600" style={{ fontVariationSettings: "'wght' 300" }}>palette</span>
                      </div>
                      <div>
                        <h2 className="text-lg font-bold tracking-tight">Appearance</h2>
                        <p className="text-[12px] text-foreground/40 font-medium">Customize how Atlas looks for you</p>
                      </div>
                    </div>

                    <label className="block text-[10px] font-semibold text-foreground/40 uppercase tracking-wider mb-3 ml-1">Theme</label>
                    <div className="grid grid-cols-3 gap-3 mb-8">
                      {[
                        { id: "light" as const, label: "Light", sun: "left", desc: "Clean & bright" },
                        { id: "dark" as const, label: "Dark", sun: "right", desc: "Easy on eyes" },
                        { id: "system" as const, label: "System", sun: "auto", desc: "Follows device" },
                      ].map((t) => (
                        <button key={t.id} type="button" onClick={() => setSelectedTheme(t.id)}
                          className={`relative p-4 rounded-2xl border-2 transition-all duration-300 text-left ${
                            selectedTheme === t.id
                              ? "border-foreground bg-card shadow-md"
                              : "border-transparent bg-background/40 hover:bg-background/60 hover:border-border"
                          }`}>
                          <div className={`h-16 w-full rounded-xl mb-3 overflow-hidden ${
                            t.id === "dark" ? "bg-foreground" : "bg-background/80"
                          } border border-black/5 relative`}>
                            {t.id === "light" && (
                              <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-amber-300 shadow-sm" />
                            )}
                            {t.id === "dark" && (
                              <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-300 shadow-sm" />
                            )}
                            {t.id === "system" && (
                              <>
                                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-amber-300 shadow-sm" />
                                <div className="absolute bottom-2 left-2 w-3 h-3 rounded-full bg-blue-300 shadow-sm" />
                              </>
                            )}
                            <div className={`absolute bottom-2 ${t.id === "light" ? "left-2 right-8" : t.id === "dark" ? "left-2 right-4" : "left-2 right-8"} h-1.5 rounded-full ${t.id === "dark" ? "bg-white/20" : "bg-foreground/10"}`} />
                          </div>
                          <div className="text-[13px] font-bold text-foreground">{t.label}</div>
                          <div className="text-[10px] text-foreground/40 font-medium">{t.desc}</div>
                        </button>
                      ))}
                    </div>

                    <div className="flex justify-end">
                      <button type="button" onClick={() => toast.success("Theme applied")}
                        className="px-7 py-3 bg-foreground text-background rounded-xl text-[13px] font-semibold hover:bg-foreground/90 transition-all shadow-lg active:scale-[0.97]">
                        Apply
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "security" && (
                <motion.div key="security" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }} className="space-y-6">
                  {/* Auth card */}
                  <div className="bg-background/60 backdrop-blur-xl rounded-3xl border border-border shadow-[0_8px_40px_rgba(27,28,26,0.04)] overflow-hidden">
                    <div className="px-5 sm:px-8 pt-5 sm:pt-8 pb-4 sm:pb-5 border-b border-border">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-lg sm:text-[22px] text-indigo-600" style={{ fontVariationSettings: "'wght' 300" }}>key</span>
                        </div>
                        <div className="min-w-0">
                          <h2 className="text-base sm:text-lg font-bold tracking-tight">Authentication</h2>
                          <p className="text-[11px] sm:text-[12px] text-foreground/40 font-medium">Manage sign-in methods</p>
                        </div>
                      </div>
                    </div>

                    <div className="px-5 sm:px-8 py-4 sm:py-5 space-y-3 sm:space-y-4">
                      {/* Primary method */}
                      <div className="p-3 sm:p-4 rounded-2xl border">
                        {user?.provider && user.provider !== "email" ? (
                          <div className="flex items-center gap-3 sm:gap-4 bg-gradient-to-r from-emerald-50/60 to-green-50/30 border-emerald-100/60 -m-3 sm:-m-4 p-3 sm:p-4 rounded-2xl">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-background shadow-sm border border-emerald-100 flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined text-xl sm:text-[22px] text-emerald-600">
                                {user.provider === "google" ? "google" : "github"}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-sm font-bold text-emerald-900 capitalize">{user.provider}</h3>
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-emerald-200/60 text-emerald-700 uppercase tracking-wider shrink-0">Active</span>
                              </div>
                            </div>
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)] animate-pulse shrink-0 hidden sm:block" />
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 sm:gap-4 bg-gradient-to-r from-amber-50/60 to-orange-50/30 border-amber-100/60 -m-3 sm:-m-4 p-3 sm:p-4 rounded-2xl">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-background shadow-sm border border-amber-100 flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined text-xl sm:text-[22px] text-amber-600">mail</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-sm font-bold text-amber-900">Email &amp; Password</h3>
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-amber-200/60 text-amber-700 uppercase tracking-wider shrink-0">Primary</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Provider list */}
                      <div>
                        <div className="flex items-center gap-2 mb-2 sm:mb-3">
                          <div className="h-px flex-1 bg-foreground/5" />
                          <span className="text-[9px] font-semibold text-foreground/25 uppercase tracking-widest">Linked providers</span>
                          <div className="h-px flex-1 bg-foreground/5" />
                        </div>
                        <div className="space-y-2">
                          {[
                            { provider: "google", label: "Google", icon: "google" },
                            { provider: "github", label: "GitHub", icon: "github" },
                          ].map((p) => {
                            const isLinked = user?.linkedAccounts?.some((a: any) => a.provider === p.provider) || user?.provider === p.provider;
                            const isPrimary = user?.provider === p.provider;
                            return (
                              <div key={p.provider} className="flex items-center justify-between gap-2 p-3 sm:p-3.5 bg-background/40 hover:bg-background/70 rounded-2xl border border-border hover:border-border transition-all">
                                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-sm shrink-0">
                                    <span className="material-symbols-outlined text-base sm:text-xl text-gray-600">{p.icon}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs sm:text-[13px] font-semibold text-foreground">{p.label}</span>
                                    {isPrimary && <span className="text-[7px] sm:text-[8px] font-bold px-1 py-0.5 rounded bg-foreground/10 text-foreground/50 uppercase tracking-wider">Default</span>}
                                  </div>
                                </div>
                                <div className="shrink-0">
                                  {isLinked ? (
                                    isPrimary ? (
                                      <span className="text-[9px] sm:text-[10px] px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 font-medium">Active</span>
                                    ) : (
                                      <button onClick={async () => {
                                        try {
                                          await api.post(`/auth/unlink/${p.provider}`);
                                          const updated = await api.get("/auth/me");
                                          useAuthStore.getState().setAuth(updated.data.data, useAuthStore.getState().token!);
                                          toast.success(`${p.label} unlinked`);
                                        } catch (err: any) {
                                          toast.error(err.response?.data?.message || "Failed to unlink");
                                        }
                                      }} className="text-[10px] sm:text-[11px] font-semibold px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl bg-background text-red-500 border border-red-200 hover:bg-red-50 hover:border-red-300 transition-all">
                                        Unlink
                                      </button>
                                    )
                                  ) : (
                                    <a href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}/api/auth/link/${p.provider}`}
                                      className="text-[10px] sm:text-[11px] font-semibold px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl bg-foreground/5 text-foreground hover:bg-foreground/10 hover:shadow-sm border border-transparent transition-all">
                                      Connect
                                    </a>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Password card */}
                  {(!user?.provider || user.provider === "email") && (
                    <form onSubmit={handlePasswordUpdate}>
                      <div className="bg-background/60 backdrop-blur-xl rounded-3xl border border-border shadow-[0_8px_40px_rgba(27,28,26,0.04)] overflow-hidden">
                        <div className="px-5 sm:px-8 pt-5 sm:pt-8 pb-4 sm:pb-5 border-b border-border">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined text-lg sm:text-[22px] text-amber-600" style={{ fontVariationSettings: "'wght' 300" }}>lock</span>
                            </div>
                            <div className="min-w-0">
                              <h2 className="text-base sm:text-lg font-bold tracking-tight">Change Password</h2>
                              <p className="text-[11px] sm:text-[12px] text-foreground/40 font-medium">At least 6 characters</p>
                            </div>
                          </div>
                        </div>

                        <div className="px-5 sm:px-8 py-4 sm:py-6 space-y-4 sm:space-y-5">
                          <div>
                            <label className="block text-[10px] font-semibold text-foreground/40 uppercase tracking-wider mb-1 sm:mb-1.5 ml-1">Current password</label>
                            <div className="relative">
                              <span className="material-symbols-outlined absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-foreground/20 text-base sm:text-lg pointer-events-none">lock_open</span>
                              <input type={showPassword.cur ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full bg-background/50 border border-border rounded-2xl px-9 sm:px-11 py-3 sm:py-3.5 text-sm outline-none focus:ring-4 focus:ring-foreground/10 focus:border-foreground/30 transition-all shadow-sm" />
                              <button type="button" onClick={() => setShowPassword(p => ({ ...p, cur: !p.cur }))}
                                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 text-foreground/20 hover:text-foreground/50 transition-colors">
                                <span className="material-symbols-outlined text-base sm:text-lg">{showPassword.cur ? "visibility_off" : "visibility"}</span>
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-foreground/40 uppercase tracking-wider mb-1 sm:mb-1.5 ml-1">New password</label>
                            <div className="relative">
                              <span className="material-symbols-outlined absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-foreground/20 text-base sm:text-lg pointer-events-none">lock</span>
                              <input type={showPassword.new ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full bg-background/50 border border-border rounded-2xl px-9 sm:px-11 py-3 sm:py-3.5 text-sm outline-none focus:ring-4 focus:ring-foreground/10 focus:border-foreground/30 transition-all shadow-sm" />
                              <button type="button" onClick={() => setShowPassword(p => ({ ...p, new: !p.new }))}
                                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 text-foreground/20 hover:text-foreground/50 transition-colors">
                                <span className="material-symbols-outlined text-base sm:text-lg">{showPassword.new ? "visibility_off" : "visibility"}</span>
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-foreground/40 uppercase tracking-wider mb-1 sm:mb-1.5 ml-1">Confirm new password</label>
                            <div className="relative">
                              <span className="material-symbols-outlined absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-foreground/20 text-base sm:text-lg pointer-events-none">verified_user</span>
                              <input type={showPassword.con ? "text" : "password"} value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)}
                                className="w-full bg-background/50 border border-border rounded-2xl px-9 sm:px-11 py-3 sm:py-3.5 text-sm outline-none focus:ring-4 focus:ring-foreground/10 focus:border-foreground/30 transition-all shadow-sm" />
                              <button type="button" onClick={() => setShowPassword(p => ({ ...p, con: !p.con }))}
                                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 text-foreground/20 hover:text-foreground/50 transition-colors">
                                <span className="material-symbols-outlined text-base sm:text-lg">{showPassword.con ? "visibility_off" : "visibility"}</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="px-5 sm:px-8 pb-5 sm:pb-8 flex justify-end border-t border-border pt-4 sm:pt-5">
                          <button type="submit" disabled={loading}
                            className="px-6 sm:px-7 py-2.5 sm:py-3 bg-foreground text-background rounded-xl text-xs sm:text-[13px] font-semibold hover:bg-foreground/90 transition-all shadow-lg active:scale-[0.97] disabled:opacity-50">
                            {loading ? "Updating\u2026" : "Update password"}
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </motion.div>
              )}

              {activeTab === "notifications" && (
                <motion.div key="notifications" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
                  <div className="bg-background/60 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-border shadow-[0_8px_40px_rgba(27,28,26,0.04)]">
                    <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500/20 to-indigo-500/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[22px] text-sky-600" style={{ fontVariationSettings: "'wght' 300" }}>notifications</span>
                      </div>
                      <div>
                        <h2 className="text-lg font-bold tracking-tight">Notifications</h2>
                        <p className="text-[12px] text-foreground/40 font-medium">Control how Atlas reaches you</p>
                      </div>
                    </div>

                    <div className="space-y-8">
                      {/* Email */}
                      <Section label="Email" icon="mail">
                        {[
                          { key: "emailUpdates", label: "Account updates", desc: "Password changes, security alerts" },
                          { key: "emailSecurity", label: "Security alerts", desc: "New device or location logins" },
                          { key: "emailMarketing", label: "Product updates", desc: "New features, tips, and news" },
                        ].map((item) => (
                          <Toggle key={item.key} checked={notifications[item.key as keyof typeof notifications]} onChange={() => toggleNotif(item.key)} label={item.label} desc={item.desc} />
                        ))}
                      </Section>

                      {/* Push */}
                      <Section label="In-app" icon="smartphone">
                        {[
                          { key: "pushChat", label: "Chat responses", desc: "When AI finishes generating" },
                          { key: "pushEnergy", label: "Energy warnings", desc: "When energy drops below 20%" },
                          { key: "pushNewFeatures", label: "Feature announcements", desc: "New Atlas capabilities" },
                        ].map((item) => (
                          <Toggle key={item.key} checked={notifications[item.key as keyof typeof notifications]} onChange={() => toggleNotif(item.key)} label={item.label} desc={item.desc} />
                        ))}
                      </Section>

                      {/* System */}
                      <Section label="System" icon="settings">
                        {[
                          { key: "soundEnabled", label: "Sound effects", desc: "Play sounds for messages" },
                          { key: "desktopAlerts", label: "Desktop notifications", desc: "Browser alerts when in background" },
                        ].map((item) => (
                          <Toggle key={item.key} checked={notifications[item.key as keyof typeof notifications]} onChange={() => toggleNotif(item.key)} label={item.label} desc={item.desc} />
                        ))}
                      </Section>

                      <div className="flex justify-end pt-2">
                        <button type="button" onClick={handleNotifSave} disabled={notifSaving}
                          className="px-7 py-3 bg-foreground text-background rounded-xl text-[13px] font-semibold hover:bg-foreground/90 transition-all shadow-lg active:scale-[0.97] disabled:opacity-50">
                          {notifSaving ? "Saving…" : "Save preferences"}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </motion.div>

      {/* Delete Modal */}
      <AnimatePresence>
        {deleteModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={() => setDeleteModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }} transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
              onClick={(e) => e.stopPropagation()} className="bg-background rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl border border-red-100/50">
              <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center mb-4 mx-auto">
                <span className="material-symbols-outlined text-[24px] text-red-500">warning</span>
              </div>
              <h3 className="text-lg font-bold text-center mb-2">Delete account?</h3>
              <p className="text-[13px] text-foreground/50 text-center leading-relaxed mb-6">This action is irreversible. All your data, chats, and generations will be permanently erased.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteModal(false)} className="flex-1 py-3 border border-border rounded-xl text-[13px] font-semibold hover:bg-foreground/5 transition-all">Cancel</button>
                <button onClick={handleDeleteAccount} disabled={loading} className="flex-1 py-3 bg-red-600 text-white rounded-xl text-[13px] font-semibold hover:bg-red-700 transition-all disabled:opacity-50 shadow-lg">
                  {loading ? "Deleting…" : "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Sub-components ── */

function InputField({ label, value, onChange, icon, type = "text" }: { label: string; value: string; onChange: (v: string) => void; icon: string; type?: string }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-foreground/40 uppercase tracking-wider mb-1.5 ml-1">{label}</label>
      <div className="relative">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-foreground/20 text-[18px]">{icon}</span>
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full bg-background/50 border border-border rounded-2xl px-11 py-3.5 text-sm outline-none focus:ring-4 focus:ring-foreground/10 focus:border-foreground/30 transition-all shadow-sm placeholder:text-foreground/20" />
      </div>
    </div>
  );
}

function Section({ label, icon, children }: { label: string; icon: string; children: ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="material-symbols-outlined text-[16px] text-foreground/30">{icon}</span>
        <span className="text-[10px] font-semibold text-foreground/40 uppercase tracking-wider">{label}</span>
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange, label, desc }: { checked: boolean; onChange: () => void; label: string; desc: string }) {
  return (
    <div className="flex items-center justify-between p-3.5 bg-background/50 rounded-2xl border border-border hover:bg-white/70 transition-all">
      <div className="flex-1 pr-3">
        <p className="text-[13px] font-semibold text-foreground">{label}</p>
        <p className="text-[11px] text-foreground/45 leading-relaxed">{desc}</p>
      </div>
      <button type="button" onClick={onChange}
        className={`relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${
          checked ? "bg-foreground" : "bg-foreground/10"
        }`}>
        <motion.span
          animate={{ x: checked ? 20 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute top-0.5 left-0.5 w-5 h-5 bg-background rounded-full shadow-md"
        />
      </button>
    </div>
  );
}
