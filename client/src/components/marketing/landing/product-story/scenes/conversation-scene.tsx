"use client";

import { User, IndianRupee, Bell, CalendarCheck } from "lucide-react";

export function ConversationScene() {
  const steps = [
    {
      user: "Rahul owes me 350.",
      calby: "Added ₹350 to Rahul's pending list.",
      icon: IndianRupee,
      tag: "Money",
      color: "border-amber-400/20 text-amber-300",
    },
    {
      user: "Remind me tomorrow.",
      calby: "Reminder set for tomorrow at 9:00 AM.",
      icon: Bell,
      tag: "Reminder",
      color: "border-sky-400/20 text-sky-300",
    },
    {
      user: "Find me 30 minutes with Sarah tomorrow.",
      calby: "Found open slot: 10:30–11:00 AM.",
      icon: CalendarCheck,
      tag: "Calendar",
      color: "border-lime-400/20 text-lime-300",
    },
  ];

  return (
    <div className="relative w-full h-full flex flex-col justify-center p-4 sm:p-6 select-none overflow-hidden">
      <div className="w-full max-w-xl mx-auto space-y-3">
        {steps.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="glass-card rounded-2xl p-3.5 sm:p-4 border border-white/10 bg-zinc-900/60 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            >
              {/* User Prompt */}
              <div className="flex items-center gap-2 text-xs sm:text-sm text-zinc-200">
                <div className="w-6 h-6 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-400 shrink-0 text-[10px]">
                  <User className="w-3 h-3" />
                </div>
                <span className="font-medium">"{item.user}"</span>
              </div>

              {/* Calby Response */}
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-md border ${item.color} bg-zinc-950/80`}>
                  {item.tag}
                </span>
                <div className="bg-lime-400 text-zinc-950 px-3 py-1.5 rounded-xl font-medium shadow-sm flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.calby}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
