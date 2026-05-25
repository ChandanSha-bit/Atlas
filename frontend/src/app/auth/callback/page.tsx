"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * OAuth Callback Page
 * 
 * This page handles the redirect from OAuth providers (Google & GitHub).
 * The backend sends: /auth/callback?token=xxx&user={...}
 * We extract the data, store it in Zustand, and redirect to chat.
 */
function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    const token = searchParams.get("token");
    const userJson = searchParams.get("user");
    const error = searchParams.get("error");

    if (error) {
      toast.error("Authentication failed. Please try again.");
      router.push("/login");
      return;
    }

    if (token && userJson) {
      try {
        const user = JSON.parse(decodeURIComponent(userJson));
        setAuth(user, token);
        toast.success(`Welcome, ${user.name}!`);
        router.push("/chat");
      } catch (err) {
        toast.error("Failed to process authentication.");
        router.push("/login");
      }
    } else {
      toast.error("Invalid authentication response.");
      router.push("/login");
    }
  }, [searchParams, setAuth, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-foreground flex items-center justify-center animate-pulse">
          <span className="material-symbols-outlined text-background text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
        </div>
        <h2 className="text-xl font-medium text-foreground mb-2">Authenticating...</h2>
        <p className="text-sm text-foreground/50">Please wait while we verify your identity.</p>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-foreground flex items-center justify-center">
            <span className="material-symbols-outlined text-background text-3xl">eco</span>
          </div>
          <h2 className="text-xl font-medium text-foreground mb-2">Loading...</h2>
        </div>
      </div>
    }>
      <OAuthCallbackContent />
    </Suspense>
  );
}
