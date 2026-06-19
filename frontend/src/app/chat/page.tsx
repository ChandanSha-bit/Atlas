"use client";

import { useState, useEffect, useRef, useCallback } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import toast, { Toaster } from "react-hot-toast";

import api from "@/lib/axios";

import { useAuthStore } from "@/store/useAuthStore";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  role: "user" | "assistant";
  content: string;
  type?: "text" | "image";
  imageUrl?: string;
}

interface Chat {
  _id: string;
  title?: string;
  messages: Message[];
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<Chat[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState("");

  // Mobile sidebar state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Pagination state
  const [historyPage, setHistoryPage] = useState(1);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Image generation state
  const [showImageModal, setShowImageModal] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageSize, setImageSize] = useState<"1024x1024" | "1024x1792" | "1792x1024">("1024x1024");
  const [imageQuality, setImageQuality] = useState<"standard" | "hd">("standard");
  const [imageGenerating, setImageGenerating] = useState(false);

  // Delete confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveMenuId(null);
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileSidebarOpen]);

  // --- RESIZABLE SIDEBAR STATES & HANDLERS ---
  const [sidebarWidth, setSidebarWidth] = useState(208);
  const [isResizing, setIsResizing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const startResizing = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const newWidth = e.clientX;
      if (newWidth < 100) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
        const clampedWidth = Math.max(150, Math.min(newWidth, 380));
        setSidebarWidth(clampedWidth);
      }
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
    }
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  // --- REFS & HOOKS ---
  const bottomRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user } = useAuthStore();

  // --- ROUTE PROTECTION ---
  const [authReady, setAuthReady] = useState(false);
  useEffect(() => { setAuthReady(true); }, []);
  useEffect(() => {
    if (authReady && !user) {
      router.push("/login");
    }
  }, [authReady, user, router]);

  // --- LOAD CHAT HISTORY (On Mount + Pagination) ---
  const fetchHistory = useCallback(async (page = 1, append = false) => {
    if (loadingHistory) return;
    setLoadingHistory(true);
    try {
      const res = await api.get(`/chat?page=${page}&limit=30`);
      const { data, totalPages } = res.data;
      setChatHistory(prev => append ? [...prev, ...data] : data);
      setHistoryPage(page);
      setHasMoreHistory(page < totalPages);
    } catch {
      // Silently fail
    } finally {
      setLoadingHistory(false);
    }
  }, [loadingHistory]);

  const loadMoreHistory = useCallback(() => {
    if (!loadingHistory && hasMoreHistory) {
      fetchHistory(historyPage + 1, true);
    }
  }, [loadingHistory, hasMoreHistory, historyPage, fetchHistory]);

  useEffect(() => {
    if (user) fetchHistory(1);
  }, [user, fetchHistory]);

  // --- AUTO-SCROLL ---
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- SEND MESSAGE HANDLER ---
  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.post("/chat", {
        message: userMessage.content,
        chatId: chatId,
      });

      const updatedChat = res.data.data;
      setMessages(updatedChat.messages);
      setChatId(updatedChat._id);

      if (res.data.energy !== undefined) {
        useAuthStore.getState().updateEnergy(res.data.energy);
      }

      setChatHistory((prev) => {
        const exists = prev.find((c) => c._id === updatedChat._id);
        if (!exists) return [updatedChat, ...prev];
        return prev;
      });

    } catch (error: any) {
      console.error('Chat request failed:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Neural link failed. Please try again.';
      toast.error(errorMessage);
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  // --- IMAGE GENERATION HANDLER ---
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim() || imageGenerating) return;

    setImageGenerating(true);
    try {
      const res = await api.post("/images/generate", {
        prompt: imagePrompt,
        size: imageSize,
        quality: imageQuality,
      });

      const imageUrl = res.data.data;

      const userMsg: Message = { role: "user", content: imagePrompt };
      const imageMsg: Message = { role: "assistant", content: "Generated image", type: "image", imageUrl };

      setMessages((prev) => [...prev, userMsg, imageMsg]);

      // Save image messages to backend without triggering AI response
      if (chatId) {
        await api.post("/chat/save-image", { prompt: imagePrompt, imageUrl, chatId });
      }

      if (res.data.energy !== undefined) {
        useAuthStore.getState().updateEnergy(res.data.energy);
      }

      setShowImageModal(false);
      setImagePrompt("");
      toast.success("Image generated successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to generate image");
    } finally {
      setImageGenerating(false);
    }
  };

  // --- KEYBOARD HANDLER ---
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // --- IMAGE MODAL KEYBOARD HANDLER ---
  const handleImageKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenerateImage();
    }
  };

  // --- NEW CHAT ---
  const handleNewChat = () => {
    setMessages([]);
    setChatId(null);
    setInput("");
    setMobileSidebarOpen(false);
  };

  // --- SELECT CHAT ---
  const handleSelectChat = (chat: Chat) => {
    setMessages(chat.messages);
    setChatId(chat._id);
    setMobileSidebarOpen(false);
  };

  // --- RENAME CHAT ---
  const handleRenameConfirm = async (id: string) => {
    const trimmed = renameTitle.trim();
    if (!trimmed) {
      setRenamingId(null);
      return;
    }
    try {
      const res = await api.put(`/chat/${id}`, { title: trimmed });
      setChatHistory((prev) =>
        prev.map((c) => (c._id === id ? { ...c, title: res.data.data.title } : c))
      );
      toast.success("Conversation renamed.");
    } catch {
      toast.error("Failed to rename conversation.");
    } finally {
      setRenamingId(null);
    }
  };

  // --- DELETE CHAT ---
  const handleDeleteChat = async (id: string) => {
    try {
      await api.delete(`/chat/${id}`);
      setChatHistory(prev => prev.filter(c => c._id !== id));
      if (chatId === id) handleNewChat();
      toast.success('Conversation deleted.');
    } catch {
      toast.error('Failed to delete conversation.');
    }
  };

  const confirmDelete = (id: string) => {
    setActiveMenuId(null);
    setDeleteConfirmId(id);
  };

  // --- SIDEBAR CONTENT ---
  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <>
      <div className="flex items-center gap-2.5 mb-6 px-2">
        <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>spa</span>
        </div>
        <div className="min-w-0">
          <h1 className="font-headline-sm text-[18px] text-foreground font-medium leading-tight truncate">Axiora</h1>
          <p className="font-label-sm text-[11px] text-on-surface-variant">Creative Partner</p>
        </div>
        {isMobile && (
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="ml-auto p-1 text-on-surface-variant hover:text-foreground transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        )}
      </div>

      <button
        onClick={handleNewChat}
        className="w-full mb-6 py-2.5 px-3 bg-foreground text-background rounded-xl font-label-md text-sm flex items-center justify-center gap-2 hover:bg-foreground/90 transition-all duration-300 shadow-sm"
      >
        <span className="material-symbols-outlined text-[20px]">add_box</span>
        New Chat
      </button>

      <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-1">
        <p className="px-2 mb-1.5 font-label-sm text-[11px] text-outline uppercase tracking-wider">History</p>
        {chatHistory.length === 0 && loadingHistory && (
          <div className="flex items-center gap-2 px-2 py-3">
            <span className="w-1.5 h-1.5 rounded-full bg-foreground/30 animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-foreground/30 animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-foreground/30 animate-bounce [animation-delay:300ms]" />
          </div>
        )}
        {chatHistory.length === 0 && !loadingHistory && (
          <p className="px-2 text-[12px] text-on-surface-variant/50 italic">No conversations yet.</p>
        )}
        {chatHistory.map((chat) => (
          <div
            key={chat._id}
            className={`group relative flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
              chatId === chat._id
                ? "bg-surface-container-high/50 text-on-surface"
                : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
            }`}
            onClick={() => {
              if (renamingId !== chat._id) {
                handleSelectChat(chat);
              }
            }}
          >
            <span className="material-symbols-outlined text-[16px] flex-shrink-0">chat_bubble_outline</span>

            {renamingId === chat._id ? (
              <input
                type="text"
                value={renameTitle}
                onChange={(e) => setRenameTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRenameConfirm(chat._id);
                  if (e.key === "Escape") setRenamingId(null);
                }}
                onBlur={() => handleRenameConfirm(chat._id)}
                className="bg-background border border-outline/35 rounded px-1.5 py-0.5 text-[11px] w-full text-on-surface outline-none focus:border-foreground focus:ring-1 focus:ring-foreground/10"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <>
                <span className="truncate text-[12px] flex-1">
                  {chat.title || chat.messages[0]?.content.slice(0, 26) || "New Conversation"}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuId(activeMenuId === chat._id ? null : chat._id);
                  }}
                  title="Options"
                  className="flex-shrink-0 p-1.5 md:p-0.5 rounded-md transition-all duration-200 md:opacity-0 md:group-hover:opacity-100 opacity-100 text-on-surface-variant hover:text-foreground hover:bg-background/60"
                >
                  <span className="material-symbols-outlined text-[15px] font-bold">more_horiz</span>
                </button>

                {activeMenuId === chat._id && (
                  <div
                    className="absolute right-1 top-8 z-50 min-w-[130px] bg-background/80 backdrop-blur-xl border border-border shadow-[0_8px_30px_-8px_rgba(27,48,34,0.12)] rounded-xl py-1 flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => {
                        setRenamingId(chat._id);
                        setRenameTitle(chat.title || chat.messages[0]?.content || "New Conversation");
                        setActiveMenuId(null);
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-[12px] text-on-surface hover:bg-foreground/5 transition-colors w-full text-left font-medium rounded-lg"
                    >
                      <span className="material-symbols-outlined text-[15px] text-on-surface-variant">edit</span>
                      Rename
                    </button>
                    <div className="h-px bg-outline/10 mx-2" />
                    <button
                      onClick={() => confirmDelete(chat._id)}
                      className="flex items-center gap-2 px-3 py-2 text-[12px] text-red-600 hover:bg-red-50 transition-colors w-full text-left font-medium rounded-lg"
                    >
                      <span className="material-symbols-outlined text-[15px]">delete</span>
                      Delete
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}

        {hasMoreHistory && (
          <button
            onClick={(e) => { e.stopPropagation(); loadMoreHistory(); }}
            disabled={loadingHistory}
            className="w-full py-2 text-[11px] text-on-surface-variant/60 hover:text-foreground transition-colors font-medium disabled:opacity-40"
          >
            {loadingHistory ? "Loading..." : "Load more"}
          </button>
        )}
      </div>

      <div className="mt-auto pt-2 px-2 flex flex-col gap-0.5">
        <Link
          href="/gallery"
          onClick={() => isMobile && setMobileSidebarOpen(false)}
          className="group flex items-center gap-2 px-3 py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all duration-300 text-sm"
        >
          <span className="material-symbols-outlined text-outline group-hover:text-foreground text-[20px]">auto_awesome</span>
          Gallery
        </Link>
        <Link
          href="/settings"
          onClick={() => isMobile && setMobileSidebarOpen(false)}
          className="group flex items-center gap-2 px-3 py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all duration-300 text-sm"
        >
          <span className="material-symbols-outlined text-outline group-hover:text-foreground text-[20px]">settings</span>
          Settings
        </Link>
      </div>

      <div className="mt-auto pt-4 border-t border-border flex flex-col gap-1">
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-foreground/10 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[16px] text-foreground">person</span>
          </div>
          <span className="font-label-md text-[13px] text-on-surface truncate">{user?.name || "Architect"}</span>
        </div>
        <Link
          href="/pricing"
          onClick={() => isMobile && setMobileSidebarOpen(false)}
          className="mt-2 w-full py-2 border border-border text-foreground rounded-lg font-label-md text-sm hover:bg-foreground hover:text-background transition-colors text-center block"
        >
          Upgrade Pro
        </Link>
      </div>
    </>
  );

  // --- LOADING STATE (before auth check or initial history fetch) ---
  const [initialLoading, setInitialLoading] = useState(true);
  useEffect(() => {
    if (authReady && user) {
      if (chatHistory.length > 0 || !loadingHistory) {
        setInitialLoading(false);
      }
    } else if (authReady && !user) {
      setInitialLoading(false);
    }
  }, [authReady, user, chatHistory.length, loadingHistory]);

  if (initialLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-surface-bright to-tertiary-fixed">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-foreground flex items-center justify-center animate-pulse">
            <span className="material-symbols-outlined text-background text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>spa</span>
          </div>
          <h2 className="font-headline-sm text-xl text-foreground font-medium">Loading Axiora...</h2>
        </div>
      </div>
    );
  }

  // --- RENDER ---
  return (
    <div className="fixed inset-0 z-50 flex overflow-hidden antialiased bg-gradient-to-br from-surface-bright to-tertiary-fixed text-on-background">
      <Toaster position="top-center" />

      {/* ========== MOBILE SIDEBAR OVERLAY ========== */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ========== MOBILE SIDEBAR DRAWER ========== */}
      <div
        className={`fixed inset-y-0 left-0 z-[70] w-72 bg-tertiary-fixed/95 backdrop-blur-xl shadow-2xl flex flex-col p-4 transition-transform duration-300 ease-out md:hidden ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ paddingTop: "calc(1rem + env(safe-area-inset-top, 0px))", paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <SidebarContent isMobile />
      </div>

      {/* ========== DESKTOP SIDEBAR ========== */}
      <nav
        className={`hidden md:flex flex-col h-full z-40 bg-tertiary-fixed/40 backdrop-blur-xl border-r border-border shadow-[0_10px_40px_-10px_rgba(27,48,34,0.08)] flex-shrink-0 relative ${
          isResizing ? "" : "transition-all duration-300"
        }`}
        style={{
          width: isCollapsed ? 0 : sidebarWidth,
          paddingLeft: isCollapsed ? 0 : "12px",
          paddingRight: isCollapsed ? 0 : "12px",
          paddingTop: isCollapsed ? 0 : "20px",
          paddingBottom: isCollapsed ? 0 : "20px",
          opacity: isCollapsed ? 0 : 1,
          overflow: "hidden",
        }}
      >
        <SidebarContent />
      </nav>

      {/* Resizer Handle */}
      {!isCollapsed && (
        <div
          onMouseDown={startResizing}
          onDoubleClick={() => setIsCollapsed(true)}
          className="hidden md:block w-1.5 h-full cursor-col-resize hover:bg-foreground/5 active:bg-foreground/10 z-50 flex-shrink-0 relative group"
          style={{ marginLeft: "-3px" }}
        >
          <div
            className={`absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] transition-colors h-full ${
              isResizing ? "bg-foreground/40" : "bg-foreground/10 group-hover:bg-foreground/20"
            }`}
          />
        </div>
      )}

      {/* ========== MAIN AREA ========== */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">

        {/* Top Bar — Desktop */}
        <div className="hidden md:flex sticky top-0 z-30 justify-between items-center w-full h-16 px-8 bg-surface/60 backdrop-blur-xl border-b border-border shadow-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 text-on-surface-variant hover:text-foreground hover:bg-surface-container-high rounded-lg transition-all flex items-center justify-center"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>
                {isCollapsed ? "menu" : "menu_open"}
              </span>
            </button>
            <span className="text-foreground font-semibold border-b-2 border-foreground pb-1 font-label-md text-label-md">Chat</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => { useAuthStore.getState().logout(); router.push("/login"); }}
              className="text-on-surface-variant hover:text-foreground transition-colors font-label-sm text-[13px] flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              Logout
            </button>
          </div>
        </div>

        {/* Top Bar — Mobile */}
        <div className="md:hidden sticky top-0 z-30 flex items-center justify-between w-full min-h-14 px-4 bg-surface/80 backdrop-blur-xl border-b border-border shadow-sm flex-shrink-0"
          style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 text-on-surface-variant hover:text-foreground hover:bg-surface-container-high rounded-lg transition-all"
          >
            <span className="material-symbols-outlined text-[22px]">menu</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center">
              <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>spa</span>
            </div>
            <span className="text-foreground font-semibold font-label-md text-label-md">Axiora</span>
          </div>
          <button
            onClick={() => { useAuthStore.getState().logout(); router.push("/login"); }}
            className="p-2 text-on-surface-variant hover:text-foreground transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]">logout</span>
          </button>
        </div>

        {/* ========== MESSAGES AREA ========== */}
        <div className="flex-1 overflow-y-auto w-full flex flex-col">
          <div className="p-3 md:p-8 flex-1 flex flex-col gap-4 max-w-2xl mx-auto w-full">

          {/* VERIFICATION BANNER */}
          {user && !user.isVerified && (
            <div className="flex items-center gap-3 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[12px] text-amber-800">
              <span className="material-symbols-outlined text-amber-600 text-[18px] flex-shrink-0">mail_outline</span>
              <p className="flex-1">Please verify your email. <span className="text-amber-600/70">Check your inbox.</span></p>
              <button
                onClick={async () => {
                  try {
                    await api.post("/auth/resend-verification", { email: user.email });
                    toast.success("Verification email resent!");
                  } catch {
                    toast.error("Failed to resend");
                  }
                }}
                className="text-[11px] font-bold text-amber-700 underline hover:text-amber-900 transition-colors flex-shrink-0"
              >
                Resend
              </button>
            </div>
          )}

          {/* EMPTY STATE */}
          {messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12 md:py-20">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-foreground/5 flex items-center justify-center mb-3 md:mb-4">
                <span className="material-symbols-outlined text-[28px] md:text-[32px] text-foreground" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
              </div>
              <h2 className="font-headline-sm text-[22px] md:text-[26px] text-foreground mb-2 leading-tight px-4">How can I assist today?</h2>
              <p className="font-body-md text-[14px] md:text-[15px] text-on-surface-variant mb-6 md:mb-8 max-w-lg px-4">
                Powered by Groq Llama 3 — the fastest AI on earth.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3 w-full px-2 md:px-0">
                {[
                  { icon: "code", title: "Explain JavaScript promises", prompt: "Explain JavaScript promises in simple terms with examples." },
                  { icon: "fitness_center", title: "Create a workout plan", prompt: "Create a 3-day beginner workout plan focusing on core strength." },
                  { icon: "edit_note", title: "Draft a professional email", prompt: "Help me write a professional follow-up email to a client." },
                  { icon: "self_improvement", title: "Guided breathing exercise", prompt: "Walk me through a 5-minute box breathing routine." },
                ].map((s) => (
                  <button
                    key={s.title}
                    onClick={() => setInput(s.prompt)}
                    className="bg-background/50 backdrop-blur-[20px] border border-border shadow-[0_10px_40px_-10px_rgba(27,48,34,0.08)] p-3 md:p-4 rounded-2xl text-left hover:bg-background/70 transition-all duration-300 group flex flex-col gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[18px] md:text-[20px] text-on-surface-variant group-hover:text-foreground transition-colors">{s.icon}</span>
                    <h3 className="font-label-md text-[13px] md:text-[14px] text-on-surface">{s.title}</h3>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* MESSAGE BUBBLES */}
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === "assistant" ? "flex-col" : "flex-row justify-end"} gap-1 md:gap-1.5`}
            >
              {msg.role === "assistant" && (
                <div className="flex items-center gap-2 px-1">
                  <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-foreground text-background flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[10px] md:text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>spa</span>
                  </div>
                  <span className="text-[11px] text-on-surface-variant/40 font-medium">Axiora</span>
                </div>
              )}

              <div className={`flex flex-col ${msg.role === "user" ? "max-w-[90%] md:max-w-[80%] items-end" : "w-full"}`}>
                <div
                  className={`px-3 md:px-4 py-2.5 rounded-2xl font-body-md text-[13px] md:text-[14px] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-foreground text-background"
                      : "bg-background/60 backdrop-blur-sm text-foreground border border-border"
                  }`}
                >
                  {msg.type === "image" && msg.imageUrl ? (
                    <div className="flex flex-col gap-2">
                      <img
                        src={msg.imageUrl}
                        alt="Generated image"
                        className="w-full max-w-sm rounded-xl shadow-md cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(msg.imageUrl!, '_blank')}
                      />
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] text-on-surface-variant/50 italic">Generated by Axiora</p>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              const res = await fetch(msg.imageUrl!);
                              const blob = await res.blob();
                              const a = document.createElement("a");
                              a.href = URL.createObjectURL(blob);
                              a.download = `Axiora-image-${Date.now()}.png`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(a.href);
                              toast.success("Image downloaded");
                            } catch {
                              toast.error("Failed to download");
                            }
                          }}
                          className="text-[11px] text-on-surface-variant/40 hover:text-foreground transition-colors flex items-center gap-1"
                          title="Download image"
                        >
                          <span className="material-symbols-outlined text-[14px]">download</span>
                        </button>
                      </div>
                    </div>
                  ) : msg.role === "assistant" ? (
                    <div className="text-[13px] md:text-[14px] leading-relaxed">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '');
                            if (!match) {
                              return (
                                <code className="bg-foreground/5 text-foreground rounded px-1.5 py-0.5 text-[85%] font-mono" {...props}>
                                  {children}
                                </code>
                              );
                            }
                            const lang = match[1];
                            const codeText = String(children).replace(/\n$/, '');
                            return (
                              <div className="relative group/code my-3">
                                <div className="flex items-center justify-between px-4 py-1.5 bg-muted rounded-t-xl border-b border-border">
                                  <span className="text-[11px] text-muted-foreground/70 font-mono uppercase tracking-wider">{lang}</span>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(codeText);
                                      toast.success("Code copied");
                                    }}
                                    className="opacity-0 group-hover/code:opacity-100 transition-opacity text-[11px] text-muted-foreground/60 hover:text-muted-foreground flex items-center gap-1"
                                  >
                                    <span className="material-symbols-outlined text-[8px]">content_copy</span>
                                    Copy code
                                  </button>
                                </div>
                                <pre className="rounded-t-none rounded-b-xl bg-muted text-foreground p-4 overflow-x-auto text-[13px] leading-relaxed">
                                  <code className={className} {...props}>{children}</code>
                                </pre>
                              </div>
                            );
                          }
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <span className="whitespace-pre-wrap">{msg.content}</span>
                  )}
                </div>

                {msg.type !== "image" && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(msg.content);
                      toast.success("Copied to clipboard");
                    }}
                    className="flex items-center mt-1 p-1 self-end rounded-md text-foreground/40 hover:text-foreground hover:bg-foreground/5 transition-all"
                    title="Copy text"
                  >
                    <span className="material-symbols-outlined text-[8px]">content_copy</span>
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* LOADING INDICATOR */}
          {loading && (
            <div className="flex gap-2 md:gap-3 justify-start">
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-foreground text-background flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[14px] md:text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>spa</span>
              </div>
              <div className="bg-white/60 backdrop-blur-sm border border-border rounded-2xl rounded-tl-sm px-3 md:px-3.5 py-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-on-surface-variant animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 rounded-full bg-on-surface-variant animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 rounded-full bg-on-surface-variant animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

        {/* ========== INPUT AREA ========== */}
        <div className="p-3 md:p-6 pt-0 w-full max-w-2xl mx-auto flex-shrink-0" style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}>
          <div className="bg-background/50 backdrop-blur-[20px] border border-border shadow-[0_10px_40px_-10px_rgba(27,48,34,0.08)] rounded-[20px] p-1.5 flex items-end gap-1 focus-within:border-foreground/30 focus-within:ring-2 focus-within:ring-foreground/10 transition-all duration-300">
            <div className="flex items-center gap-0.5 mb-0.5 ml-1">
              <button
                onClick={() => setShowImageModal(true)}
                className="p-2.5 md:p-2 text-on-surface-variant hover:text-foreground hover:bg-background/60 transition-all flex-shrink-0 rounded-full"
                title="Generate Image"
              >
                <span className="material-symbols-outlined text-[20px] md:text-[22px]">image</span>
              </button>
            </div>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              className="w-full bg-transparent border-none focus:ring-0 resize-none max-h-32 py-2.5 px-2 font-body-md text-[13px] md:text-[14px] text-on-surface placeholder:text-on-surface-variant/60 outline-none disabled:opacity-50"
              placeholder={loading ? "Axiora is thinking..." : "Ask anything..."}
              rows={1}
              style={{ minHeight: "44px" }}
            />

            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="p-2.5 bg-foreground text-background rounded-[14px] hover:bg-foreground/90 transition-colors flex-shrink-0 shadow-sm flex items-center justify-center mb-0.5 mr-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[20px] md:text-[22px]">arrow_upward</span>
            </button>
          </div>
          <p className="text-center font-label-sm text-[10px] md:text-[11px] text-on-surface-variant mt-1.5 md:mt-2 opacity-70">
            Axiora uses Groq Llama 3. Verify important information independently.
          </p>
        </div>
      </main>

      {/* ========== DELETE CONFIRMATION MODAL ========== */}
      {deleteConfirmId && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setDeleteConfirmId(null)}
        >
          <div
            className="bg-card rounded-2xl shadow-2xl border border-border p-6 w-[85vw] max-w-[320px] text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-red-500 text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>delete</span>
            </div>
            <h3 className="text-[15px] font-bold text-foreground mb-2">Delete conversation?</h3>
            <p className="text-[13px] text-on-surface-variant/70 mb-6 leading-relaxed">
              This will permanently delete this conversation and all its messages. This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-border text-[13px] font-medium text-on-surface-variant hover:bg-surface-container-high transition-all"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await handleDeleteChat(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 text-white text-[13px] font-medium hover:bg-red-700 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== IMAGE GENERATION MODAL ========== */}
      {showImageModal && (
        <div className="fixed inset-0 z-[80] flex items-end md:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !imageGenerating && setShowImageModal(false)}
          />

          <div className="relative w-full md:max-w-lg bg-card rounded-t-[28px] md:rounded-[28px] md:shadow-2xl p-6 md:p-8 animate-in slide-in-from-bottom md:slide-in-from-bottom-0 md:zoom-in-95 duration-300">
            {/* Drag handle for mobile */}
            <div className="md:hidden absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-black/15" />

            <div className="flex items-center justify-between mb-6 mt-1 md:mt-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center">
                  <span className="material-symbols-outlined text-background text-[22px]">auto_awesome</span>
                </div>
                <div>
                  <h2 className="font-headline-sm text-lg md:text-xl text-foreground font-bold">Image Synthesis</h2>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-black opacity-40">DALL-E 3 Powered</p>
                </div>
              </div>
              <button
                onClick={() => setShowImageModal(false)}
                disabled={imageGenerating}
                className="p-2.5 md:p-2 text-on-surface-variant hover:text-foreground transition-colors disabled:opacity-30"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-foreground uppercase tracking-[0.1em] opacity-40 ml-1">Visual Description</label>
                <textarea
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  onKeyDown={handleImageKeyDown}
                  placeholder="A serene mountain landscape at sunset with vibrant colors..."
                  rows={3}
                  className="w-full bg-surface-container-low border border-outline-variant/40 rounded-[20px] px-5 py-4 text-sm outline-none focus:ring-4 focus:ring-foreground/10 focus:border-foreground/30 transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-foreground uppercase tracking-[0.1em] opacity-40 ml-1">Resolution</label>
                  <div className="flex gap-2">
                    {[
                      { label: "Square", value: "1024x1024" as const },
                      { label: "Portrait", value: "1024x1792" as const },
                      { label: "Landscape", value: "1792x1024" as const },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setImageSize(opt.value)}
                        className={`flex-1 py-2 rounded-xl text-[10px] md:text-[11px] font-bold transition-all whitespace-nowrap ${
                          imageSize === opt.value
                            ? "bg-foreground text-background shadow-md"
                            : "bg-surface-container-low border border-outline-variant/30 text-on-surface-variant hover:bg-background"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-foreground uppercase tracking-[0.1em] opacity-40 ml-1">Quality</label>
                  <div className="flex gap-2">
                    {[
                      { label: "Standard", value: "standard" as const },
                      { label: "HD", value: "hd" as const },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setImageQuality(opt.value)}
                        className={`flex-1 py-2 rounded-xl text-[11px] font-bold transition-all ${
                          imageQuality === opt.value
                            ? "bg-foreground text-background shadow-md"
                            : "bg-surface-container-low border border-outline-variant/30 text-on-surface-variant hover:bg-background"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImageModal(false)}
                  disabled={imageGenerating}
                  className="flex-1 py-3.5 border border-outline-variant/40 rounded-[16px] text-[12px] font-bold text-on-surface-variant hover:bg-background transition-all disabled:opacity-30"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleGenerateImage}
                  disabled={!imagePrompt.trim() || imageGenerating}
                  className="flex-1 py-3.5 bg-foreground text-background rounded-[16px] text-[12px] font-bold hover:bg-foreground/90 transition-all shadow-md active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {imageGenerating ? (
                      <>
                        <span className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
                        <span className="hidden md:inline">Generating...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                        <span className="hidden md:inline">Generate Image</span>
                        <span className="md:hidden">Generate</span>
                      </>
                    )}
                </button>
              </div>

              <p className="text-[10px] text-on-surface-variant/40 text-center leading-relaxed">
                Generates at 10 energy per image on the Free plan. Results are saved permanently to your gallery.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
