import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Award,
  CheckCircle2,
  Compass,
  GraduationCap,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
  Users,
} from "lucide-react";
import { AIResponseBadge } from "@/components/AIResponseBadge";
import { AppShell, PageHeading } from "@/components/AppShell";
import { QuestionCard } from "@/components/QuestionCard";
import { RoleBadge } from "@/components/RoleBadge";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";
import { search as searchApi, type SearchResults } from "@/services/search";
import { SUBJECTS, type Subject } from "@/services/types";

export const Route = createFileRoute("/explore")({
  validateSearch: (search: Record<string, unknown>) => ({ q: (search["q"] as string) ?? "" }),
  head: () => ({
    meta: [
      { title: "Campus Knowledge Search · CAMPUS-Q&A" },
      { name: "description", content: "Search questions, verified campus answers, mentors, and resources." },
    ],
  }),
  component: Explore,
});

function Explore() {
  const { user } = useSession();
  const { q } = Route.useSearch();
  const [term, setTerm] = useState(q);
  const [activeDomain, setActiveDomain] = useState<"all" | "questions" | "resources" | "mentors">("all");
  const [subject, setSubject] = useState<Subject | "all">("all");
  const [status, setStatus] = useState<"all" | "unanswered" | "solved" | "open">("all");
  const [sort, setSort] = useState<"recent" | "popular">("recent");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [results, setResults] = useState<SearchResults | null>(null);

  useEffect(() => setTerm(q), [q]);

  useEffect(() => {
    let active = true;
    setResults(null);
    void searchApi
      .query({
        q: term,
        subject,
        status,
        sort,
        verifiedOnly,
      })
      .then((r) => active && setResults(r));
    return () => {
      active = false;
    };
  }, [term, subject, status, sort, verifiedOnly]);

  if (!user) return null;

  const totalHits =
    (results?.questions.length ?? 0) +
    (results?.resources.length ?? 0) +
    (results?.mentors.length ?? 0);

  return (
    <AppShell user={user}>
      <PageHeading
        title="Search Campus Knowledge Base"
        subtitle="Search across academic questions, faculty verified solutions, mentors, and campus offices."
      />

      {/* Main Search Input */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search by doubt, subject, PCR, recursion, capstone coordinator, office..."
          aria-label="Search campus knowledge"
          className="h-12 w-full rounded-2xl border border-input bg-card pl-11 pr-4 text-sm outline-none transition-colors focus:border-primary shadow-xs"
        />
      </div>

      {/* Domain Category Selector */}
      <div className="mt-4 flex flex-wrap items-center gap-2 border-b border-border pb-3 text-xs">
        {[
          { id: "all", label: `All Results (${totalHits})` },
          { id: "questions", label: `Questions & Answers (${results?.questions.length ?? 0})` },
          { id: "resources", label: `Campus Resources (${results?.resources.length ?? 0})` },
          { id: "mentors", label: `Peer Mentors (${results?.mentors.length ?? 0})` },
        ].map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => setActiveDomain(d.id as any)}
            className={`rounded-xl px-3.5 py-1.5 font-semibold transition-all ${
              activeDomain === d.id
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Detailed Filters (Section 11) */}
      <div className="mt-4 space-y-3 rounded-2xl border border-border bg-card p-4 shadow-card">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <SlidersHorizontal className="size-4" aria-hidden /> Filter Criteria
          </p>
          <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-amber-800 dark:text-amber-300">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="rounded border-input text-amber-600 focus:ring-amber-500 size-3.5"
            />
            <Award className="size-3.5 text-amber-600" />
            <span>Verified Knowledge Only</span>
          </label>
        </div>

        <FilterRow
          label="Subject"
          options={[{ value: "all", label: "All Subjects" }, ...SUBJECTS.map((s) => ({ value: s, label: s }))]}
          value={subject}
          onChange={(v) => setSubject(v as Subject | "all")}
        />

        <FilterRow
          label="Status"
          options={[
            { value: "all", label: "All Statuses" },
            { value: "unanswered", label: "Unanswered" },
            { value: "solved", label: "Solved (Has Solution)" },
            { value: "open", label: "Open" },
          ]}
          value={status}
          onChange={(v) => setStatus(v as any)}
        />

        <FilterRow
          label="Sort By"
          options={[
            { value: "recent", label: "Most Recent" },
            { value: "popular", label: "Most Popular / Upvoted" },
          ]}
          value={sort}
          onChange={(v) => setSort(v as any)}
        />
      </div>

      {/* Results View */}
      <div className="mt-6 space-y-6">
        {!results && [0, 1, 2].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-card border" />)}

        {/* 1. Questions Domain */}
        {(activeDomain === "all" || activeDomain === "questions") && results && (
          <div className="space-y-3">
            {activeDomain === "all" && results.questions.length > 0 && (
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Compass className="size-4 text-primary" /> Questions &amp; Answers ({results.questions.length})
              </h2>
            )}
            <div className="grid gap-3">
              {results.questions.map((q) => (
                <QuestionCard key={q.id} question={q} />
              ))}
            </div>
          </div>
        )}

        {/* 2. Campus Resources Domain */}
        {(activeDomain === "all" || activeDomain === "resources") && results && results.resources.length > 0 && (
          <div className="space-y-3 pt-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <MapPin className="size-4 text-sky-600" /> Campus Offices &amp; Coordinators ({results.resources.length})
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {results.resources.map((r) => (
                <div key={r.id} className="rounded-2xl border border-border bg-card p-4 shadow-card text-xs">
                  <span className="rounded-full bg-sky-500/15 px-2.5 py-0.5 text-[10px] font-bold text-sky-800 dark:text-sky-300 uppercase">
                    {r.type}
                  </span>
                  <h3 className="text-sm font-bold text-foreground mt-2">{r.name}</h3>
                  <p className="mt-1 text-muted-foreground">📍 {r.location}</p>
                  <p className="text-muted-foreground">👤 Contact: {r.contactPerson} ({r.email})</p>
                  <p className="text-muted-foreground">🕒 Hours: {r.workingHours}</p>
                  <p className="mt-2 text-foreground/80 leading-relaxed">{r.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Mentors Domain */}
        {(activeDomain === "all" || activeDomain === "mentors") && results && results.mentors.length > 0 && (
          <div className="space-y-3 pt-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <GraduationCap className="size-4 text-amber-600" /> Peer Mentors ({results.mentors.length})
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {results.mentors.map((m) => (
                <div key={m.id} className="rounded-2xl border border-border bg-card p-4 shadow-card text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-foreground">{m.user?.name}</span>
                    <RoleBadge role="mentor" />
                  </div>
                  <p className="text-muted-foreground mt-1">{m.department}</p>
                  <p className="mt-2 text-foreground/85">{m.bio}</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {m.expertise.map((e) => (
                      <span key={e} className="rounded bg-secondary px-2 py-0.5 text-[10px] font-medium">
                        {e}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {results && totalHits === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            No questions, resources, or mentors match your query. Try broadening your keywords.
          </div>
        )}
      </div>
    </AppShell>
  );
}

function FilterRow({
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
      <span className="w-20 shrink-0 text-xs font-semibold text-muted-foreground">{label}:</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o.value || "all"}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              value === o.value
                ? "bg-primary text-primary-foreground font-semibold"
                : "bg-secondary text-secondary-foreground hover:bg-accent",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
