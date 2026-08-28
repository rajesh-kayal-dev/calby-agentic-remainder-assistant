"use client";

import React from "react";
import { cn } from "@/lib/utils";

// 1. Groq (Orange rounded box with white 'g' mark - exactly matching reference image 3)
export function GroqLogoIcon({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl bg-[#F55036] text-white font-black shadow-sm select-none",
        className || "size-9"
      )}
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none">
        <path
          d="M12 4C7.58 4 4 7.58 4 12C4 16.42 7.58 20 12 20C15.8 20 18.97 17.35 19.78 13.8H12V10.2H20C20 6.78 16.42 4 12 4Z"
          fill="currentColor"
        />
        <path
          d="M12 7.5C9.51 7.5 7.5 9.51 7.5 12C7.5 14.49 9.51 16.5 12 16.5C14.07 16.5 15.8 15.1 16.32 13.2H12V10.8H16.4C15.95 8.9 14.16 7.5 12 7.5Z"
          fill="#F55036"
        />
      </svg>
    </div>
  );
}

// 2. Google Gemini (White box with sparkle star + 'Gemini' text - matching reference image 3)
export function GeminiLogoIcon({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col items-center justify-center rounded-xl bg-white border border-zinc-200 shadow-sm select-none p-1 text-center",
        className || "size-9"
      )}
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none">
        <path
          d="M12 2C12 7.52 7.52 12 2 12C7.52 12 12 16.48 12 22C12 16.48 16.48 12 22 12C16.48 12 12 7.52 12 2Z"
          fill="url(#gemini-sparkle)"
        />
        <defs>
          <linearGradient id="gemini-sparkle" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1BA1E3" />
            <stop offset="60%" stopColor="#5B8DEF" />
            <stop offset="100%" stopColor="#9B51E0" />
          </linearGradient>
        </defs>
      </svg>
      <span className="text-[6.5px] font-bold text-zinc-900 leading-none mt-0.5 tracking-tight">Gemini</span>
    </div>
  );
}

// 3. OpenAI (White box with black spiral rosette logo - matching reference image 1 & 3)
export function OpenAILogoIcon({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl bg-white border border-zinc-200 shadow-sm select-none text-black p-1.5",
        className || "size-9"
      )}
    >
      <svg viewBox="0 0 24 24" className="size-6" fill="currentColor">
        <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9013 6.0074 6.0074 0 0 0-4.3312-1.9213 6.0462 6.0462 0 0 0-5.7642 4.1481 6.0142 6.0142 0 0 0-3.8344 2.6853 6.0462 6.0462 0 0 0 .7497 7.108 5.9847 5.9847 0 0 0 .514 4.9108 6.0462 6.0462 0 0 0 6.5115 2.9013 6.0074 6.0074 0 0 0 4.3312 1.9213 6.0462 6.0462 0 0 0 5.7642-4.1481 6.0142 6.0142 0 0 0 3.8344-2.6853 6.0462 6.0462 0 0 0-.7514-7.108zm-9.3308 11.238a4.4756 4.4756 0 0 1-2.8364-.9975l.1691-.2952 3.666-6.3496a.7844.7844 0 0 1 1.0768-.2877.7844.7844 0 0 1 .2877 1.0768l-3.3283 5.7648a4.4965 4.4965 0 0 1 1.6213 1.0884zm-7.665-3.0305a4.4756 4.4756 0 0 1-.5552-2.9554l.3228.0934 7.0263 2.0308a.7844.7844 0 0 1 .5365.9827.7844.7844 0 0 1-.9827.5365l-6.3725-1.842a4.4965 4.4965 0 0 1-1.0702.154zm-2.0467-8.1969a4.4756 4.4756 0 0 1 2.2812-1.9579l.1537.2882 3.3603 6.3056a.7844.7844 0 0 1-.3022 1.0734.7844.7844 0 0 1-1.0734-.3022l-3.0505-5.724a4.4965 4.4965 0 0 1-.5511-.933zm11.9056-4.5492a4.4756 4.4756 0 0 1 2.8364.9975l-.1691.2952-3.666 6.3496a.7844.7844 0 0 1-1.0768.2877.7844.7844 0 0 1-.2877-1.0768l3.3283-5.7648a4.4965 4.4965 0 0 1-1.6213-1.0884zm7.665 3.0305a4.4756 4.4756 0 0 1 .5552 2.9554l-.3228-.0934-7.0263-2.0308a.7844.7844 0 0 1-.5365-.9827.7844.7844 0 0 1 .9827-.5365l6.3725 1.842a4.4965 4.4965 0 0 1 1.0702-.154zm2.0467 8.1969a4.4756 4.4756 0 0 1-2.2812 1.9579l-.1537-.2882-3.3603-6.3056a.7844.7844 0 0 1 .3022-1.0734.7844.7844 0 0 1 1.0734.3022l3.0505 5.724a4.4965 4.4965 0 0 1 .5511.933z" />
      </svg>
    </div>
  );
}

