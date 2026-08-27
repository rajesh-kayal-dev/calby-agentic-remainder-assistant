"use client";

import { useStoryAnimation } from "./use-story-animation";
import { StoryTimelineControls } from "./story-timeline-controls";
import { ChaosScene } from "./scenes/chaos-scene";
import { IntroScene } from "./scenes/intro-scene";
import { ConversationScene } from "./scenes/conversation-scene";
import { ConnectedWorkspaceScene } from "./scenes/connected-workspace-scene";
import { FollowUpScene } from "./scenes/follow-up-scene";
import { ReportsScene } from "./scenes/reports-scene";
import { PayoffScene } from "./scenes/payoff-scene";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Sparkles, Terminal } from "lucide-react";

export function LandingProductStory() {
  const {
    currentSceneIndex,
    currentScene,
    scenes,
    isPlaying,
    sceneProgress,
    goToScene,
    nextScene,
    prevScene,
    togglePlay,
  } = useStoryAnimation(true);

  const renderScene = () => {
    switch (currentScene.id) {
      case "chaos":
        return <ChaosScene />;
      case "intro":
        return <IntroScene />;
      case "conversation":
        return <ConversationScene />;
      case "connected":
        return <ConnectedWorkspaceScene />;
      case "followup":
        return <FollowUpScene />;
      case "reports":
        return <ReportsScene />;
      case "payoff":
        return <PayoffScene />;
      default:
        return <ChaosScene />;
    }
  };

  return (
    <section id="how-it-works" className="py-24 sm:py-32 relative overflow-hidden border-t border-white/5 bg-zinc-950/70">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[550px] bg-lime-500/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <ScrollReveal className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-lime-400/10 border border-lime-400/20 text-lime-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Story · How Calby Works</span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-medium text-white tracking-tight leading-tight mb-4 sm:mb-6">
            From daily mental chaos <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 to-emerald-400">
              to one clean workflow.
            </span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-zinc-400 font-light leading-relaxed">
            Watch how Calby transforms scattered to-dos, loan balances, and meeting requests into structured, automated action.
          </p>
        </ScrollReveal>

        {/* Master 16:9 Animation Showcase Window */}
        <ScrollReveal scale delay={80} className="w-full max-w-5xl mx-auto space-y-6">
          <div className="relative rounded-[2.5rem] p-1 bg-gradient-to-b from-zinc-700/40 via-zinc-800/20 to-zinc-900/40 shadow-2xl">
            <div className="relative bg-zinc-950 rounded-[2.3rem] border border-zinc-800 overflow-hidden shadow-2xl flex flex-col">
              {/* Window Header Bar */}
              <div className="h-12 border-b border-zinc-800/80 px-5 flex items-center justify-between bg-zinc-950/90 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  <span className="ml-2 text-xs font-mono text-zinc-500 hidden sm:inline">
                    calby.app/story · {currentScene.badge}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-lime-400">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Scene {currentSceneIndex + 1} of {scenes.length}</span>
                </div>
              </div>

              {/* 16:9 Responsive Stage Container */}
              <div className="relative w-full aspect-video min-h-[360px] sm:min-h-[460px] lg:min-h-[500px] flex items-center justify-center bg-radial-gradient">
                {renderScene()}
              </div>
            </div>
          </div>

          {/* Interactive Timeline & Control Bar */}
          <StoryTimelineControls
            scenes={scenes}
            currentSceneIndex={currentSceneIndex}
            isPlaying={isPlaying}
            sceneProgress={sceneProgress}
            onSelectScene={goToScene}
            onTogglePlay={togglePlay}
            onNext={nextScene}
            onPrev={prevScene}
          />
        </ScrollReveal>
      </div>
    </section>
  );
}
