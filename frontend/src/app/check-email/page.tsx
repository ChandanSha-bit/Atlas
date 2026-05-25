import Image from "next/image";
import Link from "next/link";

export default function CheckEmail() {
  return (
    <div className="flex-1 flex flex-col justify-center items-center relative min-h-screen overflow-hidden p-4 sm:p-8">
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

      {/* Central Glassmorphism Card */}
      <main className="relative z-10 w-full max-w-md">
        {/* Brand Logo Header */}
        <div className="text-center mb-8">
          <h1 className="font-headline-sm text-headline-sm text-primary">Atlas</h1>
        </div>
        
        <div className="bg-background/60 backdrop-blur-[20px] rounded-[1.5rem] border border-border/40 shadow-[0_30px_60px_rgba(27,48,34,0.08)] p-8 md:p-10 flex flex-col items-center text-center">
          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-secondary-fixed/50 flex items-center justify-center mb-6 border border-border/50">
            <span className="material-symbols-outlined text-[32px] text-primary" style={{ fontVariationSettings: "'FILL' 0" }}>mark_email_unread</span>
          </div>
          
          {/* Content */}
          <h2 className="font-headline-md text-headline-md text-primary mb-4">Check Your Email</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mb-8 px-2">
            We've sent a password reset link to your email address. Please check your inbox and follow the instructions.
          </p>
          
          {/* Primary Action */}
          <button className="w-full bg-primary-container text-white hover:bg-primary transition-colors duration-300 rounded-xl py-3 px-6 font-label-md text-label-md shadow-[inset_0_4px_0_rgba(255,255,255,0.1)] mb-6">
            Open Email App
          </button>
          
          {/* Secondary Actions */}
          <div className="flex flex-col gap-4 w-full">
            <button className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors">
              Didn't receive the email? <span className="text-primary underline underline-offset-4 decoration-primary/30">Resend</span>
            </button>
            <div className="h-px w-full bg-outline-variant/30 my-2"></div>
            <Link className="inline-flex items-center justify-center gap-2 font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors" href="/login">
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Back to Login
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
