import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertCircle,
  AlertTriangle,
  ArrowBigDown,
  ArrowBigUp,
  Award,
  Bookmark,
  CheckCircle2,
  Clock,
  Compass,
  FileCheck,
  Flag,
  HelpCircle,
  Lightbulb,
  Loader2,
  MapPin,
  MessageSquare,
  Send,
  Share2,
  Sparkles,
  UserCheck,
  Users,
  Zap,
} from "lucide-react";
import { AIResponseBadge } from "@/components/AIResponseBadge";
import { AppShell } from "@/components/AppShell";
import { ReportModal } from "@/components/ReportModal";
import { RoleBadge } from "@/components/RoleBadge";
import { UrgentBadge } from "@/components/UrgentBadge";
import { Button } from "@/components/ui/button";
import { timeAgo, useSession } from "@/lib/session";
import { cn } from "@/lib/utils";
import { answers as answersApi } from "@/services/answers";
import { questions as questionsApi } from "@/services/questions";
import { votes } from "@/services/votes";
import { findUser } from "@/services/store";
import type { Answer, Question, ResponseType } from "@/services/types";

export const Route = createFileRoute("/questions/$questionId")({
  head: () => ({
    meta: [
      { title: "Question Details · CAMPUS-Q&A" },
      { name: "description", content: "Instant academic assistance, peer answers and faculty verification." },
    ],
  }),
  component: QuestionDetail,
});

