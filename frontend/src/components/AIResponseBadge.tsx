import { cn } from "@/lib/utils";
import type { ResponseType } from "@/services/types";
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Compass,
  FileCheck,
  HelpCircle,
  Sparkles,
  UserCheck,
  Zap,
} from "lucide-react";

interface Props {
  type: ResponseType;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const config: Record<
  ResponseType,
  { label: string; icon: typeof Zap; bg: string; text: string; border: string }
> = {
  quick: {
    label: "⚡ Quick Answer",
    icon: Zap,
    bg: "bg-amber-500/12 text-amber-800 dark:text-amber-300",
    text: "text-amber-800 dark:text-amber-300",
    border: "border-amber-500/30",
  },
  verified_campus: {
    label: "✓ Verified Campus Answer",
    icon: CheckCircle2,
    bg: "bg-emerald-500/12 text-emerald-800 dark:text-emerald-300",
    text: "text-emerald-800 dark:text-emerald-300",
    border: "border-emerald-500/30",
  },
  ai_suggested: {
    label: "🤖 AI Suggested Answer",
    icon: Sparkles,
    bg: "bg-blue-500/12 text-blue-800 dark:text-blue-300",
    text: "text-blue-800 dark:text-blue-300",
    border: "border-blue-500/30",
  },
  peer: {
    label: "👤 Peer Answer",
    icon: UserCheck,
    bg: "bg-indigo-500/12 text-indigo-800 dark:text-indigo-300",
    text: "text-indigo-800 dark:text-indigo-300",
    border: "border-indigo-500/30",
  },
  faculty_verified: {
    label: "🎓 Faculty Verified",
    icon: Award,
    bg: "bg-amber-600/15 text-amber-900 dark:text-amber-200 font-semibold",
    text: "text-amber-900 dark:text-amber-200",
    border: "border-amber-600/40 shadow-xs",
  },
  campus_guidance: {
    label: "🧭 Campus Guidance",
    icon: Compass,
    bg: "bg-sky-500/12 text-sky-800 dark:text-sky-300",
    text: "text-sky-800 dark:text-sky-300",
    border: "border-sky-500/30",
  },
  task_guidance: {
    label: "📋 Task Guidance",
    icon: FileCheck,
    bg: "bg-purple-500/12 text-purple-800 dark:text-purple-300",
    text: "text-purple-800 dark:text-purple-300",
    border: "border-purple-500/30",
  },
  human_requested: {
    label: "🟡 Human Help Requested",
    icon: HelpCircle,
    bg: "bg-yellow-500/15 text-yellow-800 dark:text-yellow-300",
    text: "text-yellow-800 dark:text-yellow-300",
    border: "border-yellow-500/35",
  },
  ai_uncertain: {
    label: "⚠ AI Uncertain / Needs Human Help",
    icon: AlertTriangle,
    bg: "bg-rose-500/12 text-rose-800 dark:text-rose-300",
    text: "text-rose-800 dark:text-rose-300",
    border: "border-rose-500/35",
  },
};

export function AIResponseBadge({ type, className, size = "md" }: Props) {
  const meta = config[type] ?? config.ai_suggested;
  const Icon = meta.icon;

  const sizeClass =
    size === "sm"
      ? "px-2 py-0.5 text-[10px] gap-1"
      : size === "lg"
        ? "px-3.5 py-1.5 text-xs font-semibold gap-1.5"
        : "px-2.5 py-1 text-[11px] font-medium gap-1.5";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border",
        meta.bg,
        meta.border,
        sizeClass,
        className,
      )}
    >
      <Icon className={size === "sm" ? "size-3 shrink-0" : "size-3.5 shrink-0"} aria-hidden />
      <span>{meta.label}</span>
    </span>
  );
}
