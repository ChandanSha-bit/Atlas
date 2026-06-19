"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/useAuthStore";

function NewPasswordContent() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      toast.error("Invalid reset link");
      router.push("/reset-password");
    }
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await api.put(`/auth/reset-password/${token}`, { password });
      const { user, token: jwtToken } = res.data;
      
      setAuth(user, jwtToken);
      toast.success("Password reset successful! Redirecting...");
      
      setTimeout(() => {
        router.push("/chat");
      }, 1500);
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to reset password.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center relative min-h-screen overflow-hidden py-12 md:py-20">
      <Toaster position="top-center" />
      
      {/* Cinematic Landscape Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <Image 
          alt="Cinematic mountain landscape" 
          className="w-full h-full object-cover opacity-80" 
          src="/bg-landscape.png?v=2"
          fill
          priority
          sizes="100vw"
          quality={100}
          unoptimized
        />
        {/* Overlay to ensure text readability and maintain Atlas aesthetic */}
        <div className="absolute inset-0 bg-tertiary-fixed/30 mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent"></div>
      </div>

      {/* Centered Glassmorphism Card */}
      <main className="relative z-10 w-full max-w-md px-margin-mobile md:px-0">
        {/* Brand / Logo Area */}
        <div className="text-center mb-8">
          <div className="font-headline-sm text-headline-sm text-primary font-medium tracking-tight">Atlas</div>
        </div>
        
        <div className="bg-background/60 backdrop-blur-[20px] border border-border/20 rounded-xl p-8 shadow-[0_10px_40px_-10px_rgba(27,48,34,0.08)] text-center">
          <h1 className="font-headline-md text-headline-md text-primary mb-3">Create New Password</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mb-8 px-2">
            Your new password must be different from previously used passwords.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {/* New Password Input */}
            <div className="space-y-1">
              <label className="block font-label-md text-label-md text-on-surface" htmlFor="password">New Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline text-[20px]">lock</span>
                </span>
                <input 
                  className="block w-full pl-10 pr-10 py-3 bg-surface-container-low border border-surface-variant rounded-lg font-body-md text-body-md text-on-surface focus:ring-2 focus:ring-primary-container/30 focus:border-primary-container transition-all shadow-inner placeholder:text-outline outline-none" 
                  id="password" 
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  required 
                />
                <button 
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-outline hover:text-on-surface transition-colors" 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                   <span className="material-symbols-outlined text-[20px]">
                     {showPassword ? "visibility" : "visibility_off"}
                   </span>
                </button>
              </div>
            </div>
            
            {/* Confirm Password Input */}
            <div className="space-y-1">
              <label className="block font-label-md text-label-md text-on-surface" htmlFor="confirmPassword">Confirm Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline text-[20px]">lock</span>
                </span>
                <input 
                  className="block w-full pl-10 pr-10 py-3 bg-surface-container-low border border-surface-variant rounded-lg font-body-md text-body-md text-on-surface focus:ring-2 focus:ring-primary-container/30 focus:border-primary-container transition-all shadow-inner placeholder:text-outline outline-none" 
                  id="confirmPassword" 
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••" 
                  required 
                />
                <button 
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-outline hover:text-on-surface transition-colors" 
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                   <span className="material-symbols-outlined text-[20px]">
                     {showConfirmPassword ? "visibility" : "visibility_off"}
                   </span>
                </button>
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="pt-2">
              <button 
                disabled={loading}
                className="w-full flex items-center justify-center py-3 px-4 bg-primary-container text-background rounded-lg font-label-md text-label-md shadow-sm hover:bg-primary-container/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-container transition-all active:scale-[0.98] border-t border-border/10 disabled:opacity-50" 
                type="submit"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          </form>
          
          {/* Back to Login Link */}
          <div className="mt-8 text-center">
            <Link className="inline-flex items-center gap-2 font-label-md text-label-md text-secondary hover:text-primary transition-colors" href="/login">
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Back to Login
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function NewPassword() {
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
      <NewPasswordContent />
    </Suspense>
  );
}
