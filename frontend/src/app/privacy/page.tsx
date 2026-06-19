import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-bright to-tertiary-fixed text-on-surface p-6 md:p-12 selection:bg-primary-fixed selection:text-primary">
      <div className="max-w-3xl mx-auto">
        <Link href="/chat" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-foreground mb-8 transition-colors font-label-md">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to Chat
        </Link>
        
        <header className="mb-10">
          <h1 className="font-headline-lg text-headline-lg text-foreground mb-3">Privacy & Security</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">Last updated: May 10, 2026</p>
        </header>

        <div className="bg-background/60 backdrop-blur-[20px] rounded-3xl p-8 md:p-12 border border-border/40 shadow-[0_10px_40px_-10px_rgba(27,48,34,0.08)]">
          <section className="mb-10">
            <h2 className="font-headline-sm text-[24px] text-foreground mb-4 mt-0">1. Data Collection</h2>
            <p className="font-body-md text-[16px] text-on-surface-variant leading-relaxed">
              At Atlas, we believe your data is your own. We collect minimal personal information necessary to provide you with our services. This includes your email address for authentication and the content of your conversations to provide contextual, highly personalized AI responses.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="font-headline-sm text-[24px] text-foreground mb-4">2. How We Use Your Information</h2>
            <p className="font-body-md text-[16px] text-on-surface-variant leading-relaxed">
              Your conversational data is processed in real-time to generate AI responses and improve your immediate experience. We do not sell, rent, or share your personal data with third-party advertisers. All data is processed using industry-standard encryption protocols, and your data is never used to train public foundational models without explicit consent.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="font-headline-sm text-[24px] text-foreground mb-4">3. Data Security & Encryption</h2>
            <p className="font-body-md text-[16px] text-on-surface-variant leading-relaxed">
              Security is deeply integrated into our architecture. All data transmitted between your device and our servers is encrypted using TLS 1.3. Data at rest is secured using AES-256 encryption. We regularly conduct security audits to ensure your information remains protected against unauthorized access.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="font-headline-sm text-[24px] text-foreground mb-4">4. Your Rights</h2>
            <p className="font-body-md text-[16px] text-on-surface-variant leading-relaxed">
              You maintain full control over your data. You have the right to request an export of your conversation history, or request complete deletion of your account and associated data at any time. Account deletion requests are processed comprehensively within 30 days.
            </p>
          </section>

          <div className="mt-12 pt-8 border-t border-outline-variant/30">
            <p className="font-body-md text-[15px] text-on-surface-variant italic">
              If you have any questions about this Privacy Policy, please contact our Data Protection Officer at privacy@Atlas.ai.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
