/**
 * @module components/ui/Logo
 */

import { ShipWheel } from "lucide-react";
import { cn } from "@/app/lib/utils";

/** Props for {@link Logo}. */
export type LogoProps = {
  /** Extra classes — use Tailwind `size-*` to size the mark. */
  className?: string;
  /**
   * Slowly rotate the mark. Used on the welcome screen and as the
   * "thinking" indicator while an answer is being prepared.
   */
  spinning?: boolean;
};

/**
 * Brand mark: a wheel (chakra) in the accent colour.
 *
 * Decorative only (`aria-hidden`) — always pair it with visible text such as the app name.
 */
export function Logo({ className, spinning = false }: LogoProps) {
  return (
    <ShipWheel
      aria-hidden
      strokeWidth={1.75}
      className={cn("text-accent", spinning && "animate-spin-slow", className)}
    />
  );
}
