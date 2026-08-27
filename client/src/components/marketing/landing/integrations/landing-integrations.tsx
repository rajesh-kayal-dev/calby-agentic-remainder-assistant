"use client";

import {
  Calendar,
  Mail,
  Send,
  MessageCircle,
  FileText,
  FileSpreadsheet,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export function LandingIntegrations() {
  const tools = [
    {
      name: "Google Calendar",
      icon: Calendar,
      category: "Schedule Sync",
      desc: "Direct two-way synchronization for meeting creation, conflict checks, and rescheduling.",
      status: "Live Integration",
    },
    {
      name: "Gmail",
      icon: Mail,
      category: "Email Dispatch",
      desc: "Send reminders, meeting follow-ups, and notifications directly from your verified Google account.",
      status: "OAuth 2.0",
    },
    {
      name: "Telegram",
      icon: Send,
      category: "Messaging Bot",
      desc: "Receive real-time instant alerts, reminders, and daily agenda digests in your Telegram chats.",
      status: "Bot API",
    },
    {
      name: "WhatsApp",
      icon: MessageCircle,
      category: "Cloud Messaging",
      desc: "Direct delivery to your WhatsApp phone number powered by Meta Business Cloud API.",
      status: "Cloud API",
    },
    {
      name: "Google Docs",
      icon: FileText,
      category: "Document Export",
      desc: "Export generated executive summaries and meeting notes into freshly formatted Google Docs.",
      status: "Docs REST API",
    },
    {
      name: "Google Sheets",
      icon: FileSpreadsheet,
      category: "Spreadsheets",
      desc: "Export ledger logs, pending task lists, and monthly financial summaries to Google Sheets.",
      status: "Sheets REST API",
    },
  ];

  const llmProviders = [
    "OpenAI",
    "Google Gemini",
    "Anthropic Claude",
    "DeepSeek",
    "Groq",
    "Mistral",
    "Ollama",
    "OpenRouter",
    "Perplexity",
    "MiniMax",
    "xAI Grok",
    "ZAI",
  ];

  return (
    <section id="integrations" className="py-24 sm:py-32 relative overflow-hidden border-t border-white/5">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[550px] bg-lime-500/5 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <ScrollReveal className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-lime-400/10 border border-lime-400/20 text-lime-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <Cpu className="w-3.5 h-3.5" />
            <span>Connected Ecosystem</span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-medium text-white tracking-tight leading-tight mb-6">
            Works with the tools <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 to-emerald-400">
              you already use.
            </span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-zinc-400 font-light leading-relaxed">
            Calby connects with your calendar, communication channels, productivity suites, and preferred AI providers.
          </p>
        </ScrollReveal>

        {/* 6 Connected Integrations Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-16">
          {tools.map((item, idx) => {
            const Icon = item.icon;
            return (
              <ScrollReveal key={item.name} delay={idx * 60} className="h-full">
                <div className="h-full group glass-card rounded-[2rem] p-7 border border-white/10 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-lime-400/30 transition-all duration-300 shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 text-lime-400 flex items-center justify-center group-hover:scale-105 transition-transform duration-200 shadow-inner">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] font-mono text-zinc-400 bg-zinc-950 px-2.5 py-1 rounded-full border border-white/5">
                        {item.status}
                      </span>
                    </div>

                    <h3 className="text-xl font-medium text-white mb-2">
                      {item.name}
                    </h3>
                    <p className="text-sm text-zinc-400 font-light leading-relaxed mb-6">
                      {item.desc}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center gap-2 text-xs text-lime-400 font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Securely Connected</span>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>

        {/* Multi-LLM Provider Flexibility Subsection */}
        <ScrollReveal delay={120}>
          <div className="rounded-[2.5rem] p-8 sm:p-10 border border-white/10 bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 shadow-2xl relative overflow-hidden backdrop-blur-xl">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 text-xs font-semibold text-lime-400 uppercase tracking-wider mb-3">
                <Cpu className="w-4 h-4" />
                <span>Multi-Model Architecture</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-medium text-white mb-4">
                Bring your preferred AI provider.
              </h3>
              <p className="text-sm sm:text-base text-zinc-400 font-light leading-relaxed mb-6">
                Calby supports 12 first-class AI providers. Connect your own API keys with per-user AES-256-GCM encryption, or use default intelligence out of the box.
              </p>

              {/* Provider Badges */}
              <div className="flex flex-wrap gap-2 sm:gap-2.5">
                {llmProviders.map((p) => (
                  <span
                    key={p}
                    className="text-xs font-mono text-zinc-300 bg-zinc-900/90 px-3 py-1.5 rounded-xl border border-white/10 hover:border-lime-400/40 hover:text-white transition-colors"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
