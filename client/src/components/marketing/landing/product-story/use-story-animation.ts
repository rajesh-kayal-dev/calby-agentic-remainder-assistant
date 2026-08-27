"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { STORY_SCENES, StorySceneConfig } from "./types";

export function useStoryAnimation(autoPlay: boolean = true) {
  const [currentSceneIndex, setCurrentSceneIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);
  const [isReducedMotion, setIsReducedMotion] = useState<boolean>(false);
  const [sceneProgress, setSceneProgress] = useState<number>(0);

  const sceneStartTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const currentScene: StorySceneConfig = STORY_SCENES[currentSceneIndex] || STORY_SCENES[0];

  // Detect prefers-reduced-motion
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setIsReducedMotion(mediaQuery.matches);

      const handler = (e: MediaQueryListEvent) => {
        setIsReducedMotion(e.matches);
        if (e.matches) {
          setIsPlaying(false);
        }
      };

      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, []);

  const goToScene = useCallback((index: number) => {
    const validIndex = (index + STORY_SCENES.length) % STORY_SCENES.length;
    setCurrentSceneIndex(validIndex);
    sceneStartTimeRef.current = Date.now();
    setSceneProgress(0);
  }, []);

  const nextScene = useCallback(() => {
    goToScene(currentSceneIndex + 1);
  }, [currentSceneIndex, goToScene]);

  const prevScene = useCallback(() => {
    goToScene(currentSceneIndex - 1);
  }, [currentSceneIndex, goToScene]);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => {
      if (!prev) {
        sceneStartTimeRef.current = Date.now();
      }
      return !prev;
    });
  }, []);

  // Frame ticker for progress bar
  useEffect(() => {
    if (!isPlaying || isReducedMotion) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const updateProgress = () => {
      const elapsed = Date.now() - sceneStartTimeRef.current;
      const duration = currentScene.durationMs;
      const prog = Math.min(elapsed / duration, 1);
      setSceneProgress(prog);

      if (prog < 1) {
        animFrameRef.current = requestAnimationFrame(updateProgress);
      }
    };

    animFrameRef.current = requestAnimationFrame(updateProgress);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, currentSceneIndex, currentScene.durationMs, isReducedMotion]);

  // Scene transition timer
  useEffect(() => {
    if (!isPlaying || isReducedMotion) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    sceneStartTimeRef.current = Date.now();
    setSceneProgress(0);

    timerRef.current = setTimeout(() => {
      setCurrentSceneIndex((prev) => (prev + 1) % STORY_SCENES.length);
    }, currentScene.durationMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentSceneIndex, currentScene.durationMs, isReducedMotion]);

  return {
    currentSceneIndex,
    currentScene,
    scenes: STORY_SCENES,
    isPlaying,
    isReducedMotion,
    sceneProgress,
    goToScene,
    nextScene,
    prevScene,
    togglePlay,
    setIsPlaying,
  };
}
