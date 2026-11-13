/**
 * @module components/ui/IconButton
 */

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/app/lib/utils";

/** Props for {@link IconButton}. */
export type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  /**
   * Accessible name. Used as both `aria-label` and the native `title` tooltip,
   * since an icon-only button has no visible text.
   */
  label: string;
  /** The icon to render — typically a lucide-react component. */
  children: ReactNode;
  /** `"sm"` (28px) for inline message actions, `"md"` (32px) for toolbars. */
  size?: "sm" | "md";
};

/**
 * A square, borderless, icon-only button with a subtle hover background.
 *
 * @example
 * <IconButton label="New chat" onClick={onNew}>
 *   <Plus className="size-4" />
 * </IconButton>
 */
export function IconButton({ label, children, size = "md", className, type = "button", ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg text-muted transition-colors",
        "hover:bg-muted-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-accent",
        size === "sm" ? "size-7" : "size-8",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
