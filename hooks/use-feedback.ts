"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useWebHaptics } from "web-haptics/react";

type Sound = "tap" | "pass" | "retry" | "unlock";
type Celebration = "round" | "room";

const SOUND_FILES: Record<Sound, string> = {
  tap: "/sounds/tap.wav",
  pass: "/sounds/pass.wav",
  retry: "/sounds/retry.wav",
  unlock: "/sounds/unlock.wav",
};

const VOLUMES: Record<Sound, number> = {
  tap: 0.16,
  pass: 0.28,
  retry: 0.2,
  unlock: 0.34,
};

export function useFeedback() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audio = useRef<Partial<Record<Sound, HTMLAudioElement>>>({});
  const { trigger } = useWebHaptics();

  useEffect(() => {
    const sounds = Object.entries(SOUND_FILES) as [Sound, string][];
    for (const [name, source] of sounds) {
      const element = new Audio(source);
      element.preload = "auto";
      element.volume = VOLUMES[name];
      audio.current[name] = element;
    }

    return () => {
      for (const element of Object.values(audio.current)) element?.pause();
      audio.current = {};
    };
  }, []);

  const play = useCallback((name: Sound) => {
    if (!soundEnabled) return;
    const element = audio.current[name];
    if (!element) return;
    element.currentTime = 0;
    void element.play().catch(() => undefined);
  }, [soundEnabled]);

  const confetti = useCallback(async (kind: Celebration) => {
    const { default: fire } = await import("canvas-confetti");
    const colours = ["#006548", "#003e2f", "#c4a356", "#f7f8f5"];

    if (kind === "round") {
      fire({
        particleCount: 34,
        spread: 52,
        startVelocity: 24,
        origin: { y: 0.72 },
        colors: colours,
        scalar: 0.82,
        ticks: 150,
        disableForReducedMotion: true,
      });
      return;
    }

    const burst = (x: number) => fire({
      particleCount: 64,
      angle: x < 0.5 ? 58 : 122,
      spread: 62,
      startVelocity: 42,
      origin: { x, y: 0.72 },
      colors: colours,
      scalar: 0.95,
      ticks: 210,
      disableForReducedMotion: true,
    });
    burst(0.08);
    burst(0.92);
  }, []);

  const tap = useCallback(() => {
    void trigger("selection");
    play("tap");
  }, [play, trigger]);

  const verdict = useCallback((passed: boolean) => {
    void trigger(passed ? "success" : "error");
    play(passed ? "pass" : "retry");
    if (passed) void confetti("round");
  }, [confetti, play, trigger]);

  const unlock = useCallback(() => {
    void trigger("success");
    play("unlock");
    void confetti("room");
  }, [confetti, play, trigger]);

  const warning = useCallback(() => {
    void trigger("warning");
    play("retry");
  }, [play, trigger]);

  return {
    soundEnabled,
    tap,
    toggleSound: () => setSoundEnabled((enabled) => !enabled),
    unlock,
    verdict,
    warning,
  };
}
