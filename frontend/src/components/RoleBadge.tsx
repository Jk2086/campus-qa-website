import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/services/types";

const styles: Record<Role, string> = {
  student: "bg-secondary text-secondary-foreground",
  mentor: "bg-accent text-accent-foreground",
  faculty: "bg-navy text-navy-foreground",
  admin: "bg-warning/20 text-warning-foreground",
};

const labels: Record<Role, string> = {
  student: "Student",
  mentor: "Mentor",
  faculty: "Faculty",
  admin: "Admin",
};

export function RoleBadge({ role, className }: { role: Role; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide",
        styles[role],
        className,
      )}
    >
      {(role === "mentor" || role === "faculty") && <BadgeCheck className="size-3" aria-hidden />}
      {labels[role]}
    </span>
  );
}
