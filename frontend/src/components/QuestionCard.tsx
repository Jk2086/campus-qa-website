import { Link } from "@tanstack/react-router";
import { ArrowBigUp, CheckCircle2, Eye, MessageSquare, Sparkles } from "lucide-react";
import { AIResponseBadge } from "@/components/AIResponseBadge";
import { RoleBadge } from "@/components/RoleBadge";
import { UrgentBadge } from "@/components/UrgentBadge";
import { timeAgo } from "@/lib/session";
import { findUser } from "@/services/store";
import type { Question } from "@/services/types";

export function QuestionCard({ question, compact = false }: { question: Question; compact?: boolean }) {
  const author = findUser(question.authorId);

  return (
    <Link
      to="/questions/$questionId"
      params={{ questionId: question.id }}
      className={`card-rise block rounded-2xl border bg-card p-4 shadow-card transition-all sm:p-5 ${
        question.isUrgent
          ? "border-red-500/40 bg-red-50/20 dark:bg-red-950/10 ring-1 ring-red-500/20"
          : "border-border"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        {question.isUrgent && <UrgentBadge />}

        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
          {question.subject}
        </span>

        {question.status === "solved" ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/12 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="size-3" aria-hidden /> Solved
          </span>
        ) : question.answerCount === 0 ? (
          <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 dark:text-amber-300">
            Unanswered
          </span>
        ) : (
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
            Open ({question.answerCount} answers)
          </span>
        )}

        {question.instantAssistance && (
          <AIResponseBadge type={question.instantAssistance.responseType} size="sm" />
        )}

        <span className="ml-auto text-xs text-muted-foreground">{timeAgo(question.createdAt)}</span>
      </div>

      <h3 className="mt-2.5 text-base font-semibold leading-snug text-foreground sm:text-lg">
        {question.title}
      </h3>

      {!compact && (
        <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{question.description}</p>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {question.tags.map((tag) => (
          <span key={tag} className="rounded-md bg-secondary px-2 py-0.5 text-[11px] text-secondary-foreground">
            #{tag}
          </span>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5 font-medium text-foreground">
          <span className="grid size-6 place-items-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
            {author?.avatarInitials}
          </span>
          {author?.name}
        </span>
        {author && <RoleBadge role={author.role} />}

        <span className="ml-auto flex items-center gap-1 font-semibold text-foreground">
          <ArrowBigUp className="size-4 text-primary" aria-hidden /> {question.upvotes}
        </span>
        <span className="flex items-center gap-1">
          <MessageSquare className="size-4" aria-hidden /> {question.answerCount}
        </span>
        <span className="hidden items-center gap-1 sm:flex">
          <Eye className="size-4" aria-hidden /> {question.views}
        </span>
      </div>
    </Link>
  );
}
