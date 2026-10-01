import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeading } from "@/components/AppShell";
import { QuestionCard } from "@/components/QuestionCard";
import { useSession } from "@/lib/session";
import { questions } from "@/services/questions";
import type { Question } from "@/services/types";

export const Route = createFileRoute("/saved")({
  head: () => ({
    meta: [
      { title: "Saved questions · CAMPUS-Q&A" },
      { name: "description", content: "Your bookmarked academic questions, saved for revision." },
      { property: "og:title", content: "Saved questions · CAMPUS-Q&A" },
      { property: "og:description", content: "A personal revision library of bookmarked campus questions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Saved,
});

function Saved() {
  const { user } = useSession();
  const [items, setItems] = useState<Question[] | null>(null);

  useEffect(() => {
    void questions.getSaved().then(setItems);
  }, []);

  if (!user) return null;

  return (
    <AppShell user={user}>
      <PageHeading title="Saved" subtitle="Your personal revision library." />
      <div className="grid gap-3">
        {!items && [0, 1].map((i) => <div key={i} className="h-36 animate-pulse rounded-2xl bg-card" />)}
        {items?.map((q) => <QuestionCard key={q.id} question={q} />)}
        {items?.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Nothing saved yet. Tap Save on any question to keep it here.
          </p>
        )}
      </div>
    </AppShell>
  );
}
