import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function UrgentBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-600/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-red-700 dark:text-red-300 animate-pulse",
        className,
      )}
    >
      <span className="relative flex size-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-red-600" />
      </span>
      <AlertCircle className="size-3" aria-hidden />
      <span>URGENT HELP</span>
    </span>
  );
}
