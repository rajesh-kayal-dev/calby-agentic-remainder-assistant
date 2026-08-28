// client/src/lib/alert-sound.ts
// Real-time audio alert synthesizer with selectable ringtones, volume control, and preview support

export type RingtoneOption =
  | "calby_bell"
  | "classic_alarm"
  | "soft_chime"
  | "digital"
  | "gentle_reminder"
  | "silent"
  | "chime"
  | "bell"
  | "marimba"
  | "radar";

export const RINGTONE_OPTIONS: { id: string; label: string }[] = [
  { id: "calby_bell", label: "Calby Bell" },
  { id: "classic_alarm", label: "Classic Alarm" },
  { id: "soft_chime", label: "Soft Chime" },
  { id: "digital", label: "Digital" },
  { id: "gentle_reminder", label: "Gentle Reminder" },
  { id: "silent", label: "Silent" },
];

let activeAudioContext: AudioContext | null = null;
let activeInterval: any = null;
let stopTimeout: any = null;
let isPlayingSound = false;

function playToneForRingtone(
  ctx: AudioContext,
  ringtone: string = "calby_bell",
  volumeScale: number = 0.7
) {
  if (ringtone === "silent" || volumeScale <= 0) return;

  const now = ctx.currentTime;
  const vol = Math.max(0, Math.min(1, volumeScale));

  // Master Gain Node for Volume Control
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(vol, now);
  masterGain.connect(ctx.destination);

  switch (ringtone) {
    case "classic_alarm":
    case "bell": {
      // Classic Alarm: Sharp resonant bells
      const freqs = [880, 1760, 2640];
      const gains = [0.35, 0.18, 0.09];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(gains[idx], now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 1.25);
      });
      break;
    }

    case "digital": {
      // Digital: 3 crisp electronic pulses
      [0, 0.12, 0.24].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(1046.5, now + offset); // C6
        gain.gain.setValueAtTime(0.15, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.08);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now + offset);
        osc.stop(now + offset + 0.09);
      });
      break;
    }

    case "gentle_reminder":
    case "marimba": {
      // Gentle Reminder: Warm harmonic triad (C5, E5, G5)
      const chord = [523.25, 659.25, 783.99];
      chord.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + i * 0.06);
        gain.gain.setValueAtTime(0.28, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.5);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.55);
      });
      break;
    }

    case "soft_chime":
    case "radar": {
      // Soft Chime: Smooth sweep with soft decay
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.25);
      gain.gain.setValueAtTime(0.26, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.95);
      break;
    }

    case "calby_bell":
    case "chime":
    default: {
      // Calby Bell: Harmonic Chime (E5 -> B5 -> E6)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc1.connect(gain1);
      gain1.connect(masterGain);
      osc1.start(now);
      osc1.stop(now + 0.5);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(987.77, now + 0.12);
      gain2.gain.setValueAtTime(0.24, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc2.connect(gain2);
      gain2.connect(masterGain);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.65);

      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = "sine";
      osc3.frequency.setValueAtTime(1318.51, now + 0.24);
      gain3.gain.setValueAtTime(0.2, now + 0.24);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc3.connect(gain3);
      gain3.connect(masterGain);
      osc3.start(now + 0.24);
      osc3.stop(now + 0.85);
      break;
    }
  }
}

export function previewRingtone(ringtone: string = "calby_bell", volumePercent: number = 70): void {
  stopAlarmSound();
  if (ringtone === "silent" || volumePercent <= 0) return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    playToneForRingtone(ctx, ringtone, volumePercent / 100);

    setTimeout(() => {
      if (ctx.state !== "closed") {
        ctx.close().catch(() => {});
      }
    }, 1500);
  } catch (err) {
    console.warn("Ringtone preview error:", err);
  }
}

export function playAlarmSound(
  durationSeconds: number = 10,
  ringtone: string = "calby_bell",
  volumePercent: number = 70
): void {
  stopAlarmSound();
  if (ringtone === "silent" || volumePercent <= 0) return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    activeAudioContext = new AudioContextClass();
    if (activeAudioContext.state === "suspended") {
      activeAudioContext.resume().catch(() => {});
    }

    isPlayingSound = true;
    const volScale = volumePercent / 100;

    // Play immediately
    playToneForRingtone(activeAudioContext, ringtone, volScale);

    // Repeat every 1.3 seconds
    activeInterval = setInterval(() => {
      if (activeAudioContext && isPlayingSound) {
        playToneForRingtone(activeAudioContext, ringtone, volScale);
      }
    }, 1300);

    // Auto-stop at max duration
    const maxDurationMs = Math.min(10000, durationSeconds * 1000);
    stopTimeout = setTimeout(() => {
      stopAlarmSound();
    }, maxDurationMs);
  } catch (err) {
    console.warn("playAlarmSound error:", err);
  }
}

export function stopAlarmSound(): void {
  isPlayingSound = false;

  if (activeInterval) {
    clearInterval(activeInterval);
    activeInterval = null;
  }

  if (stopTimeout) {
    clearTimeout(stopTimeout);
    stopTimeout = null;
  }

  if (activeAudioContext && activeAudioContext.state !== "closed") {
    try {
      activeAudioContext.close().catch(() => {});
    } catch {
      // ignore
    }
    activeAudioContext = null;
  }
}

// Export backwards-compatible alias
export const RINGTONE_LABELS = RINGTONE_OPTIONS;
