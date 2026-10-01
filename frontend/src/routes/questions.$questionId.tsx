import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowBigUp, Bookmark, CheckCircle2, Flag, Loader2, MessageSquare, Send } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AIAssistantCard } from "@/components/AIAssistantCard";
import { RoleBadge } from "@/components/RoleBadge";
import { Button } from "@/components/ui/button";
import { timeAgo, useSession } from "@/lib/session";
import { cn } from "@/lib/utils";
import { answers as answersApi } from "@/services/answers";
import { questions as questionsApi } from "@/services/questions";
import { reports } from "@/services/reports";
import { votes } from "@/services/votes";
import { findUser } from "@/services/store";
import type { Answer, Question } from "@/services/types";

export const Route = createFileRoute("/questions/$questionId")({
  head: () => ({
    meta: [
      { title: "Question · CAMPUS-Q&A" },
      { name: "description", content: "Read the full question, peer and mentor answers, and the accepted solution." },
      { property: "og:title", content: "Question · CAMPUS-Q&A" },
      { property: "og:description", content: "Answers from peers, verified mentors and faculty at your institution." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
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

  const load = useCallback(async () => {
    const [q, a, s] = await Promise.all([
      questionsApi.getQuestion(questionId),
      answersApi.getAnswers(questionId),
      questionsApi.getSimilarQuestions({ questionId }),
    ]);
    setQuestion(q);
    setList(a);
    setSimilar(s);
    setSaved(questionsApi.isSaved(questionId));
  }, [questionId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!user) return null;
  if (!question)
    return (
      <AppShell user={user}>
        <div className="h-64 animate-pulse rounded-2xl bg-card" />
      </AppShell>
    );

  const author = findUser(question.authorId);
  const isOwner = question.authorId === user.id;

  const flash = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(""), 3200);
  };

  const upvote = async (contentId: string, contentType: "question" | "answer") => {
    await votes.vote({ contentId, contentType, voteType: 1 });
    setTick((t) => t + 1);
    await load();
  };

  const report = async (contentId: string, contentType: "question" | "answer", excerpt: string) => {
    await reports.createReport({
      reporterId: user.id,
      contentId,
      contentType,
      excerpt,
      reason: "Flagged by a student for moderator review",
    });
    flash("Reported. A moderator will review this shortly.");
  };

  return (
    <AppShell user={user}>
      {toast && (
        <p role="status" className="mb-4 rounded-xl bg-success/12 px-4 py-3 text-sm text-success">
          {toast}
        </p>
      )}

      <div className="grid gap-5 xl:grid-cols-[1fr_330px]">
        <div className="space-y-5">
          <article className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                {question.subject}
              </span>
              {question.status === "solved" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-success/12 px-2.5 py-0.5 text-[11px] font-semibold text-success">
                  <CheckCircle2 className="size-3" aria-hidden /> Solved
                </span>
              )}
              <span className="text-xs text-muted-foreground">{timeAgo(question.createdAt)}</span>
            </div>

            <h1 className="mt-3 text-xl font-bold leading-snug sm:text-2xl">{question.title}</h1>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground/90">
              {question.description}
            </p>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {question.tags.map((t) => (
                <span key={t} className="rounded-md bg-secondary px-2 py-0.5 text-[11px] text-secondary-foreground">
                  #{t}
                </span>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4">
              <span className="flex items-center gap-2 text-sm font-medium">
                <span className="grid size-8 place-items-center rounded-full bg-primary/12 text-[11px] font-bold text-primary">
                  {author?.avatarInitials}
                </span>
                {author?.name}
              </span>
              {author && <RoleBadge role={author.role} />}

              <div className="ml-auto flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={votes.myVote(question.id) ? "default" : "outline"}
                  onClick={() => upvote(question.id, "question")}
                  key={tick}
                >
                  <ArrowBigUp className="size-4" aria-hidden /> {question.upvotes}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    const next = await questionsApi.toggleSaved(question.id);
                    setSaved(next);
                    flash(next ? "Saved to your library." : "Removed from saved.");
                  }}
                >
                  <Bookmark className={cn("size-4", saved && "fill-current")} aria-hidden />
                  {saved ? "Saved" : "Save"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => report(question.id, "question", question.title)}
                >
                  <Flag className="size-4" aria-hidden /> Report
                </Button>
              </div>
            </div>
          </article>

          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <MessageSquare className="size-4" aria-hidden /> {list.length} Answer{list.length === 1 ? "" : "s"}
            </h2>
            <div className="space-y-3">
              {list.map((a) => (
                <AnswerCard
                  key={a.id}
                  answer={a}
                  isOwner={isOwner}
                  onUpvote={() => upvote(a.id, "answer")}
                  onAccept={async () => {
                    await answersApi.acceptAnswer({
                      answerId: a.id,
                      questionId: question.id,
                      requesterId: user.id,
                    });
                    flash("Answer accepted. The author earned +15 reputation.");
                    await load();
                  }}
                  onReply={async (content) => {
                    await answersApi.replyToAnswer({ answerId: a.id, authorId: user.id, content });
                    await load();
                  }}
                  onReport={() => report(a.id, "answer", a.content.slice(0, 60))}
                />
              ))}
              {list.length === 0 && (
                <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  No answers yet. Be the first to help.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h2 className="text-sm font-semibold">Your answer</h2>
            <textarea
              rows={5}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Explain the reasoning, not just the result."
              aria-label="Your answer"
              className="mt-3 w-full resize-y rounded-xl border border-input bg-background p-3.5 text-sm outline-none focus:border-primary"
            />
            <Button
              className="mt-3"
              disabled={!draft.trim() || busy}
              onClick={async () => {
                setBusy(true);
                await answersApi.createAnswer({ questionId: question.id, authorId: user.id, content: draft });
                setDraft("");
                setBusy(false);
                await load();
                flash("Your answer was posted.");
              }}
            >
              {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
              Post Answer
            </Button>
          </section>
        </div>

        <aside className="space-y-4">
          <AIAssistantCard questionId={question.id} />
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h2 className="text-sm font-semibold">Similar Questions</h2>
            <ul className="mt-3 space-y-2">
              {similar.map((s) => (
                <li key={s.id}>
                  <Link
                    to="/questions/$questionId"
                    params={{ questionId: s.id }}
                    className="block rounded-xl bg-muted/60 p-3 text-sm font-medium transition-colors hover:bg-accent"
                  >
                    {s.title}
                  </Link>
                </li>
              ))}
              {similar.length === 0 && <li className="text-sm text-muted-foreground">Nothing similar yet.</li>}
            </ul>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function AnswerCard({
  answer,
  isOwner,
  onUpvote,
  onAccept,
  onReply,
  onReport,
}: {
  answer: Answer;
  isOwner: boolean;
  onUpvote: () => void;
  onAccept: () => void;
  onReply: (content: string) => Promise<void>;
  onReport: () => void;
}) {
  const author = findUser(answer.authorId);
  const [replying, setReplying] = useState(false);
  const [text, setText] = useState("");

  return (
    <article
      className={cn(
        "rounded-2xl border bg-card p-5 shadow-card",
        answer.isAccepted ? "border-success/50 ring-1 ring-success/25" : "border-border",
      )}
    >
      {answer.isAccepted && (
        <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-success/12 px-2.5 py-1 text-[11px] font-semibold text-success">
          <CheckCircle2 className="size-3.5" aria-hidden /> Accepted Answer
        </p>
      )}
      <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">{answer.content}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <span className="flex items-center gap-2 text-sm font-medium">
          <span className="grid size-7 place-items-center rounded-full bg-primary/12 text-[10px] font-bold text-primary">
            {author?.avatarInitials}
          </span>
          {author?.name}
        </span>
        {author && <RoleBadge role={author.role} />}
        <span className="text-xs text-muted-foreground">{timeAgo(answer.createdAt)}</span>

        <div className="ml-auto flex flex-wrap gap-1">
          <Button size="sm" variant="outline" onClick={onUpvote}>
            <ArrowBigUp className="size-4" aria-hidden /> {answer.upvotes}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setReplying((r) => !r)}>
            Reply
          </Button>
          <Button size="sm" variant="ghost" onClick={onReport}>
            <Flag className="size-4" aria-hidden />
            <span className="sr-only">Report answer</span>
          </Button>
          {isOwner && !answer.isAccepted && (
            <Button size="sm" onClick={onAccept}>
              <CheckCircle2 className="size-4" aria-hidden /> Accept
            </Button>
          )}
        </div>
      </div>

      {answer.replies.length > 0 && (
        <ul className="mt-3 space-y-2 border-l-2 border-border pl-4">
          {answer.replies.map((r) => (
            <li key={r.id} className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{findUser(r.authorId)?.name}: </span>
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
            placeholder="Add a reply…"
            aria-label="Reply"
            className="h-10 flex-1 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary"
          />
          <Button
            size="sm"
            disabled={!text.trim()}
            onClick={async () => {
              await onReply(text);
              setText("");
              setReplying(false);
            }}
          >
            Send
          </Button>
        </div>
      )}
    </article>
  );
}
