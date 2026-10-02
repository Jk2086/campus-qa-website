import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertCircle,
  Award,
  Bell,
  CheckCheck,
  CheckCircle2,
  GraduationCap,
  Megaphone,
  MessageSquare,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { AppShell, PageHeading } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { timeAgo, useSession } from "@/lib/session";
import { cn } from "@/lib/utils";
import { notifications as api } from "@/services/notifications";
import type { NotificationItem } from "@/services/types";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications · CAMPUS-Q&A" },
      { name: "description", content: "Stay updated on campus answers, faculty verification, and urgent requests." },
    ],
  }),
  component: Notifications,
});

const icons: Record<string, React.ComponentType<{ className?: string }>> = {
  answer: MessageSquare,
  accepted: CheckCircle2,
  faculty_verification: Award,
  mentor_request: GraduationCap,
  urgent_question: AlertCircle,
  relevant_question: Sparkles,
  moderation_action: ShieldAlert,
  announcement: Megaphone,
};

function Notifications() {
  const { user } = useSession();
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const [filterType, setFilterType] = useState<string>("all");

  const load = (id: string, type?: string) =>
    void api.getNotifications(id, type).then((r) => setItems([...r]));

  useEffect(() => {
    if (user) load(user.id, filterType);
  }, [user, filterType]);

  if (!user) return null;

  const unreadCount = (items ?? []).filter((n) => !n.read).length;

  return (
    <AppShell user={user}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <PageHeading
            title="Notification Center"
            subtitle="Real-time campus alerts, faculty endorsements, and mentor responses."
          />
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <span className="rounded-full bg-red-600/15 px-3 py-1 text-xs font-bold text-red-700 dark:text-red-300">
              {unreadCount} unread
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await api.markAllRead(user.id);
              load(user.id, filterType);
            }}
            className="text-xs font-semibold gap-1.5"
          >
            <CheckCheck className="size-3.5" />
            <span>Mark all as read</span>
          </Button>
        </div>
      </div>

      {/* Categories Filter Tabs (Section 15) */}
      <div className="flex flex-wrap gap-1.5 border-b border-border pb-3 mb-4 text-xs">
        {[
          { id: "all", label: "All Alerts" },
          { id: "answer", label: "Answers & Solutions" },
          { id: "faculty_verification", label: "🎓 Faculty Verifications" },
          { id: "urgent_question", label: "🚨 Urgent Questions" },
          { id: "announcement", label: "Announcements" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setFilterType(t.id)}
            className={`rounded-xl px-3 py-1.5 font-semibold transition-all ${
              filterType === t.id
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-secondary text-muted-foreground hover:bg-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <ul className="space-y-2.5">
        {!items && [0, 1, 2].map((i) => <li key={i} className="h-16 animate-pulse rounded-2xl bg-card border" />)}

        {items?.map((n) => {
          const Icon = icons[n.type] ?? Bell;
          const isUrgent = n.type === "urgent_question";
          const isVerification = n.type === "faculty_verification";

          return (
            <li key={n.id}>
              <Link
                to={n.questionId ? "/questions/$questionId" : "/dashboard"}
                params={(n.questionId ? { questionId: n.questionId } : {}) as never}
                onClick={() => {
                  void api.markRead(n.id);
                }}
                className={cn(
                  "card-rise flex items-start gap-3.5 rounded-2xl border p-4 shadow-card transition-all",
                  isUrgent
                    ? "border-red-500/40 bg-red-50/20 dark:bg-red-950/15"
                    : isVerification
                      ? "border-amber-500/40 bg-amber-50/20 dark:bg-amber-950/15"
                      : n.read
                        ? "border-border bg-card"
                        : "border-primary/30 bg-primary/5",
                )}
              >
                <span
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-xl",
                    isUrgent
                      ? "bg-red-600/15 text-red-600"
                      : isVerification
                        ? "bg-amber-600/15 text-amber-700"
                        : "bg-primary/10 text-primary",
                  )}
                >
                  <Icon className="size-5" />
                </span>

                <div className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-foreground leading-snug">{n.message}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{timeAgo(n.createdAt)}</span>
                </div>

                {!n.read && (
                  <span className="ml-auto mt-2 size-2.5 shrink-0 rounded-full bg-red-600 animate-pulse" aria-label="Unread" />
                )}
              </Link>
            </li>
          );
        })}

        {items && items.length === 0 && (
          <li className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            No notifications in this category.
          </li>
        )}
      </ul>
    </AppShell>
  );
}
