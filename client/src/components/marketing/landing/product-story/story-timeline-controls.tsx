"use client";

import { Play, Pause, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { StorySceneConfig } from "./types";

interface StoryTimelineControlsProps {
  scenes: StorySceneConfig[];
  currentSceneIndex: number;
  isPlaying: boolean;
  sceneProgress: number;
  onSelectScene: (index: number) => void;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export function StoryTimelineControls({
  scenes,
  currentSceneIndex,
  isPlaying,
  sceneProgress,
  onSelectScene,
  onTogglePlay,
  onNext,
  onPrev,
}: StoryTimelineControlsProps) {
  return (
    <div className="w-full space-y-4">
      {/* Top Progress Segment Bar */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {scenes.map((scene, idx) => {
          const isCurrent = idx === currentSceneIndex;
          const isPassed = idx < currentSceneIndex;
          const progressPercent = isCurrent ? sceneProgress * 100 : isPassed ? 100 : 0;

          return (
            <button
              key={scene.id}
              onClick={() => onSelectScene(idx)}
              className="group relative h-1.5 sm:h-2 rounded-full bg-zinc-800/80 overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400"
              aria-label={`Jump to scene ${idx + 1}: ${scene.label}`}
            >
              <div
                className={`h-full transition-all duration-75 ${
                  isCurrent
                    ? "bg-lime-400 shadow-[0_0_10px_rgba(163,230,53,0.8)]"
                    : isPassed
                    ? "bg-zinc-400 group-hover:bg-lime-400/70"
                    : "bg-transparent"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </button>
          );
        })}
      </div>

      {/* Control Actions & Scene Selector Tabs */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Scene Pill Buttons (Scrollable on small screens) */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 md:pb-0 scrollbar-none" role="tablist">
          {scenes.map((scene, idx) => {
            const isCurrent = idx === currentSceneIndex;
            return (
              <button
                key={scene.id}
                role="tab"
                aria-selected={isCurrent}
                onClick={() => onSelectScene(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 ${
                  isCurrent
                    ? "bg-lime-400/10 text-lime-400 border border-lime-400/30 shadow-sm"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent"
                }`}
              >
                {scene.label}
              </button>
            );
          })}
        </div>

        {/* Playback Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onPrev}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400"
            aria-label="Previous scene"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={onTogglePlay}
            className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/5 transition-colors flex items-center gap-1.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400"
            aria-label={isPlaying ? "Pause animation" : "Play animation"}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 text-lime-400" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-lime-400 fill-current" />
                <span>Play</span>
              </>
            )}
          </button>

          <button
            onClick={onNext}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400"
            aria-label="Next scene"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
