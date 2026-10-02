import { Award, GraduationCap, ShieldCheck, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/services/types";

const styles: Record<Role, string> = {
  student: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/25",
  mentor: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/35 font-semibold",
  faculty: "bg-amber-900/15 text-amber-950 dark:text-amber-200 border-amber-900/30 font-bold",
  admin: "bg-red-500/15 text-red-800 dark:text-red-300 border-red-500/35 font-semibold",
};

const labels: Record<Role, string> = {
  student: "Student",
  mentor: "Peer Mentor",
  faculty: "Faculty",
  admin: "Admin",
};

export function RoleBadge({ role, className }: { role: Role; className?: string }) {
  const Icon =
    role === "faculty"
      ? Award
      : role === "mentor"
        ? UserCheck
        : role === "admin"
          ? ShieldCheck
          : GraduationCap;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] tracking-wide",
        styles[role],
        className,
      )}
    >
      <Icon className="size-3 shrink-0" aria-hidden />
      <span>{labels[role]}</span>
    </span>
  );
}
