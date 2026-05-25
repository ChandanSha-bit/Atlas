"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import api from "@/lib/axios";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post("/auth/forgot-password", { email });
      toast.success("Password reset link sent to your email!");
      setEmailSent(true);
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to send reset email.";
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
          {!emailSent ? (
            <>
              <h1 className="font-headline-md text-headline-md text-primary mb-3">Reset Password</h1>
              <p className="font-body-md text-body-md text-on-surface-variant mb-8 px-2">
                Enter your email address and we'll send you a link to reset your password.
              </p>
              
              <form onSubmit={handleSubmit} className="space-y-6 text-left">
                {/* Email Input */}
                <div className="space-y-2">
                  <label className="block font-label-md text-label-md text-on-surface" htmlFor="email">Email Address</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-outline text-[20px]">mail</span>
                    </span>
                    <input 
                      className="block w-full pl-10 pr-3 py-3 bg-surface-container-low border border-surface-variant rounded-lg font-body-md text-body-md text-on-surface focus:ring-2 focus:ring-primary-container/30 focus:border-primary-container transition-all shadow-inner placeholder:text-outline outline-none" 
                      id="email" 
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com" 
                      required 
                    />
                  </div>
                </div>
                
                {/* Submit Button */}
                <button 
                  disabled={loading}
                  className="w-full flex items-center justify-center py-3 px-4 bg-primary-container text-white rounded-lg font-label-md text-label-md shadow-sm hover:bg-primary-container/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-container transition-all active:scale-[0.98] border-t border-border/10 disabled:opacity-50" 
                  type="submit"
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-foreground/5 flex items-center justify-center">
                <span className="material-symbols-outlined text-foreground text-4xl">mark_email_read</span>
              </div>
              <h1 className="font-headline-md text-headline-md text-primary mb-3">Check Your Email</h1>
              <p className="font-body-md text-body-md text-on-surface-variant mb-8 px-2">
                We've sent a password reset link to <strong>{email}</strong>. 
                Please check your inbox and follow the instructions.
              </p>
              <p className="text-sm text-on-surface-variant/70 mb-6">
                The link will expire in 10 minutes.
              </p>
            </>
          )}
          
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