// 4. Anthropic (White box with bold black 'A\' logo - matching reference image 4)
export function AnthropicLogoIcon({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl bg-white border border-zinc-200 shadow-sm select-none text-black p-1.5",
        className || "size-9"
      )}
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
        <path d="M13.827 3.555h3.633L24 20.444h-3.633l-6.54-16.889zM.001 20.444l6.54-16.889h3.632l6.54 16.889h-3.632l-1.428-3.717H4.493L3.065 20.444H.001zm6.275-8.487h5.176L8.864 5.258 6.276 11.957z" />
      </svg>
    </div>
  );
}

// 5. OpenRouter (White box with splitting double arrows - matching reference image 2 & 4)
export function OpenRouterLogoIcon({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl bg-white border border-zinc-200 shadow-sm select-none p-1.5",
        className || "size-9"
      )}
    >
      <svg viewBox="0 0 512 512" className="size-5" fill="none">
        <path
          d="M0 256c0-23.5 19.1-42.7 42.7-42.7h112.5c73.9 0 138.8-44.5 165.1-113.2l12.7-33.1H310.4c-17.7 0-32-14.3-32-32s14.3-32 32-32H480c17.7 0 32 14.3 32 32v169.6c0 17.7-14.3 32-32 32s-32-14.3-32-32V83.6l-14.9 38.8C398.9 212.5 307.7 277.3 203.7 277.3H42.7C19.1 277.3 0 258.2 0 234.7v21.3z"
          fill="#4A607A"
        />
        <path
          d="M0 256c0 23.5 19.1 42.7 42.7 42.7h112.5c73.9 0 138.8 44.5 165.1 113.2l12.7 33.1H310.4c-17.7 0-32 14.3-32 32s14.3 32 32 32H480c17.7 0 32-14.3 32-32V307.4c0-17.7-14.3-32-32-32s-32 14.3-32 32v65l-14.9-38.8C398.9 253.5 307.7 188.7 203.7 188.7H42.7C19.1 188.7 0 207.8 0 231.3v24.7z"
          fill="#7F9AB5"
        />
      </svg>
    </div>
  );
}

// 6. Ollama (White box with authentic Ollama llama head - matching reference image 4)
export function OllamaLogoIcon({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl bg-white border border-zinc-200 shadow-sm select-none p-1.5",
        className || "size-9"
      )}
    >
      <svg viewBox="0 0 24 24" className="size-5.5" fill="none" stroke="#111" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        {/* Ears */}
        <path d="M7.5 3v5" />
        <path d="M16.5 3v5" />
        {/* Head outline */}
        <path d="M7 8a4 4 0 0 1 10 0v8a4 4 0 0 1-8 0v-4" />
        {/* Eyes */}
        <circle cx="9" cy="11" r="0.75" fill="#111" />
        <circle cx="15" cy="11" r="0.75" fill="#111" />
        {/* Muzzle */}
        <path d="M10 14h4" />
        <path d="M12 14v1.5" />
      </svg>
    </div>
  );
}

