"use client";

import React, { useState, useRef, useEffect } from "react";
import { Mic, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  onStartListening?: () => void;
  onError: (errorMsg: string) => void;
  disabled?: boolean;
}

export function VoiceInputButton({
  onTranscript,
  onStartListening,
  onError,
  disabled = false,
}: VoiceInputButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startListening = () => {
    if (disabled) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      onError("Voice input is not supported in this browser.");
      return;
    }

    try {
      if (onStartListening) {
        onStartListening();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = 0; i < event.results.length; ++i) {
          const transcriptText = event.results[i][0]?.transcript || "";
          if (event.results[i].isFinal) {
            finalTranscript += transcriptText;
          } else {
            interimTranscript += transcriptText;
          }
        }

        const combined = (finalTranscript + " " + interimTranscript).trim();
        if (combined) {
          onTranscript(combined);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === "no-speech") return;
        setIsListening(false);
        if (event.error === "not-allowed" || event.error === "permission-denied") {
          onError("Microphone permission denied. Please allow mic access in browser settings.");
        } else {
          onError(`Voice recognition error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
      onError("Failed to start voice recognition.");
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  return (
    <button
      type="button"
      aria-label={isListening ? "Stop listening" : "Voice input"}
      onClick={() => {
        if (isListening) {
          stopListening();
        } else {
          startListening();
        }
      }}
      disabled={disabled}
      className={cn(
        "relative flex size-8 items-center justify-center rounded-xl transition-all cursor-pointer border",
        isListening
          ? "bg-red-950/80 border-red-700 text-red-400 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.5)]"
          : "bg-zinc-800/80 border-zinc-700/60 text-zinc-400 hover:bg-zinc-700 hover:text-white",
        disabled && "opacity-50 pointer-events-none",
      )}
      title={isListening ? "Listening... Click to stop" : "Voice input"}
    >
      <Mic className={cn("size-4", isListening && "animate-bounce text-red-400")} />
    </button>
  );
}
