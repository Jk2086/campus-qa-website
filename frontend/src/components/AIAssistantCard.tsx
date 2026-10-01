import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Lightbulb, Loader2, Sparkles, BookOpen, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ai } from "@/services/ai";
import type { Question } from "@/services/types";

type Mode = "hint" | "explain" | "related";

export function AIAssistantCard({ questionId }: { questionId: string }) {
  const [mode, setMode] = useState<Mode | null>(null);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [related, setRelated] = useState<Question[]>([]);

  const run = async (next: Mode) => {
    setMode(next);
    setLoading(true);
    setText("");
    setRelated([]);
    try {
      if (next === "hint") setText((await ai.getHint(questionId)).hint);
      if (next === "explain") setText((await ai.explainConcept(questionId)).explanation);
      if (next === "related") setRelated(await ai.relatedQuestions(questionId));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-primary/25 bg-card p-5 shadow-card">
      <div className="flex items-center gap-2">
        <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="size-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-base font-semibold">AI Study Assistant</h2>
          <p className="text-xs text-muted-foreground">Guidance, not answers.</p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
        <Button variant={mode === "hint" ? "default" : "outline"} size="sm" onClick={() => run("hint")}>
          <Lightbulb className="size-4" aria-hidden /> AI Hint
        </Button>
        <Button variant={mode === "explain" ? "default" : "outline"} size="sm" onClick={() => run("explain")}>
          <BookOpen className="size-4" aria-hidden /> Explain Concept
        </Button>
        <Button variant={mode === "related" ? "default" : "outline"} size="sm" onClick={() => run("related")}>
          <Link2 className="size-4" aria-hidden /> Related Questions
        </Button>
      </div>

      <div aria-live="polite" className="mt-4">
        {loading && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden /> Thinking…
          </p>
        )}
        {!loading && text && (
          <p className="whitespace-pre-line rounded-xl bg-muted/60 p-4 text-sm leading-relaxed text-foreground">
            {text}
          </p>
        )}
        {!loading && related.length > 0 && (
          <ul className="space-y-2">
            {related.map((q) => (
              <li key={q.id}>
                <Link
                  to="/questions/$questionId"
                  params={{ questionId: q.id }}
                  className="block rounded-xl bg-muted/60 p-3 text-sm font-medium transition-colors hover:bg-accent"
                >
                  {q.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-4 rounded-lg bg-warning/15 px-3 py-2 text-[11px] leading-relaxed text-warning-foreground">
        {ai.DISCLAIMER}
      </p>
    </section>
  );
}
