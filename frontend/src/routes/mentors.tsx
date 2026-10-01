import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck, Clock, Sparkles, Star } from "lucide-react";
import { AppShell, PageHeading } from "@/components/AppShell";
import { RoleBadge } from "@/components/RoleBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";
import { mentors as mentorsApi, type MentorWithUser } from "@/services/mentors";
import { SUBJECTS } from "@/services/types";

export const Route = createFileRoute("/mentors")({
  head: () => ({
    meta: [
      { title: "Mentors · CAMPUS-Q&A" },
      { name: "description", content: "Browse verified mentors and faculty by subject expertise and reputation." },
      { property: "og:title", content: "Mentors · CAMPUS-Q&A" },
      { property: "og:description", content: "Verified campus mentors across CS, Biology, Physics, Chemistry and more." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Mentors,
});

function Mentors() {
  const { user } = useSession();
  const [subject, setSubject] = useState<string>("all");
  const [list, setList] = useState<MentorWithUser[] | null>(null);
  const [active, setActive] = useState<MentorWithUser | null>(null);

  useEffect(() => {
    setList(null);
    void mentorsApi.getMentors({ subject }).then(setList);
  }, [subject]);

  if (!user) return null;

  return (
    <AppShell user={user}>
      <PageHeading title="Mentors" subtitle="Verified seniors and faculty who answer within hours." />

      <div className="mb-5 flex flex-wrap gap-2">
        {["all", ...SUBJECTS].map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={subject === s}
            onClick={() => setSubject(s)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              subject === s
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-accent",
            )}
          >
            {s === "all" ? "All subjects" : s}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {!list && [0, 1, 2].map((i) => <div key={i} className="h-56 animate-pulse rounded-2xl bg-card" />)}
        {list?.map((m) => (
          <article key={m.id} className="card-rise rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center gap-3">
              <span className="grid size-12 place-items-center rounded-2xl bg-primary/12 text-sm font-bold text-primary">
                {m.user.avatarInitials}
              </span>
              <div className="min-w-0">
                <h2 className="flex items-center gap-1.5 truncate font-semibold">
                  {m.user.name}
                  {m.verified && <BadgeCheck className="size-4 shrink-0 text-primary" aria-label="Verified" />}
                </h2>
                <RoleBadge role={m.user.role} className="mt-1" />
              </div>
            </div>

            <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{m.bio}</p>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {m.expertise.map((e) => (
                <span key={e} className="rounded-md bg-secondary px-2 py-0.5 text-[11px] text-secondary-foreground">
                  {e}
                </span>
              ))}
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-2 text-center">
              <div className="rounded-xl bg-muted/60 py-2">
                <dt className="text-[11px] text-muted-foreground">Helpful answers</dt>
                <dd className="font-bold text-primary">{m.helpfulAnswers}</dd>
              </div>
              <div className="rounded-xl bg-muted/60 py-2">
                <dt className="text-[11px] text-muted-foreground">Reputation</dt>
                <dd className="font-bold text-primary">{m.user.reputation}</dd>
              </div>
            </dl>

            <Button variant="outline" className="mt-4 w-full" onClick={() => setActive(m)}>
              View Profile
            </Button>
          </article>
        ))}
      </div>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-lg">
          {active && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {active.user.name}
                  {active.verified && <BadgeCheck className="size-4 text-primary" aria-hidden />}
                </DialogTitle>
                <DialogDescription>{active.bio}</DialogDescription>
              </DialogHeader>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Star className="size-4 text-primary" aria-hidden /> {active.user.reputation} reputation ·{" "}
                  {active.helpfulAnswers} helpful answers
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="size-4 text-primary" aria-hidden /> {active.responseTime}
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" aria-hidden /> Expertise: {active.expertise.join(", ")}
                </li>
              </ul>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
