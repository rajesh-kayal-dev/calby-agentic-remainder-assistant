"use client";

import {
  Sparkles,
  User,
  Calendar,
  Mail,
  Send,
  MessageCircle,
  FileText,
  FileSpreadsheet,
  Cpu,
} from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export function LandingConversations() {
  const conversations = [
    {
      id: "ex-1",
      user: "Rahul owes me ₹500 for books.",
      calby: "Got it. Added ₹500 to Rahul's pending balance.",
    },
    {
      id: "ex-2",
      user: "Remind me tomorrow to call Sarah.",
      calby: "Sure. I'll remind you tomorrow at 9:00 AM.",
    },
    {
      id: "ex-3",
      user: "What's still pending with Rahul?",
      calby: "Rahul has ₹350 pending:\n• Books — ₹200\n• Food — ₹150",
    },
    {
      id: "ex-4",
      user: "Find 30 minutes with Sarah tomorrow.",
      calby: "I found an open 30-minute slot tomorrow at 2:30 PM.",
    },
  ];

  const tools = [
    { name: "Google Calendar", icon: Calendar },
    { name: "Gmail", icon: Mail },
    { name: "Telegram", icon: Send },
    { name: "WhatsApp", icon: MessageCircle },
    { name: "Google Docs", icon: FileText },
    { name: "Google Sheets", icon: FileSpreadsheet },
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
    <section id="intelligence" className="py-24 sm:py-32 relative overflow-hidden border-t border-white/5 bg-zinc-950/60">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[500px] bg-lime-500/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <ScrollReveal className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-lime-400/10 border border-lime-400/20 text-lime-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Real Examples</span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-medium text-white tracking-tight leading-tight mb-4 sm:mb-6">
            Talk to Calby <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 to-emerald-400">
              like a person.
            </span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-zinc-400 font-light leading-relaxed">
            No commands to learn. Just tell Calby what you need.
          </p>
        </ScrollReveal>

        {/* 4 Realistic Conversation Cards (2x2 Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
          {conversations.map((item, idx) => (
            <ScrollReveal key={item.id} delay={idx * 80}>
              <div className="group rounded-[2rem] p-6 border border-white/10 bg-zinc-900/40 hover:bg-zinc-900/70 hover:border-lime-400/30 transition-all duration-200 shadow-xl flex flex-col justify-between h-full backdrop-blur-md">
                <div className="space-y-4 text-xs sm:text-sm">
                  {/* User Input Bubble */}
                  <div className="flex items-start gap-3 flex-row-reverse">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-400 shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="bg-zinc-800/90 px-4 py-3 rounded-2xl rounded-tr-none text-zinc-200 border border-white/5 font-medium leading-relaxed">
                      "{item.user}"
                    </div>
                  </div>

                  {/* Calby Response Bubble */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-900 border border-lime-400/40 p-1 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(163,230,53,0.25)]">
                      <img
                        src="/logo.png"
                        alt="Calby Logo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="bg-lime-400 text-zinc-950 px-4 py-3 rounded-2xl rounded-tl-none font-medium leading-relaxed shadow-[0_4px_20px_rgba(163,230,53,0.15)] whitespace-pre-line">
                      {item.calby}
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Compact Integrations & AI Providers Section */}
        <div id="integrations" className="scroll-mt-32">
          <ScrollReveal delay={120}>
            <div className="rounded-[2.5rem] p-8 sm:p-10 border border-white/10 bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 shadow-2xl relative overflow-hidden backdrop-blur-xl">
              <div className="max-w-4xl mx-auto space-y-10">
                {/* Tools Header & Grid */}
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-lime-400 uppercase tracking-wider mb-2">
                    <Cpu className="w-4 h-4" />
                    <span>Integrations</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-medium text-white mb-6">
                    Works with the tools you already use.
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {tools.map((t) => {
                      const Icon = t.icon;
                      return (
                        <div
                          key={t.name}
                          className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-900/90 border border-white/5 text-zinc-300 text-xs font-medium"
                        >
                          <Icon className="w-4 h-4 text-lime-400 shrink-0" />
                          <span className="truncate">{t.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* AI Providers Badges */}
                <div className="pt-8 border-t border-white/10">
                  <h4 className="text-base sm:text-lg font-medium text-white mb-2">
                    Bring your preferred AI provider.
                  </h4>
                  <p className="text-xs sm:text-sm text-zinc-400 font-light mb-4">
                    Use supported AI providers with your own API key.
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {llmProviders.map((p) => (
                      <span
                        key={p}
                        className="text-xs font-mono text-zinc-300 bg-zinc-950 px-3 py-1.5 rounded-lg border border-white/10 hover:border-lime-400/40 hover:text-white transition-colors"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
