import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Award, Mail, IdCard } from "lucide-react";
import { AppShell, PageHeading } from "@/components/AppShell";
import { QuestionCard } from "@/components/QuestionCard";
import { RoleBadge } from "@/components/RoleBadge";
import { useSession } from "@/lib/session";
import { questions } from "@/services/questions";
import { db } from "@/services/store";
import type { Question } from "@/services/types";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile · CAMPUS-Q&A" },
      { name: "description", content: "Your reputation, badges, questions asked and accepted answers." },
      { property: "og:title", content: "Profile · CAMPUS-Q&A" },
      { property: "og:description", content: "Track reputation, badges and accepted answers on CAMPUS-Q&A." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { user } = useSession();
  const [mine, setMine] = useState<Question[]>([]);

  useEffect(() => {
    if (user) void questions.getQuestions({ authorId: user.id }).then(setMine);
  }, [user]);

  if (!user) return null;

  const myAnswers = db.answers.filter((a) => a.authorId === user.id);
  const accepted = myAnswers.filter((a) => a.isAccepted).length;

  return (
    <AppShell user={user}>
      <PageHeading title="Profile" />

      <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="flex flex-wrap items-center gap-4">
          <span className="grid size-16 place-items-center rounded-2xl bg-primary/12 text-lg font-bold text-primary">
            {user.avatarInitials}
          </span>
          <div>
            <h2 className="text-xl font-bold">{user.name}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <RoleBadge role={user.role} />
              <span className="flex items-center gap-1">
                <Mail className="size-3.5" aria-hidden /> {user.email}
              </span>
              <span className="flex items-center gap-1">
                <IdCard className="size-3.5" aria-hidden /> {user.studentId}
              </span>
            </div>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Reputation" value={user.reputation} />
          <Stat label="Questions asked" value={mine.length} />
          <Stat label="Answers" value={myAnswers.length} />
          <Stat label="Accepted answers" value={accepted} />
        </dl>

        {user.subjects.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold">Subjects</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {user.subjects.map((s) => (
                <span key={s} className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6">
          <h3 className="text-sm font-semibold">Badges</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {user.badges.map((b) => (
              <span
                key={b}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
              >
                <Award className="size-3.5" aria-hidden /> {b}
              </span>
            ))}
          </div>
        </div>
      </section>

      {mine.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Recent questions
          </h2>
          <div className="grid gap-3">
            {mine.slice(0, 3).map((q) => (
              <QuestionCard key={q.id} question={q} compact />
            ))}
          </div>
        </section>
      )}
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-muted/60 p-4 text-center">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-2xl font-bold text-primary">{value}</dd>
    </div>
  );
}
