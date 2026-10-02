import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  Award,
  Bell,
  Bookmark,
  CheckCircle2,
  Clock,
  Compass,
  FileCheck,
  FileQuestion,
  Flame,
  GraduationCap,
  HelpCircle,
  MapPin,
  MessageSquare,
  Plus,
  Search,
  Shield,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  Zap,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CampusAIChatModal } from "@/components/CampusAIChatModal";
import { QuestionCard } from "@/components/QuestionCard";
import { RoleBadge } from "@/components/RoleBadge";
import { UrgentBadge } from "@/components/UrgentBadge";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/session";
import { answers as answersApi } from "@/services/answers";
import { moderation as moderationApi } from "@/services/moderation";
import { questions as questionsApi } from "@/services/questions";
import { db, findUser } from "@/services/store";
import type { Answer, Question, Report, User } from "@/services/types";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard · CAMPUS-Q&A" },
      { name: "description", content: "Campus-exclusive student Q&A, mentor routing and academic guidance portal." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useSession();
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiModalPrompt, setAiModalPrompt] = useState<string | undefined>();

  // Student feed state
  const [studentTab, setStudentTab] = useState<"recent" | "my" | "answered" | "saved" | "recommended">("recent");
  const [data, setData] = useState<{
    recent: Question[];
    myQuestions: Question[];
    answeredQuestions: Question[];
    savedQuestions: Question[];
    recommended: Question[];
    urgent: Question[];
    unanswered: Question[];
    topics: { label: string; count: number }[];
    answersAwaitingVerification: { answer: Answer; question?: Question }[];
    reports: Report[];
  } | null>(null);

  const [mentorAvailability, setMentorAvailability] = useState<"available" | "busy" | "in_class">("available");
  const [toast, setToast] = useState("");

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3200);
  };

  const loadData = async () => {
    if (!user) return;
    const [recent, myQuestions, unanswered, topics, saved] = await Promise.all([
      questionsApi.getQuestions({ sort: "recent", limit: 6 }),
      questionsApi.getQuestions({ authorId: user.id }),
      questionsApi.getQuestions({ status: "unanswered", limit: 4 }),
      questionsApi.getPopularTopics(),
      questionsApi.getSaved(),
    ]);

    // Questions answered by the current user
    const answeredIds = db.answers.filter((a) => a.authorId === user.id).map((a) => a.questionId);
    const answeredQuestions = db.questions.filter((q) => answeredIds.includes(q.id));

    // Recommended questions based on subjects
    const userSubjects = user.subjects.length > 0 ? user.subjects : ["Computer Science"];
    const recommended = db.questions.filter((q) => userSubjects.includes(q.subject));

    // Urgent questions
    const urgent = db.questions.filter((q) => q.isUrgent);

    // Answers awaiting verification (unverified answers)
    const answersAwaitingVerification = db.answers
      .filter((a) => !a.isFacultyVerified)
      .map((a) => ({
        answer: a,
        question: db.questions.find((q) => q.id === a.questionId),
      }));

    const reports = await moderationApi.getReports();

    setData({
      recent,
      myQuestions,
      answeredQuestions,
      savedQuestions: saved,
      recommended,
      urgent,
      unanswered,
      topics,
      answersAwaitingVerification,
      reports,
    });
  };

  useEffect(() => {
    void loadData();
  }, [user]);

  if (!user) return null;

  const openAIChatWith = (prompt: string) => {
    setAiModalPrompt(prompt);
    setAiModalOpen(true);
  };

  return (
    <AppShell user={user}>
      {toast && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
          <span>{toast}</span>
        </div>
      )}

      {/* RENDER ADAPTIVE DASHBOARD ACCORDING TO ROLE */}
      {user.role === "student" && (
        <StudentDashboardView
          user={user}
          term={term}
          setTerm={setTerm}
          onSearch={(e) => {
            e.preventDefault();
            navigate({ to: "/explore", search: { q: term } });
          }}
          data={data}
          activeTab={studentTab}
          setActiveTab={setStudentTab}
          onOpenAI={openAIChatWith}
        />
      )}

      {user.role === "mentor" && (
        <PeerMentorDashboardView
          user={user}
          data={data}
          availability={mentorAvailability}
          setAvailability={setMentorAvailability}
          onOpenAI={openAIChatWith}
        />
      )}

      {user.role === "faculty" && (
        <FacultyDashboardView
          user={user}
          data={data}
          onVerifyAnswer={async (answerId) => {
            await answersApi.verifyAnswer({ answerId, verifierId: user.id });
            flash("Answer successfully stamped as Faculty Verified! 🎓");
            await loadData();
          }}
          onOpenAI={openAIChatWith}
        />
      )}

      {user.role === "admin" && (
        <AdminDashboardView
          user={user}
          data={data}
          onReload={loadData}
          flash={flash}
        />
      )}

      {/* Campus AI Assistant Modal */}
      <CampusAIChatModal
        open={aiModalOpen}
        onOpenChange={setAiModalOpen}
        initialPrompt={aiModalPrompt}
      />
    </AppShell>
  );
}

