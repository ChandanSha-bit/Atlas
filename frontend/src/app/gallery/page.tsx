"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/useAuthStore";

interface GalleryImage {
  _id: string;
  imageUrl: string;
  prompt: string;
  timestamp: string;
  chatId: string;
  chatTitle: string;
}

export default function GalleryPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  const [authReady, setAuthReady] = useState(false);
  useEffect(() => { setAuthReady(true); }, []);

  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      router.push("/login");
      return;
    }
    fetchImages();
  }, [user, router]);

  const fetchImages = async () => {
    try {
      const res = await api.get("/images/history");
      setImages(res.data.data);
    } catch {
      toast.error("Failed to load gallery");
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = async (url: string, prompt: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `Axiora-${prompt.slice(0, 20).replace(/\s+/g, "-")}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
      toast.success("Image downloaded");
    } catch {
      toast.error("Failed to download image");
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-foreground flex items-center justify-center animate-pulse">
            <span className="material-symbols-outlined text-background text-2xl">auto_awesome</span>
          </div>
          <p className="text-sm text-on-surface-variant">Loading gallery...</p>
        </div>
      </div>
    );
  }

  if (!authReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1b1c1a]/30 border-t-[#1b1c1a] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-surface p-4 md:p-8 selection:bg-foreground selection:text-background relative">
      <Toaster position="top-center" />

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/chat"
              className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-on-surface-variant hover:text-foreground hover:bg-background transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </Link>
            <div>
              <h1 className="font-headline-sm text-2xl md:text-3xl text-foreground font-bold tracking-tight">Gallery</h1>
              <p className="text-[11px] text-on-surface-variant uppercase tracking-widest font-black opacity-40">
                {images.length} {images.length === 1 ? "creation" : "creations"}
              </p>
            </div>
          </div>
          {images.length > 0 && (
            <button
              onClick={fetchImages}
              className="p-2.5 rounded-full bg-white border border-border hover:bg-foreground hover:text-background transition-all shadow-sm"
              title="Refresh"
            >
              <span className="material-symbols-outlined text-[20px]">refresh</span>
            </button>
          )}
        </div>

        {/* Empty State */}
        {images.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-20">
            <div className="w-20 h-20 rounded-full bg-foreground/5 flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-[48px] text-foreground">auto_awesome</span>
            </div>
            <h2 className="font-headline-sm text-2xl text-foreground font-bold mb-2">No Creations Yet</h2>
            <p className="text-sm text-on-surface-variant max-w-sm mb-8 opacity-70">
              Your generated images will appear here. Start by describing an image in the chat.
            </p>
            <Link
              href="/chat"
              className="px-8 py-3.5 bg-foreground text-background rounded-[16px] text-sm font-bold hover:bg-black transition-all shadow-md"
            >
              Go to Chat
            </Link>
          </div>
        )}

        {/* Image Grid */}
        {images.length > 0 && (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4"
          >
            {images.map((img) => (
              <motion.div
                key={img._id}
                variants={item}
                className="group relative aspect-square rounded-2xl overflow-hidden bg-card border border-border shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer"
              >
                <img
                  src={img.imageUrl}
                  alt={img.prompt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onClick={() => setSelectedImage(img)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                  <p className="text-white text-[11px] leading-tight line-clamp-2 mb-2">{img.prompt}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); downloadImage(img.imageUrl, img.prompt); }}
                      className="flex-1 py-1.5 bg-white/20 backdrop-blur-md text-white text-[10px] font-bold rounded-lg hover:bg-white/30 transition-all flex items-center justify-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">download</span>
                      Save
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedImage(img); }}
                      className="py-1.5 px-3 bg-white/20 backdrop-blur-md text-white text-[10px] font-bold rounded-lg hover:bg-white/30 transition-all"
                    >
                      <span className="material-symbols-outlined text-[14px]">open_in_full</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-3xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-white/80 text-sm truncate flex-1 mr-4">{selectedImage.prompt}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadImage(selectedImage.imageUrl, selectedImage.prompt)}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
                  title="Download"
                >
                  <span className="material-symbols-outlined text-[20px]">download</span>
                </button>
                <Link
                  href={`/chat`}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
                  title="Open in Chat"
                >
                  <span className="material-symbols-outlined text-[20px]">chat</span>
                </Link>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            </div>
            <img
              src={selectedImage.imageUrl}
              alt={selectedImage.prompt}
              className="w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
            />
            <p className="text-white/40 text-[11px] mt-3 text-center">
              {new Date(selectedImage.timestamp).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
