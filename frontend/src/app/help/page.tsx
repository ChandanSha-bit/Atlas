import Link from "next/link";

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-bright to-tertiary-fixed text-on-surface p-6 md:p-12 selection:bg-primary-fixed selection:text-primary">
      <div className="max-w-3xl mx-auto">
        <Link href="/chat" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-foreground mb-8 transition-colors font-label-md">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to Chat
        </Link>
        
        <header className="mb-10">
          <h1 className="font-headline-lg text-headline-lg text-foreground mb-3">Help & Support</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">Find answers to common questions and learn how to get the most out of Atlas.</p>
        </header>

        <div className="space-y-8">
          <section className="bg-background/60 backdrop-blur-[20px] rounded-3xl p-8 md:p-10 border border-border/40 shadow-[0_10px_40px_-10px_rgba(27,48,34,0.08)]">
            <h2 className="font-headline-sm text-headline-sm text-foreground mb-6 border-b border-outline-variant/30 pb-4">Frequently Asked Questions</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-label-md text-label-md text-on-surface mb-2">How do I reset my password?</h3>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">You can reset your password by clicking on the "Forgot password?" link on the login page. We will send you an email with instructions to create a new one.</p>
              </div>
              <div>
                <h3 className="font-label-md text-label-md text-on-surface mb-2">Are my conversations private?</h3>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">Yes, Atlas prioritizes your privacy. All conversations are encrypted and are never used to train external public models without your explicit consent.</p>
              </div>
              <div>
                <h3 className="font-label-md text-label-md text-on-surface mb-2">How do I generate an image?</h3>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">In the chat interface, simply click the image icon next to the attachment clip inside the text box. Type your visual description and press enter to generate your image seamlessly in the chat.</p>
              </div>
              <div>
                <h3 className="font-label-md text-label-md text-on-surface mb-2">How do I upgrade my account?</h3>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">Click the "Upgrade Pro" button located at the bottom of the left sidebar to view our premium tiers and unlock advanced AI capabilities.</p>
              </div>
            </div>
          </section>

          <section className="bg-foreground text-background rounded-3xl p-8 md:p-10 shadow-sm text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-full bg-background/10 flex items-center justify-center mx-auto mb-6 backdrop-blur-md border border-border/20">
                <span className="material-symbols-outlined text-[32px]">support_agent</span>
              </div>
              <h2 className="font-headline-sm text-headline-sm mb-3">Still need help?</h2>
              <p className="font-body-md text-body-md opacity-80 mb-8 max-w-md mx-auto">
                Our support team is always here to assist you with any technical issues, billing inquiries, or general questions.
              </p>
              <button className="px-8 py-3 bg-background text-foreground rounded-xl font-label-md text-label-md hover:bg-surface-bright transition-colors shadow-sm">
                Contact Support
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
