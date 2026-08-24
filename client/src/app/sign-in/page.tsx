import { RedirectIfAuthenticated } from "@/components/auth/RedirectIfAuthenticated";
import SignInComponent from "@/components/auth/sign-in";
import { CalbyBackground } from "@/components/ui/CalbyBackground";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

function SignInPage() {
  return (
    <main className="relative flex min-h-svh items-center justify-center bg-zinc-950 px-4 py-12 selection:bg-lime-400 selection:text-zinc-950 overflow-hidden">
      {/* Shared Calby Background System */}
      <CalbyBackground />

      {/* Back to Home Link */}
      <Link
        href="/"
        className="absolute top-6 left-6 z-20 flex items-center gap-2 rounded-full border border-white/10 bg-zinc-900/60 px-4 py-2 text-xs font-medium text-zinc-400 backdrop-blur-md transition-colors hover:border-lime-400/40 hover:text-lime-400"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to Calby</span>
      </Link>

      {/* Main Authentication Card */}
      <div className="relative z-10 w-full max-w-[440px] rounded-[2.5rem] border border-white/10 bg-zinc-900/80 p-8 sm:p-10 shadow-[0_25px_60px_rgba(0,0,0,0.85)] backdrop-blur-2xl ring-1 ring-lime-400/20">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-6">
          <Link href="/" className="group mb-3 flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Calby icon"
              className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
            />
            <img
              src="/Calby_text.png"
              alt="Calby"
              className="h-7 w-auto object-contain"
            />
          </Link>
          <p className="text-sm font-light text-zinc-400 mt-1">
            Your calendar, on autopilot.
          </p>
        </div>

        {/* Descope Authentication Form */}
        <RedirectIfAuthenticated>
          <SignInComponent />
        </RedirectIfAuthenticated>
      </div>
    </main>
  );
}

export default SignInPage;
