import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Info,
  Loader2,
  Paperclip,
  Save,
  Send,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { AppShell, PageHeading } from "@/components/AppShell";
import { UrgentBadge } from "@/components/UrgentBadge";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";
import { questions } from "@/services/questions";
import { SUBJECTS, type Question, type Subject } from "@/services/types";

export const Route = createFileRoute("/ask")({
  head: () => ({
    meta: [
      { title: "Ask a Question · CAMPUS-Q&A" },
      { name: "description", content: "Post an academic doubt to peers, verified mentors and faculty." },
    ],
  }),
  component: Ask,
});

function Ask() {
  const { user } = useSession();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState<Subject>("Computer Science");
  const [topic, setTopic] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [attachment, setAttachment] = useState<string | null>(null);
  const [isUrgent, setIsUrgent] = useState(false);
  const [requestInstantAI, setRequestInstantAI] = useState(true);
  const [requestParallelHelpers, setRequestParallelHelpers] = useState(true);

  const [similar, setSimilar] = useState<Question[]>([]);
  const [saving, setSaving] = useState(false);
  const [posting, setPosting] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (title.trim().length < 6) {
      setSimilar([]);
      return;
    }
    const id = setTimeout(() => {
      void questions.getSimilarQuestions({ title, subject }).then(setSimilar);
    }, 350);
    return () => clearTimeout(id);
  }, [title, subject]);

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t) && tags.length < 5) setTags([...tags, t]);
    setTagInput("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setPosting(true);
    try {
      const created = await questions.createQuestion({
        title,
        description,
        subject,
        topic: topic.trim() || tags[0] || subject,
        tags,
        isUrgent,
        attachmentName: attachment ?? undefined,
        authorId: user.id,
        requestInstantAI,
        requestParallelHelpers,
      });
      navigate({ to: "/questions/$questionId", params: { questionId: created.id } });
    } finally {
      setPosting(false);
    }
  };

  if (!user) return null;

  return (
    <AppShell user={user}>
      <PageHeading
        title="Ask an Academic Doubt"
        subtitle="Connect with peers, verified mentors &amp; faculty while receiving instant AI academic guidance."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <form onSubmit={submit} className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
          {/* Urgent Help Toggle */}
          <div
            className={`flex items-center justify-between rounded-xl border p-4 transition-colors ${
              isUrgent
                ? "border-red-500/50 bg-red-500/10 dark:bg-red-950/20"
                : "border-border bg-muted/30"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={`grid size-9 place-items-center rounded-xl ${isUrgent ? "bg-red-600 text-white" : "bg-muted text-muted-foreground"}`}>
                <AlertCircle className="size-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">Urgent Help</span>
                  {isUrgent && <UrgentBadge />}
                </div>
                <p className="text-xs text-muted-foreground">
                  Need fast assistance before a lab session, exam, or submission deadline?
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isUrgent}
                onChange={(e) => setIsUrgent(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
            </label>
          </div>

          {/* Title */}
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-foreground">
              Question Title <span className="text-red-500">*</span>
            </span>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. How does PCR amplify DNA fragments, and why Taq polymerase?"
              className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none transition-colors focus:border-primary"
            />
          </label>

          {/* Subject & Topic Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className="mb-1.5 block text-sm font-semibold text-foreground">
                Subject <span className="text-red-500">*</span>
              </span>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value as Subject)}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary"
              >
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="mb-1.5 block text-sm font-semibold text-foreground">Topic / Sub-domain</span>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Molecular Genetics, Memory Models..."
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Description */}
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-foreground">
              Detailed Description <span className="text-red-500">*</span>
            </span>
            <textarea
              required
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain what you tried, what you expected, the exact line/formula where you got stuck..."
              className="w-full resize-y rounded-xl border border-input bg-background p-3.5 text-sm outline-none focus:border-primary"
            />
          </label>

          {/* Tags */}
          <div>
            <span className="mb-1.5 block text-sm font-semibold text-foreground">Tags (up to 5)</span>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Type tag and press Add..."
                className="h-11 flex-1 rounded-xl border border-input bg-background px-3.5 text-sm outline-none focus:border-primary"
              />
              <Button type="button" variant="outline" onClick={addTag}>
                Add Tag
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-md bg-secondary px-2.5 py-1 text-xs text-secondary-foreground font-medium"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => setTags(tags.filter((x) => x !== t))}
                      className="text-muted-foreground hover:text-destructive ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Optional Attachment */}
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground">
            <Paperclip className="size-4" aria-hidden />
            <span>{attachment ?? "Attach diagram, log output, or lab worksheet (Optional)"}</span>
            <input
              type="file"
              className="sr-only"
              onChange={(e) => setAttachment(e.target.files?.[0]?.name ?? null)}
            />
          </label>

          {/* Assistant checkboxes from Section 7 */}
          <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-4 text-xs">
            <label className="flex items-center gap-2.5 cursor-pointer font-medium text-foreground">
              <input
                type="checkbox"
                checked={requestInstantAI}
                onChange={(e) => setRequestInstantAI(e.target.checked)}
                className="rounded border-input text-primary focus:ring-primary size-4"
              />
              <Sparkles className="size-3.5 text-amber-500" />
              <span>Get instant assistance from Campus AI</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer font-medium text-foreground">
              <input
                type="checkbox"
                checked={requestParallelHelpers}
                onChange={(e) => setRequestParallelHelpers(e.target.checked)}
                className="rounded border-input text-primary focus:ring-primary size-4"
              />
              <Users className="size-3.5 text-primary" />
              <span>Request help from peers and mentors in parallel</span>
            </label>
          </div>

          {notice && (
            <p className="rounded-lg bg-emerald-500/15 p-3 text-xs text-emerald-800 dark:text-emerald-300">
              {notice}
            </p>
          )}

          {/* Buttons */}
          <div className="flex flex-col gap-2 sm:flex-row pt-2">
            <Button type="submit" size="lg" disabled={posting} className="sm:flex-1">
              {posting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              <span className="ml-1.5">{isUrgent ? "Post Urgent Question" : "Post Question"}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                await questions.saveDraft({ title, description });
                setSaving(false);
                setNotice("Draft saved locally.");
              }}
            >
              <Save className="size-4" />
              <span className="ml-1.5">Save Draft</span>
            </Button>
          </div>
        </form>

        {/* SIDEBAR: SIMILAR QUESTIONS PREVIEW (Prevent duplicates) */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h2 className="text-sm font-bold flex items-center gap-2 text-foreground">
              <Sparkles className="size-4 text-amber-500" />
              <span>Similar questions already answered</span>
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Check if your doubt is already solved in our verified campus repository:
            </p>

            {similar.length === 0 ? (
              <p className="mt-3 text-xs text-muted-foreground italic">
                Type your title above to see real-time matching questions.
              </p>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {similar.map((s) => (
                  <li key={s.id}>
                    <Link
                      to="/questions/$questionId"
                      params={{ questionId: s.id }}
                      className="block rounded-xl border border-border bg-muted/40 p-2.5 text-xs transition-colors hover:border-primary hover:bg-card"
                    >
                      <span className="font-semibold text-foreground block line-clamp-2">{s.title}</span>
                      <span className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <span className="text-primary font-medium">{s.subject}</span>
                        <span>·</span>
                        <span>{s.answerCount} answers</span>
                        {s.status === "solved" && <span className="text-emerald-600 font-bold">✓ Solved</span>}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 text-xs text-muted-foreground shadow-card space-y-2">
            <h3 className="font-bold text-foreground flex items-center gap-1.5 text-sm">
              <Info className="size-4 text-primary" /> Guidelines for Good Questions
            </h3>
            <p>• Include the specific subject, course code, and exact concepts.</p>
            <p>• Avoid vague titles like &quot;Please help with this&quot;.</p>
            <p>• Mark Urgent ONLY when facing immediate evaluation or deadline blocks.</p>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
