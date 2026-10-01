import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, CheckCircle2, GraduationCap, MessageSquare, Sparkles, ArrowBigUp } from "lucide-react";
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
      { name: "description", content: "New answers, accepted solutions, upvotes and mentor replies in one place." },
      { property: "og:title", content: "Notifications · CAMPUS-Q&A" },
      { property: "og:description", content: "Stay on top of answers, acceptances and mentor responses." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Notifications,
});

const icons: Record<NotificationItem["type"], React.ComponentType<{ className?: string }>> = {
  answer: MessageSquare,
  accepted: CheckCircle2,
  upvote: ArrowBigUp,
  mentor: GraduationCap,
  similar: Sparkles,
  report: Bell,
};

function Notifications() {
  const { user } = useSession();
  const [items, setItems] = useState<NotificationItem[] | null>(null);

  const load = (id: string) => void api.getNotifications(id).then((r) => setItems([...r]));

  useEffect(() => {
    if (user) load(user.id);
  }, [user]);

  if (!user) return null;

  return (
    <AppShell user={user}>
      <div className="flex items-start justify-between gap-3">
        <PageHeading title="Notifications" subtitle="Everything that happened on your questions and answers." />
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            await api.markAllRead(user.id);
            load(user.id);
          }}
        >
          Mark all read
        </Button>
      </div>

      <ul className="space-y-2">
        {!items && [0, 1, 2].map((i) => <li key={i} className="h-16 animate-pulse rounded-2xl bg-card" />)}
        {items?.map((n) => {
          const Icon = icons[n.type];
          return (
            <li key={n.id}>
              <Link
                to={n.questionId ? "/questions/$questionId" : "/dashboard"}
                params={(n.questionId ? { questionId: n.questionId } : {}) as never}
                onClick={() => {
                  void api.markRead(n.id);
                }}
                className={cn(
                  "card-rise flex items-start gap-3 rounded-2xl border p-4 shadow-card",
                  n.read ? "border-border bg-card" : "border-primary/30 bg-primary/5",
                )}
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{n.message}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{timeAgo(n.createdAt)}</span>
                </span>
                {!n.read && <span className="ml-auto mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </AppShell>
  );
}