// 7. DeepSeek (Dark blue box with white leaping whale logo - matching reference image 4)
export function DeepSeekLogoIcon({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl bg-[#0F1E36] border border-[#1D3256] shadow-sm select-none p-1.5",
        className || "size-9"
      )}
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none">
        <path
          d="M20.5 8.5C18.2 5.3 14.1 4.5 10.5 6C7.5 7.2 5.5 10.2 5.1 13.4C4.8 15.6 5.5 17.9 7 19.5C8.8 21.4 11.6 22.1 14 21.2C16.8 20.1 18.7 17.5 19.1 14.5C19.3 13.2 20.2 11.5 21 10.5L20.5 8.5ZM9.2 11.8C8.5 11.8 8 11.3 8 10.6C8 9.9 8.5 9.4 9.2 9.4C9.9 9.4 10.4 9.9 10.4 10.6C10.4 11.3 9.9 11.8 9.2 11.8Z"
          fill="#FFFFFF"
        />
        <path
          d="M17.5 5.5C18.8 4 20.5 3 22 3C22 5 21 7 19.5 8.5L17.5 5.5Z"
          fill="#FFFFFF"
        />
      </svg>
    </div>
  );
}

// 8. Perplexity AI (White box with teal asterisk book logo - matching reference image 5)
export function PerplexityLogoIcon({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl bg-white border border-zinc-200 shadow-sm select-none p-1.5",
        className || "size-9"
      )}
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="#22A699" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20" />
        <path d="M2 12h20" />
        <path d="M5 5l14 14" />
        <path d="M19 5L5 19" />
        <rect x="7" y="7" width="10" height="10" rx="1.5" />
      </svg>
    </div>
  );
}

// 9. Mistral AI (White box with orange pixelated 'M' logo - matching reference image 5)
export function MistralLogoIcon({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl bg-white border border-zinc-200 shadow-sm select-none p-1.5",
        className || "size-9"
      )}
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none">
        {/* Pixelated Mistral M blocks */}
        <rect x="3" y="4" width="3.5" height="3.5" fill="#FF5E00" />
        <rect x="17.5" y="4" width="3.5" height="3.5" fill="#FF5E00" />
        <rect x="3" y="8.5" width="7" height="3.5" fill="#FF7700" />
        <rect x="14" y="8.5" width="7" height="3.5" fill="#FF7700" />
        <rect x="3" y="13" width="18" height="3.5" fill="#FFA500" />
        <rect x="3" y="17.5" width="3.5" height="3.5" fill="#FF5E00" />
        <rect x="10.25" y="17.5" width="3.5" height="3.5" fill="#FFB703" />
        <rect x="17.5" y="17.5" width="3.5" height="3.5" fill="#FF5E00" />
      </svg>
    </div>
  );
}

// 10. MiniMax (White box with red/pink waveform bars - matching reference image 5)
export function MiniMaxLogoIcon({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl bg-white border border-zinc-200 shadow-sm select-none p-1.5",
        className || "size-9"
      )}
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="#FF4D6D" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 14V10" />
        <path d="M8 17V7" />
        <path d="M12 20V4" />
        <path d="M16 17V7" />
        <path d="M20 14V10" />
      </svg>
    </div>
  );
}

// 11. xAI Grok (White box with bold black 'xI' logo - matching reference image 5)
export function GrokLogoIcon({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl bg-white border border-zinc-200 shadow-sm select-none text-black p-1",
        className || "size-9"
      )}
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
        <path d="M4.5 4.5h3.2l4.8 6.5 4.8-6.5h3.2l-6.4 8.6 6.7 9h-3.2l-5.1-6.9-5.1 6.9H4.5l6.7-9-6.7-8.6z" />
        <rect x="19.5" y="4.5" width="2" height="17.5" rx="0.5" />
      </svg>
    </div>
  );
}

// 12. Z.AI (White box with black rounded frame and 'Z' mark - matching reference image 5)
export function ZAILogoIcon({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl bg-white border border-zinc-200 shadow-sm select-none text-black p-1.5",
        className || "size-9"
      )}
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M4 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H4zm2 2h12a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm2 3.5h8v2l-4.5 5.5H16v2H8v-2l4.5-5.5H8v-2z"
        />
      </svg>
    </div>
  );
}