// -------------------------------------------------------------
// 1. STUDENT DASHBOARD VIEW (Section 4)
// -------------------------------------------------------------
function StudentDashboardView({
  user,
  term,
  setTerm,
  onSearch,
  data,
  activeTab,
  setActiveTab,
  onOpenAI,
}: {
  user: User;
  term: string;
  setTerm: (s: string) => void;
  onSearch: (e: React.FormEvent) => void;
  data: any;
  activeTab: "recent" | "my" | "answered" | "saved" | "recommended";
  setActiveTab: (t: any) => void;
  onOpenAI: (prompt: string) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <section className="surface-gradient rounded-3xl p-6 text-navy-foreground sm:p-8 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-300">
            Northfield Institute · Student Learning Portal
          </p>
          <span className="rounded-full bg-white/15 px-3 py-0.5 text-xs font-semibold backdrop-blur text-white">
            {user.department} · {user.year ?? "Undergraduate"}
          </span>
        </div>

        <h1 className="mt-2 text-2xl font-bold sm:text-3xl text-white">
          Welcome back, {user.name.split(" ")[0]}!
        </h1>
        <p className="mt-1 text-sm text-blue-100 max-w-xl">
          Get unstuck fast with verified campus answers, peer mentors, and instant AI academic guidance.
        </p>

        {/* Search bar */}
        <form onSubmit={onSearch} className="mt-5 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="What are you stuck on? (e.g. PCR, recursion, electric field...)"
              className="h-11 w-full rounded-xl border border-transparent bg-card pl-10 pr-3 text-sm text-foreground outline-none focus:border-amber-400"
            />
          </div>
          <Button type="submit" variant="secondary" size="lg" className="h-11 font-semibold">
            Search Portal
          </Button>
        </form>

        {/* Section 4: Main Action Buttons */}
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 pt-4 border-t border-white/15">
          <Button size="sm" asChild className="bg-white text-blue-950 hover:bg-blue-50 font-semibold shadow-xs">
            <Link to="/ask">
              <Plus className="size-4 mr-1.5" /> Ask a Question
            </Link>
          </Button>

          <Button size="sm" variant="outline" asChild className="border-white/30 text-white hover:bg-white/10 font-semibold">
            <Link to="/explore">
              <Compass className="size-4 mr-1.5 text-amber-300" /> Search Knowledge
            </Link>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpenAI("I need help with my course concepts")}
            className="border-white/30 text-white hover:bg-white/10 font-semibold"
          >
            <HelpCircle className="size-4 mr-1.5 text-sky-300" /> Get Help
          </Button>

          <Button size="sm" asChild className="bg-red-600 hover:bg-red-700 text-white font-bold shadow-xs">
            <Link to="/ask">
              <AlertCircle className="size-4 mr-1.5" /> Urgent Help
            </Link>
          </Button>
        </div>
      </section>

      {/* Ask Campus AI Entry Card */}
      <section className="rounded-2xl border border-amber-500/35 bg-gradient-to-r from-amber-500/10 via-blue-500/10 to-amber-500/10 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0">
              <Sparkles className="size-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-foreground">Ask Campus AI Assistant</h2>
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-200">
                  ANSWER · GUIDE · CONNECT
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Get instant concise concept answers, campus office locations, and step-by-step submission checklists.
              </p>
            </div>
          </div>
          <Button
            onClick={() => onOpenAI("What is photosynthesis?")}
            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shrink-0"
          >
            <Sparkles className="size-3.5 mr-1.5" /> Open Campus AI
          </Button>
        </div>
      </section>

      {/* Feed Layout */}
      {!data ? (
        <div className="grid gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-card border border-border" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_310px]">
          <div className="space-y-5">
            {/* Tab navigation */}
            <div className="flex flex-wrap items-center gap-1 border-b border-border pb-2">
              {[
                { id: "recent", label: "Recent Questions" },
                { id: "my", label: `My Questions (${data.myQuestions.length})` },
                { id: "answered", label: `Questions I Answered (${data.answeredQuestions.length})` },
                { id: "saved", label: `Saved Answers (${data.savedQuestions.length})` },
                { id: "recommended", label: "Recommended for You" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id as any)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                    activeTab === t.id
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="space-y-3">
              {activeTab === "recent" &&
                data.recent.map((q: Question) => <QuestionCard key={q.id} question={q} />)}

              {activeTab === "my" && (
                <>
                  {data.myQuestions.map((q: Question) => <QuestionCard key={q.id} question={q} />)}
                  {data.myQuestions.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                      You haven't asked any doubts yet. Click &quot;Ask a Question&quot; to get started!
                    </div>
                  )}
                </>
              )}

              {activeTab === "answered" && (
                <>
                  {data.answeredQuestions.map((q: Question) => <QuestionCard key={q.id} question={q} />)}
                  {data.answeredQuestions.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                      You haven't posted any answers yet. Explore unanswered questions to earn reputation points!
                    </div>
                  )}
                </>
              )}

              {activeTab === "saved" && (
                <>
                  {data.savedQuestions.map((q: Question) => <QuestionCard key={q.id} question={q} />)}
                  {data.savedQuestions.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                      No saved answers yet. Bookmark helpful explanations to access them here anytime.
                    </div>
                  )}
                </>
              )}

              {activeTab === "recommended" &&
                data.recommended.map((q: Question) => <QuestionCard key={q.id} question={q} />)}
            </div>
          </div>

          {/* Right Sidebar */}
          <aside className="space-y-4">
            {/* Campus Announcements */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
                <Bell className="size-4 text-amber-500" />
                <span>Campus Announcements</span>
              </h2>
              <div className="mt-3 space-y-2.5 text-xs">
                <div className="rounded-xl border border-border bg-muted/40 p-2.5">
                  <span className="font-semibold block text-foreground">Capstone Proposal Due</span>
                  <p className="text-muted-foreground mt-0.5">Submit team proposal to Dr. Ramanathan before Friday 5 PM.</p>
                </div>
                <div className="rounded-xl border border-border bg-muted/40 p-2.5">
                  <span className="font-semibold block text-foreground">24/7 Library Access</span>
                  <p className="text-muted-foreground mt-0.5">Ramanujan Library now open all night during exam week.</p>
                </div>
              </div>
            </div>

            {/* Student Activity Stats */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <h2 className="text-sm font-bold text-foreground">Your Academic Impact</h2>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-xl bg-muted/60 p-2.5">
                  <dt className="text-muted-foreground text-[10px]">Asked</dt>
                  <dd className="text-base font-bold text-primary">{data.myQuestions.length}</dd>
                </div>
                <div className="rounded-xl bg-muted/60 p-2.5">
                  <dt className="text-muted-foreground text-[10px]">Answers</dt>
                  <dd className="text-base font-bold text-primary">{data.answeredQuestions.length}</dd>
                </div>
                <div className="rounded-xl bg-muted/60 p-2.5">
                  <dt className="text-muted-foreground text-[10px]">Reputation</dt>
                  <dd className="text-base font-bold text-amber-600">{user.reputation}</dd>
                </div>
              </dl>
            </div>

            {/* Popular Topics */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
                <TrendingUp className="size-4 text-primary" />
                <span>Popular Subjects</span>
              </h2>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {data.topics.map((t: any) => (
                  <li key={t.label}>
                    <Link
                      to="/explore"
                      search={{ q: t.label }}
                      className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium hover:bg-accent"
                    >
                      <span>{t.label}</span>
                      <span className="text-[10px] text-muted-foreground font-bold">({t.count})</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// 2. PEER MENTOR DASHBOARD VIEW (Section 12)
// -------------------------------------------------------------
function PeerMentorDashboardView({
  user,
  data,
  availability,
  setAvailability,
  onOpenAI,
}: {
  user: User;
  data: any;
  availability: "available" | "busy" | "in_class";
  setAvailability: (a: any) => void;
  onOpenAI: (s: string) => void;
}) {
  const [tab, setTab] = useState<"matching" | "urgent" | "unanswered" | "mine">("matching");

  if (!data) return null;

  const matchingQuestions = data.recent.filter((q: Question) =>
    user.subjects.includes(q.subject),
  );

  return (
    <div className="space-y-6">
      {/* Mentor Header */}
      <section className="rounded-3xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-blue-500/10 to-amber-500/10 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-900 dark:text-amber-200">
                PEER MENTOR DESK
              </span>
              <RoleBadge role="mentor" />
            </div>
            <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
              Mentor Hub: {user.name}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Department: {user.department} · Expertise: {user.subjects.join(", ")}
            </p>
          </div>

          {/* Availability Toggle */}
          <div className="rounded-2xl border border-border bg-card p-3 shadow-xs text-xs">
            <span className="text-muted-foreground block text-[10px] font-semibold uppercase mb-1">
              Live Mentoring Status:
            </span>
            <div className="flex gap-1">
              {(["available", "in_class", "busy"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setAvailability(s)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize transition-all ${
                    availability === s
                      ? s === "available"
                        ? "bg-emerald-600 text-white"
                        : s === "in_class"
                          ? "bg-amber-600 text-white"
                          : "bg-red-600 text-white"
                      : "bg-secondary text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {s.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mentor Metrics */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 pt-4 border-t border-border/50 text-xs">
          <div className="rounded-xl bg-card/80 p-3">
            <span className="text-muted-foreground">Expertise Questions</span>
            <p className="text-xl font-bold text-primary mt-1">{matchingQuestions.length}</p>
          </div>
          <div className="rounded-xl bg-card/80 p-3">
            <span className="text-muted-foreground">Urgent Doubts Queue</span>
            <p className="text-xl font-bold text-red-600 mt-1">{data.urgent.length}</p>
          </div>
          <div className="rounded-xl bg-card/80 p-3">
            <span className="text-muted-foreground">Reputation Score</span>
            <p className="text-xl font-bold text-amber-600 mt-1">{user.reputation}</p>
          </div>
          <div className="rounded-xl bg-card/80 p-3">
            <span className="text-muted-foreground">Average Response</span>
            <p className="text-xl font-bold text-emerald-600 mt-1">&lt; 30 mins</p>
          </div>
        </div>
      </section>

      {/* Mentor Queues Tabs */}
      <div className="flex flex-wrap items-center gap-1 border-b border-border pb-2">
        {[
          { id: "matching", label: `Matching My Expertise (${matchingQuestions.length})` },
          { id: "urgent", label: `🚨 Urgent Queue (${data.urgent.length})` },
          { id: "unanswered", label: `Unanswered Questions (${data.unanswered.length})` },
          { id: "mine", label: `Questions I Answered (${data.answeredQuestions.length})` },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id as any)}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
              tab === t.id
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Mentor Queue Content */}
      <div className="space-y-3">
        {tab === "matching" && matchingQuestions.map((q: Question) => <QuestionCard key={q.id} question={q} />)}
        {tab === "urgent" && data.urgent.map((q: Question) => <QuestionCard key={q.id} question={q} />)}
        {tab === "unanswered" && data.unanswered.map((q: Question) => <QuestionCard key={q.id} question={q} />)}
        {tab === "mine" && data.answeredQuestions.map((q: Question) => <QuestionCard key={q.id} question={q} />)}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 3. FACULTY DASHBOARD VIEW (Section 13)
// -------------------------------------------------------------
function FacultyDashboardView({
  user,
  data,
  onVerifyAnswer,
  onOpenAI,
}: {
  user: User;
  data: any;
  onVerifyAnswer: (id: string) => Promise<void>;
  onOpenAI: (s: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<"verification" | "attention" | "reports">("verification");

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Faculty Header */}
      <section className="rounded-3xl border border-amber-700/40 bg-gradient-to-r from-amber-900/15 via-blue-900/10 to-amber-900/10 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-amber-800/20 px-2.5 py-0.5 text-xs font-bold text-amber-900 dark:text-amber-200">
                FACULTY VERIFICATION DESK
              </span>
              <RoleBadge role="faculty" />
            </div>
            <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
              Faculty Portal: {user.name}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {user.department} · Knowledge Curator &amp; Academic Verifier
            </p>
          </div>
          <Button variant="outline" size="sm" asChild className="text-xs">
            <Link to="/moderation">
              <Shield className="size-3.5 mr-1 text-red-600" /> Moderation Desk
            </Link>
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 pt-4 border-t border-border/50 text-xs">
          <div className="rounded-xl bg-card/80 p-3">
            <span className="text-muted-foreground">Awaiting Verification</span>
            <p className="text-xl font-bold text-amber-600 mt-1">{data.answersAwaitingVerification.length}</p>
          </div>
          <div className="rounded-xl bg-card/80 p-3">
            <span className="text-muted-foreground">Department Doubts</span>
            <p className="text-xl font-bold text-primary mt-1">{data.recent.length}</p>
          </div>
          <div className="rounded-xl bg-card/80 p-3">
            <span className="text-muted-foreground">Flagged Content</span>
            <p className="text-xl font-bold text-red-600 mt-1">{data.reports.length}</p>
          </div>
          <div className="rounded-xl bg-card/80 p-3">
            <span className="text-muted-foreground">Faculty Reputation</span>
            <p className="text-xl font-bold text-emerald-600 mt-1">{user.reputation}</p>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1 border-b border-border pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("verification")}
          className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
            activeTab === "verification"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
        >
          🎓 Answers Awaiting Faculty Verification ({data.answersAwaitingVerification.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("attention")}
          className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
            activeTab === "attention"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
        >
          Questions Requiring Faculty Attention ({data.recent.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("reports")}
          className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
            activeTab === "reports"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
        >
          Reported Content Alerts ({data.reports.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {activeTab === "verification" && (
          <div className="space-y-3">
            {data.answersAwaitingVerification.map((item: any) => {
              const author = findUser(item.answer.authorId);
              return (
                <article key={item.answer.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2.5">
                    <span className="text-xs font-semibold text-muted-foreground">
                      On question: <strong className="text-foreground">{item.question?.title}</strong>
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      By {author?.name} ({author?.role})
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-foreground/90">
                    {item.answer.content}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border">
                    <span className="text-xs text-muted-foreground">
                      Verifying awards +25 reputation to author and stamps this answer as official campus reference.
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => void onVerifyAnswer(item.answer.id)}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs"
                      >
                        <Award className="size-3.5 mr-1" /> Verify Answer 🎓
                      </Button>
                      <Button size="sm" variant="outline" asChild className="text-xs">
                        <Link to="/questions/$questionId" params={{ questionId: item.question?.id ?? "q1" }}>
                          Inspect Question
                        </Link>
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}

            {data.answersAwaitingVerification.length === 0 && (
              <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                All submitted answers have been reviewed!
              </p>
            )}
          </div>
        )}

        {activeTab === "attention" && (
          <div className="space-y-3">
            {data.recent.map((q: Question) => <QuestionCard key={q.id} question={q} />)}
          </div>
        )}

        {activeTab === "reports" && (
          <div className="space-y-3">
            {data.reports.map((r: Report) => (
              <div key={r.id} className="rounded-2xl border border-red-500/30 bg-card p-4 shadow-xs text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-red-600 uppercase">Report: {r.reason}</span>
                  <span className="text-muted-foreground">{r.status}</span>
                </div>
                <p className="mt-2 text-foreground font-medium">&ldquo;{r.excerpt}&rdquo;</p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" asChild className="h-7 text-xs">
                    <Link to="/moderation">Open Moderation Desk</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 4. ADMIN DASHBOARD VIEW (Section 14)
// -------------------------------------------------------------
function AdminDashboardView({
  user,
  data,
  onReload,
  flash,
}: {
  user: User;
  data: any;
  onReload: () => Promise<void>;
  flash: (s: string) => void;
}) {
  const [tab, setTab] = useState<"users" | "resources" | "moderation" | "logs">("users");

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <section className="rounded-3xl border border-red-500/40 bg-gradient-to-r from-red-500/15 via-blue-500/10 to-red-500/10 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-red-600/20 px-2.5 py-0.5 text-xs font-bold text-red-800 dark:text-red-300">
                CAMPUS ADMINISTRATION DESK
              </span>
              <RoleBadge role="admin" />
            </div>
            <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
              Portal Administration &amp; Governance
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Monitor active users, resolve moderation reports, and manage campus resources directory.
            </p>
          </div>
          <Button size="sm" asChild className="bg-red-600 hover:bg-red-700 text-white text-xs">
            <Link to="/moderation">Review Pending Reports</Link>
          </Button>
        </div>

        {/* Admin KPI Stat Cards */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-6 pt-4 border-t border-border/50 text-xs">
          <div className="rounded-xl bg-card/80 p-3">
            <span className="text-muted-foreground">Total Users</span>
            <p className="text-xl font-bold text-foreground mt-1">{db.users.length}</p>
          </div>
          <div className="rounded-xl bg-card/80 p-3">
            <span className="text-muted-foreground">Questions</span>
            <p className="text-xl font-bold text-primary mt-1">{db.questions.length}</p>
          </div>
          <div className="rounded-xl bg-card/80 p-3">
            <span className="text-muted-foreground">Answers</span>
            <p className="text-xl font-bold text-emerald-600 mt-1">{db.answers.length}</p>
          </div>
          <div className="rounded-xl bg-card/80 p-3">
            <span className="text-muted-foreground">Unanswered</span>
            <p className="text-xl font-bold text-amber-600 mt-1">{data.unanswered.length}</p>
          </div>
          <div className="rounded-xl bg-card/80 p-3">
            <span className="text-muted-foreground">Pending Reports</span>
            <p className="text-xl font-bold text-red-600 mt-1">{data.reports.length}</p>
          </div>
          <div className="rounded-xl bg-card/80 p-3">
            <span className="text-muted-foreground">Active Mentors</span>
            <p className="text-xl font-bold text-indigo-600 mt-1">{db.mentors.length}</p>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1 border-b border-border pb-2">
        {[
          { id: "users", label: `Manage Users (${db.users.length})` },
          { id: "resources", label: `Campus Resources (${db.resources.length})` },
          { id: "moderation", label: `Moderation Reports (${data.reports.length})` },
          { id: "logs", label: "Audit & System Logs" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id as any)}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
              tab === t.id
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "users" && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="pb-3 font-semibold">User</th>
                <th className="pb-3 font-semibold">Student ID</th>
                <th className="pb-3 font-semibold">Department</th>
                <th className="pb-3 font-semibold">Role</th>
                <th className="pb-3 font-semibold">Reputation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {db.users.map((u) => (
                <tr key={u.id} className="hover:bg-muted/30">
                  <td className="py-3 font-semibold text-foreground flex items-center gap-2">
                    <span className="grid size-6 place-items-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                      {u.avatarInitials}
                    </span>
                    {u.name}
                  </td>
                  <td className="py-3 text-muted-foreground">{u.studentId}</td>
                  <td className="py-3 text-muted-foreground">{u.department}</td>
                  <td className="py-3">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="py-3 font-bold text-amber-600">{u.reputation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "resources" && (
        <div className="grid gap-3 sm:grid-cols-2">
          {db.resources.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border bg-card p-4 text-xs shadow-xs">
              <h3 className="font-bold text-foreground text-sm">{r.name}</h3>
              <p className="mt-1 text-muted-foreground">📍 {r.location}</p>
              <p className="text-muted-foreground">👤 {r.contactPerson} ({r.email})</p>
              <p className="text-muted-foreground">🕒 {r.workingHours}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "moderation" && (
        <div className="space-y-3">
          {data.reports.map((r: Report) => (
            <div key={r.id} className="rounded-2xl border border-red-500/40 bg-card p-4 text-xs shadow-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-red-600 uppercase">Reason: {r.reason}</span>
                <span className="text-muted-foreground">{r.status}</span>
              </div>
              <p className="mt-2 text-foreground font-medium">&ldquo;{r.excerpt}&rdquo;</p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" asChild className="h-7 text-xs">
                  <Link to="/moderation">Open Moderation Screen</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "logs" && (
        <div className="rounded-2xl border border-border bg-card p-5 text-xs text-muted-foreground space-y-2">
          <p className="font-bold text-foreground">Campus Knowledge Base Audit Logs:</p>
          <div className="font-mono text-[11px] space-y-1 bg-muted/50 p-3 rounded-xl">
            <p>[2026-10-01 18:20] Faculty Dr. Meera Raghavan stamped verified status on question #q3</p>
            <p>[2026-10-01 17:50] Peer mentor Kabir Menon answered question #q5 (Urgent Priority)</p>
            <p>[2026-10-01 16:15] Student Ananya Iyer posted doubt #q1 (Recursion &amp; Memory)</p>
            <p>[2026-10-01 15:00] Platform initialized with 8 campus department resources &amp; capstone task guidance</p>
          </div>
        </div>
      )}
    </div>
  );
}
