import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  GraduationCap,
  IdCard,
  Mail,
  MapPin,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { AppShell, PageHeading } from "@/components/AppShell";
import { QuestionCard } from "@/components/QuestionCard";
import { RoleBadge } from "@/components/RoleBadge";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/session";
import { questions } from "@/services/questions";
import { users as usersApi } from "@/services/users";
import { db } from "@/services/store";
import type { Question } from "@/services/types";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Campus Profile · CAMPUS-Q&A" },
      { name: "description", content: "Academic credentials, reputation points, badges and contribution history." },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { user } = useSession();
  const [mine, setMine] = useState<Question[]>([]);
  const [availability, setAvailability] = useState<"available" | "busy" | "in_class" | "offline">(
    user?.availability ?? "available",
  );

  useEffect(() => {
    if (user) void questions.getQuestions({ authorId: user.id }).then(setMine);
  }, [user]);

  if (!user) return null;

  const myAnswers = db.answers.filter((a) => a.authorId === user.id);
  const acceptedAnswers = myAnswers.filter((a) => a.isAccepted).length;
  const verifiedCount = db.answers.filter((a) => a.verifiedBy === user.id).length;

  const updateStatus = async (status: "available" | "busy" | "in_class" | "offline") => {
    setAvailability(status);
    await usersApi.updateAvailability(user.id, status);
  };

  return (
    <AppShell user={user}>
      <PageHeading title="Campus Academic Profile" subtitle="Institution-verified identity, reputation score &amp; academic footprint." />

      <section className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-6">
        {/* Profile Card Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="grid size-16 place-items-center rounded-2xl bg-primary/12 text-xl font-bold text-primary">
              {user.avatarInitials}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-foreground">{user.name}</h2>
                <RoleBadge role={user.role} />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Mail className="size-3.5" /> {user.email}
                </span>
                <span className="flex items-center gap-1">
                  <IdCard className="size-3.5" /> {user.studentId}
                </span>
                <span>·</span>
                <span className="font-medium text-foreground">{user.department}</span>
                {user.year && <span>· {user.year}</span>}
              </div>
            </div>
          </div>

          {/* Peer Mentor Availability Indicator Toggle (Section 16) */}
          {user.role === "mentor" && (
            <div className="rounded-xl border border-border bg-muted/40 p-2.5 text-xs">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                Peer Mentor Availability:
              </span>
              <div className="flex gap-1">
                {(["available", "in_class", "busy"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => void updateStatus(st)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize transition-all ${
                      availability === st
                        ? st === "available"
                          ? "bg-emerald-600 text-white"
                          : st === "in_class"
                            ? "bg-amber-600 text-white"
                            : "bg-red-600 text-white"
                        : "bg-secondary text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {st.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bio */}
        {user.bio && (
          <p className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-xl border border-border/50">
            {user.bio}
          </p>
        )}

        {/* Stats Grid adapted to role (Section 16) */}
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Reputation Points" value={user.reputation} color="text-amber-600" />
          <Stat label="Questions Asked" value={mine.length} color="text-primary" />
          <Stat label="Answers Provided" value={myAnswers.length} color="text-primary" />
          {user.role === "faculty" ? (
            <Stat label="Answers Verified" value={verifiedCount} color="text-emerald-600" />
          ) : (
            <Stat label="Accepted Solutions" value={acceptedAnswers} color="text-emerald-600" />
          )}
        </dl>

        {/* Subjects & Expertise */}
        {user.subjects.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {user.role === "mentor" ? "Mentoring Expertise" : "Subject Domains"}
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {user.subjects.map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-semibold text-primary"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Badges */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Academic &amp; Platform Badges
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {user.badges.map((b) => (
              <span
                key={b}
                className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-900 dark:text-amber-200"
              >
                <Award className="size-3.5 text-amber-600" aria-hidden /> {b}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Questions Asked by User */}
      {mine.length > 0 && (
        <section className="mt-6 space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            My Posted Doubts ({mine.length})
          </h2>
          <div className="grid gap-3">
            {mine.map((q) => (
              <QuestionCard key={q.id} question={q} compact />
            ))}
          </div>
        </section>
      )}
    </AppShell>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-center shadow-xs">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className={`mt-1 text-2xl font-bold ${color ?? "text-foreground"}`}>{value}</dd>
    </div>
  );
}
