"use client";

/**
 * @module components/chat/Welcome
 */

import { useSyncExternalStore } from "react";
import { Logo } from "../ui/Logo";
import { Composer } from "./Composer";
import { SuggestionChips } from "./SuggestionChips";
import { SUGGESTIONS } from "@/app/lib/constants";
import { timeOfDayGreeting } from "@/app/lib/utils";

/** Props for {@link Welcome}. */
export type WelcomeProps = {
  /** Composer text (controlled by the parent so it survives screen changes). */
  input: string;
  /** Update the composer text. */
  onInputChange: (value: string) => void;
  /** Send a message — used by both the composer and the suggestion chips. */
  onSend: (text: string) => void;
  /** Whether a reply is streaming. */
  isStreaming: boolean;
};

/** The time never "changes" in a way React needs to subscribe to here. */
const subscribeNoop = () => () => {};
/** Shown during SSR/prerender, where the visitor's local time isn't known. */
const serverGreeting = () => "Welcome";

/**
 * Empty state for a new chat: a time-of-day greeting, a large composer and
 * starter suggestions, vertically centred (slightly above middle).
 *
 * The greeting is read through `useSyncExternalStore` so the server renders
 * `"Welcome"` and the client switches to e.g. `"Good evening"` right after
 * hydration, with no hydration mismatch warning and no blocked static prerender.
 */
export function Welcome({ input, onInputChange, onSend, isStreaming }: WelcomeProps) {
  const greeting = useSyncExternalStore(subscribeNoop, timeOfDayGreeting, serverGreeting);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 pb-[12vh]">
      <div className="w-full max-w-2xl animate-fade-up">
        <h2 className="mb-8 flex items-center justify-center gap-3 text-center font-serif text-4xl font-light tracking-tight sm:text-[2.6rem]">
          <Logo spinning className="size-9" />
          {greeting}
        </h2>

        <Composer
          variant="hero"
          autoFocus
          value={input}
          onChange={onInputChange}
          onSend={() => onSend(input)}
          isStreaming={isStreaming}
        />

        <div className="mt-4">
          <SuggestionChips suggestions={SUGGESTIONS} onSelect={onSend} />
        </div>
      </div>
    </div>
  );
}
