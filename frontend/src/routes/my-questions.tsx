import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeading } from "@/components/AppShell";
import { QuestionCard } from "@/components/QuestionCard";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/session";
import { questions } from "@/services/questions";
import type { Question } from "@/services/types";

export const Route = createFileRoute("/my-questions")({
  head: () => ({
    meta: [
      { title: "My questions · CAMPUS-Q&A" },
      { name: "description", content: "Track the questions you asked and accept the answer that solved them." },
      { property: "og:title", content: "My questions · CAMPUS-Q&A" },
      { property: "og:description", content: "Your asked questions, their answers and solved status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MyQuestions,
});

function MyQuestions() {
  const { user } = useSession();
  const [items, setItems] = useState<Question[] | null>(null);

  useEffect(() => {
    if (user) void questions.getQuestions({ authorId: user.id }).then(setItems);
  }, [user]);

  if (!user) return null;

  return (
    <AppShell user={user}>
      <PageHeading title="My Questions" subtitle="Everything you asked, with answers waiting for your review." />
      <div className="grid gap-3">
        {!items && [0, 1].map((i) => <div key={i} className="h-36 animate-pulse rounded-2xl bg-card" />)}
        {items?.map((q) => <QuestionCard key={q.id} question={q} />)}
        {items?.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <p className="text-sm text-muted-foreground">You haven't asked anything yet.</p>
            <Button className="mt-4" asChild>
              <Link to="/ask">Ask your first question</Link>
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
