"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/useAuthStore";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const user = useAuthStore((s) => s.user);

  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setErrorMsg("No verification token found in the URL.");
      return;
    }

    const verify = async () => {
      try {
        const res = await api.get(`/auth/verify-email/${token}`);
        const { user: verifiedUser, token: newToken } = res.data;
        setAuth(verifiedUser, newToken);
        setStatus("success");
        toast.success("Email verified successfully!");
      } catch (err: any) {
        setStatus("error");
        setErrorMsg(err.response?.data?.message || "Verification failed. The link may have expired.");
      }
    };

    verify();
  }, [searchParams, setAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Toaster position="top-center" />
      <div className="max-w-md w-full text-center">
        {status === "verifying" && (
          <div>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-foreground flex items-center justify-center animate-pulse">
              <span className="material-symbols-outlined text-background text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Verifying your email...</h2>
            <p className="text-sm text-on-surface-variant">Please wait while we confirm your identity.</p>
          </div>
        )}

        {status === "success" && (
          <div>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-green-600 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Email Verified!</h2>
            <p className="text-sm text-on-surface-variant mb-8">Your account is now active. You&apos;re being redirected...</p>
            <button
              onClick={() => router.push("/chat")}
              className="px-8 py-3 bg-foreground text-background rounded-xl font-bold hover:bg-foreground/90 transition-all"
            >
              Go to Chat
            </button>
          </div>
        )}

        {status === "error" && (
          <div>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-red-500 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>error_outline</span>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Verification Failed</h2>
            <p className="text-sm text-on-surface-variant mb-6">{errorMsg}</p>
            <div className="flex flex-col gap-3 items-center">
              {user && !user.isVerified && (
                <button
                  onClick={async () => {
                    try {
                      await api.post("/auth/resend-verification", { email: user.email });
                      toast.success("Verification email resent!");
                    } catch {
                      toast.error("Failed to resend verification email");
                    }
                  }}
                  className="px-8 py-3 bg-foreground text-background rounded-xl font-bold hover:bg-foreground/90 transition-all"
                >
                  Resend Verification
                </button>
              )}
              <Link href="/login" className="text-sm text-on-surface-variant hover:text-foreground transition-colors underline">
                Back to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-foreground flex items-center justify-center animate-pulse">
            <span className="material-symbols-outlined text-background text-3xl">verified</span>
          </div>
          <h2 className="text-xl font-medium text-foreground">Loading...</h2>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
