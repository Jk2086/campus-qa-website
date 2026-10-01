import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Flame, Search, Sparkles, TrendingUp, HelpCircle, Clock } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { QuestionCard } from "@/components/QuestionCard";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/session";
import { questions } from "@/services/questions";
import type { Question } from "@/services/types";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard · CAMPUS-Q&A" },
      { name: "description", content: "Your campus learning feed: trending, recent and unanswered academic questions." },
      { property: "og:title", content: "Dashboard · CAMPUS-Q&A" },
      { property: "og:description", content: "Trending, recent and unanswered questions from your institution." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useSession();
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  const [data, setData] = useState<{
    trending: Question[];
    recent: Question[];
    unanswered: Question[];
    recommended: Question[];
    topics: { label: string; count: number }[];
  } | null>(null);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const [trending, recent, unanswered, topics] = await Promise.all([
        questions.getQuestions({ sort: "popular", limit: 4 }),
        questions.getQuestions({ sort: "recent", limit: 4 }),
        questions.getQuestions({ status: "unanswered", limit: 3 }),
        questions.getPopularTopics(),
      ]);
      const recommended = (
        await Promise.all(
          (user.subjects.length ? user.subjects : (["Computer Science"] as const)).map((s) =>
            questions.getQuestions({ subject: s, limit: 2 }),
          ),
        )
      ).flat();
      setData({ trending, recent, unanswered, recommended, topics });
    })();
  }, [user]);

  if (!user) return null;

  return (
    <AppShell user={user}>
      <section className="surface-gradient rounded-3xl p-6 text-navy-foreground sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-widest opacity-75">Ask. Learn. Share. Grow.</p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Welcome back, {user.name.split(" ")[0]}</h1>
        <p className="mt-1.5 text-sm opacity-85">
          {user.institution} · {user.reputation} reputation
        </p>
        <form
          className="mt-6 flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ to: "/explore", search: { q: term } });
          }}
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="What are you stuck on?"
              aria-label="What are you stuck on?"
              className="h-12 w-full rounded-xl border border-transparent bg-card pl-10 pr-3 text-sm text-foreground outline-none focus:border-primary"
            />
          </div>
          <Button type="button" variant="secondary" size="lg" asChild>
            <Link to="/ask">Ask Question</Link>
          </Button>
        </form>
      </section>

      {!data ? (
        <SkeletonFeed />
      ) : (
        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_300px]">
          <div className="space-y-8">
            <Block icon={<Flame className="size-4" aria-hidden />} title="Trending Questions" items={data.trending} />
            <Block icon={<Clock className="size-4" aria-hidden />} title="Recent Questions" items={data.recent} />
            <Block
              icon={<HelpCircle className="size-4" aria-hidden />}
              title="Unanswered — be the first to help"
              items={data.unanswered}
            />
            <Block
              icon={<Sparkles className="size-4" aria-hidden />}
              title="Recommended for you"
              items={data.recommended}
            />
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <TrendingUp className="size-4 text-primary" aria-hidden /> Popular Topics
              </h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {data.topics.map((t) => (
                  <li key={t.label}>
                    <Link
                      to="/explore"
                      search={{ q: t.label }}
                      className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
                    >
                      {t.label}
                      <span className="text-muted-foreground">{t.count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-primary/25 bg-card p-5 shadow-card">
              <h2 className="text-sm font-semibold">Your activity</h2>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                <Stat label="Asked" value={data.recent.filter((q) => q.authorId === user.id).length + 4} />
                <Stat label="Answers" value={12} />
                <Stat label="Accepted" value={5} />
              </dl>
            </div>
          </aside>
        </div>
      )}
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-muted/60 py-3">
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="text-lg font-bold text-primary">{value}</dd>
    </div>
  );
}

function Block({ icon, title, items }: { icon: React.ReactNode; title: string; items: Question[] }) {
  if (!items.length) return null;
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {icon} {title}
      </h2>
      <div className="grid gap-3">
        {items.map((q) => (
          <QuestionCard key={q.id} question={q} />
        ))}
      </div>
    </section>
  );
}

function SkeletonFeed() {
  return (
    <div className="mt-6 grid gap-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-36 animate-pulse rounded-2xl border border-border bg-card" />
      ))}
    </div>
  );
}
