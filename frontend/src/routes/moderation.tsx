import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ShieldAlert, Trash2, Eye, X, TriangleAlert } from "lucide-react";
import { AppShell, PageHeading } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { timeAgo, useSession } from "@/lib/session";
import { cn } from "@/lib/utils";
import { reports as api } from "@/services/reports";
import { findUser } from "@/services/store";
import type { Report } from "@/services/types";

export const Route = createFileRoute("/moderation")({
  head: () => ({
    meta: [
      { title: "Moderation · CAMPUS-Q&A" },
      { name: "description", content: "Review reported questions and answers, remove content or warn users." },
      { property: "og:title", content: "Moderation · CAMPUS-Q&A" },
      { property: "og:description", content: "Admin and faculty tools for keeping the campus portal safe." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Moderation,
});

const statusStyles: Record<Report["status"], string> = {
  pending: "bg-warning/20 text-warning-foreground",
  reviewing: "bg-primary/12 text-primary",
  removed: "bg-destructive/12 text-destructive",
  dismissed: "bg-muted text-muted-foreground",
  warned: "bg-accent text-accent-foreground",
};

function Moderation() {
  const { user } = useSession();
  const [items, setItems] = useState<Report[] | null>(null);
  const [toast, setToast] = useState("");

  const load = () => void api.getReports().then((r) => setItems([...r]));
  useEffect(load, []);

  if (!user) return null;

  const act = async (id: string, status: Report["status"], message: string) => {
    await api.updateReport(id, status);
    load();
    setToast(message);
    setTimeout(() => setToast(""), 3000);
  };

  const canModerate = user.role === "admin" || user.role === "faculty";

  return (
    <AppShell user={user}>
      <PageHeading title="Moderation Queue" subtitle="Reported content awaiting an admin or faculty decision." />

      {!canModerate && (
        <p className="rounded-xl bg-warning/15 px-4 py-3 text-sm text-warning-foreground">
          You are viewing in read-only mode. Only admins and faculty can act on reports.
        </p>
      )}
      {toast && (
        <p role="status" className="mb-4 rounded-xl bg-success/12 px-4 py-3 text-sm text-success">
          {toast}
        </p>
      )}

      <div className="mt-4 space-y-3">
        {!items && [0, 1].map((i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-card" />)}
        {items?.map((r) => (
          <article key={r.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold capitalize text-secondary-foreground">
                <ShieldAlert className="size-3" aria-hidden /> Reported {r.contentType}
              </span>
              <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize", statusStyles[r.status])}>
                {r.status}
              </span>
              <span className="ml-auto text-xs text-muted-foreground">{timeAgo(r.createdAt)}</span>
            </div>

            <p className="mt-3 line-clamp-2 text-sm font-medium">{r.excerpt}</p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Reason: {r.reason} · reported by {findUser(r.reporterId)?.name ?? "a student"}
            </p>

            {canModerate && (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
                <Button size="sm" variant="outline" onClick={() => act(r.id, "reviewing", "Marked as under review.")}>
                  <Eye className="size-4" aria-hidden /> Review
                </Button>
                <Button size="sm" variant="destructive" onClick={() => act(r.id, "removed", "Content removed.")}>
                  <Trash2 className="size-4" aria-hidden /> Remove
                </Button>
                <Button size="sm" variant="ghost" onClick={() => act(r.id, "dismissed", "Report dismissed.")}>
                  <X className="size-4" aria-hidden /> Dismiss
                </Button>
                <Button size="sm" variant="secondary" onClick={() => act(r.id, "warned", "Warning sent to the user.")}>
                  <TriangleAlert className="size-4" aria-hidden /> Warn user
                </Button>
              </div>
            )}
          </article>
        ))}
        {items?.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            The queue is clear. Nothing to moderate.
          </p>
        )}
      </div>
    </AppShell>
  );
}