function QuestionDetail() {
  const { user } = useSession();
  const { questionId } = Route.useParams();
  const [question, setQuestion] = useState<Question | null>(null);
  const [list, setList] = useState<Answer[]>([]);
  const [similar, setSimilar] = useState<Question[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState("");
  const [tick, setTick] = useState(0);

  // Reporting state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    contentId: string;
    contentType: "question" | "answer";
    excerpt: string;
  } | null>(null);

  const load = useCallback(async () => {
    try {
      const [q, a, s] = await Promise.all([
        questionsApi.getQuestion(questionId),
        answersApi.getAnswers(questionId),
        questionsApi.getSimilarQuestions({ questionId }),
      ]);
      setQuestion(q);
      setList(a);
      setSimilar(s);
      setSaved(questionsApi.isSaved(questionId));
    } catch {
      // Question not found or mock fallback
    }
  }, [questionId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!user) return null;
  if (!question) {
    return (
      <AppShell user={user}>
        <div className="h-64 animate-pulse rounded-2xl bg-card border border-border" />
      </AppShell>
    );
  }

  const author = findUser(question.authorId);
  const isOwner = question.authorId === user.id;
  const isFacultyOrAdmin = user.role === "faculty" || user.role === "admin";

  const flash = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(""), 3500);
  };

  const handleVote = async (contentId: string, contentType: "question" | "answer", dir: 1 | -1) => {
    await votes.vote({ contentId, contentType, voteType: dir });
    setTick((t) => t + 1);
    await load();
  };

  const triggerReport = (contentId: string, contentType: "question" | "answer", excerpt: string) => {
    setReportTarget({ contentId, contentType, excerpt });
    setReportModalOpen(true);
  };

  const copyShareLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      flash("Internal campus link copied to clipboard.");
    }
  };

  return (
    <AppShell user={user}>
      {toast && (
        <div
          role="status"
          className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-800 dark:text-emerald-300"
        >
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
          <span>{toast}</span>
        </div>
      )}

      {/* URGENT Banner if marked urgent */}
      {question.isUrgent && (
        <div className="mb-5 rounded-2xl border border-red-500/40 bg-gradient-to-r from-red-500/15 via-amber-500/10 to-red-500/10 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-red-600 text-white animate-pulse">
                <AlertCircle className="size-5" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-red-900 dark:text-red-200 uppercase tracking-wide">
                  High-Priority Academic Doubts Queue (Urgent Help)
                </h2>
                <p className="text-xs text-red-800/80 dark:text-red-300">
                  Relevant peer mentors and department faculty have been notified in real time.
                  (Note: Responses depend on peer/mentor availability).
                </p>
              </div>
            </div>
            <UrgentBadge />
          </div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {/* Main Question Card */}
          <article className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              {question.isUrgent && <UrgentBadge />}

              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                {question.subject}
              </span>

              {question.status === "solved" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="size-3" aria-hidden /> Solved
                </span>
              )}

              <span className="text-xs text-muted-foreground">{timeAgo(question.createdAt)}</span>
            </div>

            <h1 className="mt-3 text-xl font-bold leading-snug sm:text-2xl text-foreground">
              {question.title}
            </h1>

            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground/90">
              {question.description}
            </p>

            {question.attachmentName && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-border bg-muted/60 px-3 py-1.5 text-xs text-muted-foreground">
                <FileCheck className="size-4 text-primary" />
                <span>Attachment: {question.attachmentName}</span>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-1.5">
              {question.tags.map((t) => (
                <span key={t} className="rounded-md bg-secondary px-2 py-0.5 text-[11px] text-secondary-foreground font-medium">
                  #{t}
                </span>
              ))}
            </div>

            {/* Author details & actions */}
            <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4">
              <span className="flex items-center gap-2 text-sm font-medium">
                <span className="grid size-8 place-items-center rounded-full bg-primary/12 text-[11px] font-bold text-primary">
                  {author?.avatarInitials}
                </span>
                <span>{author?.name}</span>
              </span>
              {author && <RoleBadge role={author.role} />}
              {author?.department && (
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  · {author.department}
                </span>
              )}

              <div className="ml-auto flex flex-wrap items-center gap-1 sm:gap-2">
                <Button
                  size="sm"
                  variant={votes.myVote(question.id) === 1 ? "default" : "outline"}
                  onClick={() => handleVote(question.id, "question", 1)}
                  key={tick}
                  className="gap-1"
                >
                  <ArrowBigUp className="size-4" aria-hidden /> {question.upvotes}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    const next = await questionsApi.toggleSaved(question.id);
                    setSaved(next);
                    flash(next ? "Saved to your campus library." : "Removed from library.");
                  }}
                  className="gap-1"
                >
                  <Bookmark className={cn("size-4", saved && "fill-current text-amber-500")} aria-hidden />
                  <span className="hidden sm:inline">{saved ? "Saved" : "Save"}</span>
                </Button>
                <Button size="sm" variant="outline" onClick={copyShareLink} aria-label="Share internally">
                  <Share2 className="size-4" aria-hidden />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => triggerReport(question.id, "question", question.title)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Flag className="size-4" aria-hidden />
                  <span className="hidden sm:inline ml-1">Report</span>
                </Button>
              </div>
            </div>
          </article>

          {/* SECTION 8: ⚡ INSTANT ASSISTANCE CARD */}
          {question.instantAssistance && (
            <section
              aria-label="Instant Academic Assistance"
              className={cn(
                "rounded-2xl border p-5 shadow-card transition-all sm:p-6",
                question.instantAssistance.responseType === "verified_campus" ||
                  question.instantAssistance.responseType === "faculty_verified"
                  ? "border-emerald-500/40 bg-emerald-50/15 dark:bg-emerald-950/10"
                  : question.instantAssistance.responseType === "ai_uncertain"
                    ? "border-rose-500/40 bg-rose-50/15 dark:bg-rose-950/10"
                    : "border-blue-500/40 bg-blue-50/15 dark:bg-blue-950/10",
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Zap className="size-4.5" aria-hidden />
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-foreground">
                      ⚡ INSTANT ASSISTANCE
                    </h2>
                    <p className="text-[11px] text-muted-foreground">
                      Available immediately without waiting for review
                    </p>
                  </div>
                </div>
                <AIResponseBadge type={question.instantAssistance.responseType} size="md" />
              </div>

              <div className="mt-4">
                <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
                  {question.instantAssistance.content}
                </p>

                {/* Theoretical Concepts & Hints */}
                {question.instantAssistance.concepts && (
                  <div className="mt-4 rounded-xl border border-border bg-card/80 p-3.5 text-xs">
                    <p className="font-semibold text-foreground flex items-center gap-1.5 mb-2">
                      <Lightbulb className="size-3.5 text-amber-500" /> Key Theoretical Concepts:
                    </p>
                    <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                      {question.instantAssistance.concepts.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Campus Resource Details */}
                {question.instantAssistance.campusResource && (
                  <div className="mt-4 rounded-xl border border-sky-500/30 bg-sky-500/10 p-3.5 text-xs text-sky-950 dark:text-sky-200">
                    <p className="font-bold flex items-center gap-1.5 text-sm mb-1">
                      <MapPin className="size-4 text-sky-600" />
                      {question.instantAssistance.campusResource.name}
                    </p>
                    <p className="text-muted-foreground">📍 Location: {question.instantAssistance.campusResource.location}</p>
                    <p className="text-muted-foreground">👤 Point of Contact: {question.instantAssistance.campusResource.contactPerson}</p>
                    <p className="text-muted-foreground">🕒 Working Hours: {question.instantAssistance.campusResource.workingHours}</p>
                  </div>
                )}

                {/* AI Uncertain Fallback & Action Button */}
                {question.instantAssistance.responseType === "ai_uncertain" && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 text-xs text-amber-900 dark:text-amber-200">
                    <div>
                      <p className="font-bold flex items-center gap-1.5">
                        <AlertTriangle className="size-4 text-amber-600" /> Human Peer / Faculty Help Needed
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Because this problem has non-trivial constraints, human mentors have been requested.
                      </p>
                    </div>
                    <Button size="sm" asChild className="bg-amber-600 hover:bg-amber-700 text-white text-xs">
                      <a href="#post-answer">Contribute Human Solution</a>
                    </Button>
                  </div>
                )}

                {/* Mandatory Disclaimer from Section 8 */}
                <p className="mt-4 text-[11px] text-muted-foreground italic border-t border-border/50 pt-2.5">
                  🛡️ {questionsApi.isSaved(question.id) ? "" : ""}
                  AI-generated assistance — verify with a peer, mentor or faculty member when needed.
                </p>
              </div>
            </section>
          )}

          {/* SECTION 8: 👥 HUMAN HELP (PARALLEL TRACKER) */}
          <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
              <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
                <Users className="size-4 text-primary" aria-hidden />
                <span>👥 HUMAN HELP (CAMPUS MENTORS &amp; FACULTY)</span>
              </h2>
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                {list.length} Answer{list.length === 1 ? "" : "s"} submitted
              </span>
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              Your question was simultaneously shared with relevant senior peer mentors and department faculty helpers:
            </p>

            {question.notifiedHelpers && question.notifiedHelpers.length > 0 && (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {question.notifiedHelpers.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-muted/40 p-2.5 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="grid size-6 place-items-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                        {h.name.slice(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <span className="font-semibold block">{h.name}</span>
                        <span className="text-[10px] text-muted-foreground">{h.department}</span>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                        h.status === "answering"
                          ? "bg-amber-500/15 text-amber-800 dark:text-amber-300 animate-pulse"
                          : h.status === "viewed"
                            ? "bg-blue-500/15 text-blue-800 dark:text-blue-300"
                            : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {h.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* SECTION 10: ANSWERS LIST */}
          <section className="space-y-4">
            <h2 className="text-base font-bold flex items-center gap-2 text-foreground">
              <MessageSquare className="size-4.5 text-primary" aria-hidden />
              <span>Campus Answers ({list.length})</span>
            </h2>

            {list.map((a) => (
              <AnswerCard
                key={a.id}
                answer={a}
                isQuestionOwner={isOwner}
                isFacultyOrAdmin={isFacultyOrAdmin}
                currentUserId={user.id}
                onVote={(dir) => handleVote(a.id, "answer", dir)}
                onAccept={async () => {
                  await answersApi.acceptAnswer({
                    answerId: a.id,
                    questionId: question.id,
                    requesterId: user.id,
                  });
                  flash("Answer accepted! Author awarded +15 reputation.");
                  await load();
                }}
                onVerify={async () => {
                  await answersApi.verifyAnswer({
                    answerId: a.id,
                    verifierId: user.id,
                  });
                  flash("Answer verified by Faculty! 🎓 Added to campus knowledge base (+25 rep).");
                  await load();
                }}
                onUnverify={async () => {
                  await answersApi.unverifyAnswer({
                    answerId: a.id,
                    verifierId: user.id,
                  });
                  flash("Verification removed.");
                  await load();
                }}
                onReply={async (content) => {
                  await answersApi.replyToAnswer({ answerId: a.id, authorId: user.id, content });
                  await load();
                }}
                onReport={() => triggerReport(a.id, "answer", a.content.slice(0, 80))}
              />
            ))}

            {list.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
                <Users className="size-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="font-semibold text-foreground">No peer or faculty answers yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Be the first campus member to share your solution or helpful explanation below.
                </p>
              </div>
            )}
          </section>

          {/* POST AN ANSWER FORM */}
          <section id="post-answer" className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-foreground">
                {user.role === "faculty"
                  ? "Post Faculty Answer (Official Verification)"
                  : user.role === "mentor"
                    ? "Post Peer Mentor Answer"
                    : "Post Your Answer"}
              </h2>
              <RoleBadge role={user.role} />
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Explain the conceptual reasoning clearly so your peers understand the principles.
            </p>
            <textarea
              rows={5}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write your explanation or step-by-step walkthrough..."
              aria-label="Your answer"
              className="w-full resize-y rounded-xl border border-input bg-background p-3.5 text-sm outline-none focus:border-primary"
            />
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {user.role === "faculty" ? "🎓 Will be marked Faculty Verified" : "💡 Accepted answers award +15 reputation"}
              </span>
              <Button
                disabled={!draft.trim() || busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await answersApi.createAnswer({
                      questionId: question.id,
                      authorId: user.id,
                      content: draft,
                    });
                    setDraft("");
                    await load();
                    flash("Your answer has been posted to the campus community.");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
                <span className="ml-1.5">Post Answer</span>
              </Button>
            </div>
          </section>
        </div>

        {/* SIDEBAR: RELATED KNOWLEDGE & RESOURCES */}
        <aside className="space-y-4">
          {/* Related Knowledge Section */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h2 className="text-sm font-bold flex items-center gap-2 text-foreground">
              <Compass className="size-4 text-primary" aria-hidden />
              <span>🔎 RELATED KNOWLEDGE</span>
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Similar campus doubts and accepted solutions:
            </p>
            <ul className="mt-3 space-y-2">
              {similar.map((s) => (
                <li key={s.id}>
                  <Link
                    to="/questions/$questionId"
                    params={{ questionId: s.id }}
                    className="block rounded-xl bg-muted/60 p-3 text-xs font-medium transition-colors hover:bg-accent"
                  >
                    <span className="font-semibold text-foreground block line-clamp-2">{s.title}</span>
                    <span className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>{s.subject}</span>
                      <span>·</span>
                      <span>{s.answerCount} answers</span>
                      {s.status === "solved" && <span className="text-emerald-600 font-bold">✓ Solved</span>}
                    </span>
                  </Link>
                </li>
              ))}
              {similar.length === 0 && (
                <li className="text-xs text-muted-foreground">No matching prior questions found.</li>
              )}
            </ul>
          </div>

          {/* Quick Campus Directory Shortcut */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h2 className="text-sm font-bold flex items-center gap-2 text-foreground">
              <MapPin className="size-4 text-amber-600" aria-hidden />
              <span>Campus Resource Desk</span>
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Need in-person lab or coordinator assistance for {question.subject}?
            </p>
            <div className="mt-3">
              <Button variant="outline" size="sm" asChild className="w-full text-xs">
                <Link to="/resources">
                  Open Campus Directory
                </Link>
              </Button>
            </div>
          </div>
        </aside>
      </div>

      {/* Report Modal */}
      {reportTarget && (
        <ReportModal
          open={reportModalOpen}
          onOpenChange={setReportModalOpen}
          contentId={reportTarget.contentId}
          contentType={reportTarget.contentType}
          excerpt={reportTarget.excerpt}
          reporterId={user.id}
          onSuccess={() => flash("Report submitted to moderation desk.")}
        />
      )}
    </AppShell>
  );
}

function AnswerCard({
  answer,
  isQuestionOwner,
  isFacultyOrAdmin,
  currentUserId,
  onVote,
  onAccept,
  onVerify,
  onUnverify,
  onReply,
  onReport,
}: {
  answer: Answer;
  isQuestionOwner: boolean;
  isFacultyOrAdmin: boolean;
  currentUserId: string;
  onVote: (dir: 1 | -1) => void;
  onAccept: () => void;
  onVerify: () => void;
  onUnverify: () => void;
  onReply: (content: string) => Promise<void>;
  onReport: () => void;
}) {
  const author = findUser(answer.authorId);
  const [replying, setReplying] = useState(false);
  const [text, setText] = useState("");

  return (
    <article
      className={cn(
        "rounded-2xl border bg-card p-5 shadow-card transition-all",
        answer.isFacultyVerified
          ? "border-amber-500/50 bg-amber-50/15 dark:bg-amber-950/10 ring-1 ring-amber-500/30"
          : answer.isAccepted
            ? "border-emerald-500/50 bg-emerald-50/15 dark:bg-emerald-950/10"
            : "border-border",
      )}
    >
      {/* Verification / Acceptance Badges */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {answer.isFacultyVerified && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-900 dark:text-amber-200">
            <Award className="size-3.5 text-amber-700" aria-hidden />
            <span>🎓 Faculty Verified (Official Knowledge Base)</span>
          </span>
        )}

        {answer.isAccepted && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-200">
            <CheckCircle2 className="size-3.5 text-emerald-600" aria-hidden />
            <span>✓ Accepted Solution</span>
          </span>
        )}

        <AIResponseBadge type={answer.answerType} size="sm" />
      </div>

      <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/95">
        {answer.content}
      </p>

      {/* Answer footer */}
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3 text-xs">
        <span className="flex items-center gap-1.5 font-medium text-foreground">
          <span className="grid size-7 place-items-center rounded-full bg-primary/12 text-[10px] font-bold text-primary">
            {author?.avatarInitials}
          </span>
          <span>{author?.name}</span>
        </span>
        {author && <RoleBadge role={author.role} />}
        <span className="text-muted-foreground">{timeAgo(answer.createdAt)}</span>

        <div className="ml-auto flex flex-wrap items-center gap-1 sm:gap-2">
          <Button size="sm" variant="outline" onClick={() => onVote(1)} className="h-8 gap-1">
            <ArrowBigUp className="size-4" aria-hidden /> {answer.upvotes}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onVote(-1)} className="h-8 text-muted-foreground" aria-label="Downvote">
            <ArrowBigDown className="size-4" aria-hidden />
          </Button>

          <Button size="sm" variant="ghost" onClick={() => setReplying(!replying)} className="h-8">
            Reply
          </Button>

          <Button size="sm" variant="ghost" onClick={onReport} className="h-8 text-muted-foreground hover:text-destructive">
            <Flag className="size-3.5" aria-hidden />
            <span className="sr-only">Report</span>
          </Button>

          {/* Question Owner: Accept Answer */}
          {isQuestionOwner && !answer.isAccepted && (
            <Button size="sm" variant="outline" onClick={onAccept} className="h-8 border-emerald-500 text-emerald-700 hover:bg-emerald-50">
              <CheckCircle2 className="size-3.5 mr-1" /> Accept Answer
            </Button>
          )}

          {/* Faculty / Admin: Verify Answer */}
          {isFacultyOrAdmin && !answer.isFacultyVerified && (
            <Button size="sm" onClick={onVerify} className="h-8 bg-amber-600 hover:bg-amber-700 text-white font-semibold">
              <Award className="size-3.5 mr-1" /> Verify Answer
            </Button>
          )}

          {isFacultyOrAdmin && answer.isFacultyVerified && (
            <Button size="sm" variant="outline" onClick={onUnverify} className="h-8 text-xs text-muted-foreground">
              Revoke Verification
            </Button>
          )}
        </div>
      </div>

      {/* Replies */}
      {answer.replies.length > 0 && (
        <ul className="mt-3 space-y-2 border-l-2 border-border pl-4 text-xs">
          {answer.replies.map((r) => (
            <li key={r.id} className="text-muted-foreground">
              <span className="font-semibold text-foreground">{findUser(r.authorId)?.name}: </span>
              {r.content}
            </li>
          ))}
        </ul>
      )}

      {replying && (
        <div className="mt-3 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a clarification or reply..."
            aria-label="Reply text"
            className="h-9 flex-1 rounded-xl border border-input bg-background px-3 text-xs outline-none focus:border-primary"
          />
          <Button
            size="sm"
            disabled={!text.trim()}
            onClick={async () => {
              await onReply(text);
              setText("");
              setReplying(false);
            }}
            className="h-9"
          >
            Send
          </Button>
        </div>
      )}
    </article>
  );
}
