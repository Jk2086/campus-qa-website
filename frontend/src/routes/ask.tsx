import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, Paperclip, Save, Send, Info } from "lucide-react";
import { AppShell, PageHeading } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";
import { questions } from "@/services/questions";
import { SUBJECTS, type Question, type Subject } from "@/services/types";

export const Route = createFileRoute("/ask")({
  head: () => ({
    meta: [
      { title: "Ask a question · CAMPUS-Q&A" },
      { name: "description", content: "Post an academic question to peers, mentors and faculty at your institution." },
      { property: "og:title", content: "Ask a question · CAMPUS-Q&A" },
      { property: "og:description", content: "Share what you're stuck on and get guided answers from your campus." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [attachment, setAttachment] = useState<string | null>(null);
  const [similar, setSimilar] = useState<Question[]>([]);
  const [saving, setSaving] = useState(false);
  const [posting, setPosting] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (title.trim().length < 8) {
      setSimilar([]);
      return;
    }
    const id = setTimeout(() => {
      void questions.getSimilarQuestions({ title, subject }).then(setSimilar);
    }, 400);
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
    const created = await questions.createQuestion({
      title,
      description,
      subject,
      tags,
      ...(attachment ? { attachmentName: attachment } : {}),
      authorId: user.id,
    });
    navigate({ to: "/questions/$questionId", params: { questionId: created.id } });
  };

  if (!user) return null;

  return (
    <AppShell user={user}>
      <PageHeading title="Ask a Question" subtitle="Be specific — clear questions get answered faster." />

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <form onSubmit={submit} className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Question title</span>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. How does recursion work in C?"
              className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none focus:border-primary"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Description</span>
            <textarea
              required
              rows={7}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain what you tried, where you got stuck and what you expected to happen."
              className="w-full resize-y rounded-xl border border-input bg-background p-3.5 text-sm outline-none focus:border-primary"
            />
          </label>

          <div>
            <span className="mb-1.5 block text-sm font-medium">Subject</span>
            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map((s) => (
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
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium">Tags (up to 5)</span>
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
                placeholder="Recursion"
                className="h-11 flex-1 rounded-xl border border-input bg-background px-3.5 text-sm outline-none focus:border-primary"
              />
              <Button type="button" variant="outline" onClick={addTag}>
                Add tag
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {tags.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTags(tags.filter((x) => x !== t))}
                    className="rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Remove tag ${t}`}
                  >
                    #{t} ×
                  </button>
                ))}
              </div>
            )}
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground">
            <Paperclip className="size-4" aria-hidden />
            {attachment ?? "Attach a diagram, screenshot or lab sheet (optional)"}
            <input
              type="file"
              className="sr-only"
              onChange={(e) => setAttachment(e.target.files?.[0]?.name ?? null)}
            />
          </label>

          {notice && <p className="rounded-lg bg-success/12 px-3 py-2 text-sm text-success">{notice}</p>}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="submit" size="lg" disabled={posting} className="sm:flex-1">
              {posting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
              Post Question
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
                setNotice("Draft saved locally. It will sync once the backend is connected.");
              }}
            >
              <Save className="size-4" aria-hidden /> Save Draft
            </Button>
          </div>
        </form>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h2 className="text-sm font-semibold">Similar questions you may want to check</h2>
            {similar.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Start typing your title — matching questions will appear here before you post.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {similar.map((s) => (
                  <li key={s.id}>
                    <Link
                      to="/questions/$questionId"
                      params={{ questionId: s.id }}
                      className="block rounded-xl bg-muted/60 p-3 text-sm font-medium transition-colors hover:bg-accent"
                    >
                      {s.title}
                      <span className="mt-1 block text-xs font-normal text-muted-foreground">
                        {s.subject} · {s.answerCount} answers
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground shadow-card">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Info className="size-4 text-primary" aria-hidden /> Writing a good question
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>Summarise the problem in the title.</li>
              <li>Describe what you already tried.</li>
              <li>Add the subject and two or three precise tags.</li>
            </ul>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
