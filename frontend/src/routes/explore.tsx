import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, SlidersHorizontal } from "lucide-react";
import { AppShell, PageHeading } from "@/components/AppShell";
import { QuestionCard } from "@/components/QuestionCard";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";
import { questions } from "@/services/questions";
import { SUBJECTS, type Question, type QuestionQuery, type Subject } from "@/services/types";

export const Route = createFileRoute("/explore")({
  validateSearch: (search: Record<string, unknown>) => ({ q: (search["q"] as string) ?? "" }),
  head: () => ({
    meta: [
      { title: "Explore questions · CAMPUS-Q&A" },
      { name: "description", content: "Search and filter academic questions by subject, tag, status and popularity." },
      { property: "og:title", content: "Explore questions · CAMPUS-Q&A" },
      { property: "og:description", content: "Find solved and unanswered questions across six core subjects." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Explore,
});

const statuses: { value: NonNullable<QuestionQuery["status"]>; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unanswered", label: "Unanswered" },
  { value: "solved", label: "Solved" },
  { value: "open", label: "Open" },
];

function Explore() {
  const { user } = useSession();
  const { q } = Route.useSearch();
  const [term, setTerm] = useState(q);
  const [subject, setSubject] = useState<Subject | "all">("all");
  const [status, setStatus] = useState<NonNullable<QuestionQuery["status"]>>("all");
  const [sort, setSort] = useState<"recent" | "popular">("recent");
  const [tag, setTag] = useState<string | null>(null);
  const [results, setResults] = useState<Question[] | null>(null);

  useEffect(() => setTerm(q), [q]);

  useEffect(() => {
    let active = true;
    setResults(null);
    void questions
      .getQuestions({ search: term, subject, status, sort, ...(tag ? { tags: [tag] } : {}) })
      .then((r) => active && setResults(r));
    return () => {
      active = false;
    };
  }, [term, subject, status, sort, tag]);

  const allTags = Array.from(new Set((results ?? []).flatMap((r) => r.tags))).slice(0, 12);

  if (!user) return null;

  return (
    <AppShell user={user}>
      <PageHeading title="Explore" subtitle="Search every question asked across your institution." />

      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search by title, tag or subject…"
          aria-label="Search questions"
          className="h-12 w-full rounded-xl border border-input bg-card pl-10 pr-3 text-sm outline-none transition-colors focus:border-primary"
        />
      </div>

      <div className="mt-4 space-y-3 rounded-2xl border border-border bg-card p-4 shadow-card">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <SlidersHorizontal className="size-4" aria-hidden /> Filters
        </p>

        <Chips
          label="Subject"
          options={[{ value: "all", label: "All subjects" }, ...SUBJECTS.map((s) => ({ value: s, label: s }))]}
          value={subject}
          onChange={(v) => setSubject(v as Subject | "all")}
        />
        <Chips
          label="Status"
          options={statuses.map((s) => ({ value: s.value, label: s.label }))}
          value={status}
          onChange={(v) => setStatus(v as NonNullable<QuestionQuery["status"]>)}
        />
        <Chips
          label="Sort"
          options={[
            { value: "recent", label: "Recent" },
            { value: "popular", label: "Popular" },
          ]}
          value={sort}
          onChange={(v) => setSort(v as "recent" | "popular")}
        />
        {allTags.length > 0 && (
          <Chips
            label="Tags"
            options={[{ value: "", label: "Any tag" }, ...allTags.map((t) => ({ value: t, label: `#${t}` }))]}
            value={tag ?? ""}
            onChange={(v) => setTag(v || null)}
          />
        )}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {results ? `${results.length} question${results.length === 1 ? "" : "s"}` : "Searching…"}
        </p>
        {(subject !== "all" || status !== "all" || tag || term) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSubject("all");
              setStatus("all");
              setTag(null);
              setTerm("");
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      <div className="mt-3 grid gap-3">
        {!results && [0, 1, 2].map((i) => <div key={i} className="h-36 animate-pulse rounded-2xl bg-card" />)}
        {results?.map((question) => <QuestionCard key={question.id} question={question} />)}
        {results?.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No questions match these filters yet. Try widening your search — or ask it yourself.
          </p>
        )}
      </div>
    </AppShell>
  );
}

function Chips({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-16 shrink-0 text-xs font-medium text-muted-foreground">{label}</span>
      {options.map((o) => (
        <button
          key={o.value || "any"}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
            value === o.value
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-accent",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
