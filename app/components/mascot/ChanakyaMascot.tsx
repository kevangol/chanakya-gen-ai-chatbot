"use client";

/**
 * @module components/mascot/ChanakyaMascot
 */

import { useEffect, useState, useSyncExternalStore } from "react";
import { ChanakyaFigure, type MascotMood, type MascotPose } from "./ChanakyaFigure";
import { cn } from "@/app/lib/utils";

/** Props for {@link ChanakyaMascot}. */
export type ChanakyaMascotProps = {
  /** Current chat activity, derived from the streaming state in `Chat`. */
  mood: MascotMood;
};

/** One "beat" of the mascot's body language, in ms. Every timed behaviour counts in beats. */
const BEAT_MS = 2600;

/**
 * Idle routine, one entry per beat. Repeating an entry holds that pose for
 * longer, and `rest` between gestures keeps him from fidgeting.
 */
const IDLE_ROUTINE: MascotPose[] = [
  "rest", "rest", "blessing", "blessing",
  "rest", "rest", "hip", "hip",
  "rest", "rest", "namaste", "namaste",
];

/** While speaking he alternates between these, one per beat. */
const SPEAKING_GESTURES: MascotPose[] = ["point", "palm"];

/** How many beats the namaste greeting lasts (on load and after each answer). */
const GREETING_BEATS = 2;

/** Sayings popularly attributed to Chanakya (Chanakya Niti), shown on hover. */
const QUOTES = [
  "Education is the best friend. An educated person is respected everywhere.",
  "Before you start some work, ask: why am I doing it, what may the results be, and will I succeed?",
  "A person should not be too honest. Straight trees are cut first.",
  "Once you start working on something, don't be afraid of failure.",
  "The fragrance of flowers spreads only with the wind, but the goodness of a person spreads everywhere.",
  "Treat your child like a darling for five years, discipline them for ten, then treat them as a friend.",
];

/* ---------------------- prefers-reduced-motion (as a store) ---------------------- */
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
function subscribeReducedMotion(onChange: () => void) {
  const mql = window.matchMedia(REDUCED_MOTION);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}
const getReducedMotion = () => window.matchMedia(REDUCED_MOTION).matches;
const getReducedMotionServer = () => false;

/**
 * Pick the pose for this moment.
 *
 * @param mood - Chat activity.
 * @param beat - Monotonic beat counter.
 * @param greeting - Whether the namaste greeting is active.
 * @param reducedMotion - If true, idle stays still on `rest` instead of cycling.
 */
function choosePose(mood: MascotMood, beat: number, greeting: boolean, reducedMotion: boolean): MascotPose {
  if (mood === "thinking") return "thinking";
  if (mood === "speaking") return SPEAKING_GESTURES[beat % SPEAKING_GESTURES.length];
  if (greeting) return "namaste";
  return reducedMotion ? "rest" : IDLE_ROUTINE[beat % IDLE_ROUTINE.length];
}

/**
 * Animated, full-body Chanakya mascot fixed to the bottom-right corner.
 *
 * Body language:
 * - **greeting**: namaste with closed eyes and a "Namaste" bubble, when the page
 *   loads and again each time an answer finishes
 * - **idle**: a slow routine of resting with the staff → blessing (abhaya mudra)
 *   → hand on hip → namaste
 * - **thinking**: hand on chin, foot tapping, thought dots
 * - **speaking**: alternates raised teaching finger ↔ open explaining palm
 *
 * Speech bubble: shown automatically while greeting/thinking/speaking; while idle
 * it appears on hover (or when pinned by click) with a rotating Chanakya Niti quote.
 *
 * Shown only on extra-wide screens (`xl`, ≥1280px), where the corner is free.
 */
export function ChanakyaMascot({ mood }: ChanakyaMascotProps) {
  const [beat, setBeat] = useState(0);
  const [greetFromBeat, setGreetFromBeat] = useState(0); // greet on load (beat 0)
  const [prevMood, setPrevMood] = useState(mood);
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, getReducedMotionServer);

  // The heartbeat that drives every timed behaviour. setState runs in the timer callback.
  useEffect(() => {
    const id = setInterval(() => setBeat((b) => b + 1), BEAT_MS);
    return () => clearInterval(id);
  }, []);

  // When an answer finishes (speaking → idle), greet again. This uses React's
  // "adjust state while rendering" pattern rather than an effect.
  if (mood !== prevMood) {
    setPrevMood(mood);
    if (prevMood === "speaking" && mood === "idle") setGreetFromBeat(beat);
  }

  const greeting = mood === "idle" && beat - greetFromBeat < GREETING_BEATS;
  const pose = choosePose(mood, beat, greeting, reducedMotion);

  const line =
    mood === "thinking"
      ? "Let me consult the texts…"
      : mood === "speaking"
        ? "Listen carefully…"
        : greeting
          ? "Namaste 🙏 Ask me anything from the texts."
          : QUOTES[Math.floor(beat / 3) % QUOTES.length];
  const isQuote = mood === "idle" && !greeting;
  const showBubble = !isQuote || pinned || hovered;

  return (
    <div className="pointer-events-none fixed bottom-3 right-3 z-30 hidden flex-col items-end gap-1 xl:flex">
      {showBubble && (
        <div
          key={line}
          role="status"
          className="relative mr-6 max-w-52 animate-fade-up rounded-2xl border border-line bg-surface px-3.5 py-2.5 font-serif text-[13px] leading-snug shadow-[0_0.25rem_1.25rem_rgba(0,0,0,0.08)]"
        >
          {isQuote && <span className="mb-1 block font-sans text-[10px] uppercase tracking-wide text-muted">Chanakya Niti</span>}
          {line}
          {/* Bubble tail pointing at the figure */}
          <span className="absolute -bottom-1.5 right-6 size-3 rotate-45 border-b border-r border-line bg-surface" />
        </div>
      )}

      <button
        type="button"
        onClick={() => setPinned((p) => !p)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label={pinned ? "Hide Chanakya's quote" : "Show a Chanakya quote"}
        aria-pressed={pinned}
        className={cn(
          "pointer-events-auto rounded-2xl transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-accent",
          mood === "speaking" && "scale-105",
        )}
      >
        <ChanakyaFigure pose={pose} className="h-48 w-auto drop-shadow-md" />
      </button>
    </div>
  );
}
