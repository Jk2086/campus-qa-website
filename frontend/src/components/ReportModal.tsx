import { useState } from "react";
import { Flag, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { moderation } from "@/services/moderation";
import type { ReportReason } from "@/services/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentId: string;
  contentType: "question" | "answer";
  excerpt: string;
  reporterId: string;
  onSuccess?: () => void;
}

const REASONS: { id: ReportReason; label: string; desc: string }[] = [
  { id: "spam", label: "Spam / Promotion", desc: "Commercial advertising, telegram links, or repeated promotional posts" },
  { id: "harassment", label: "Harassment / Abuse", desc: "Bullying, personal attacks, or disrespectful conduct towards peers/faculty" },
  { id: "irrelevant", label: "Irrelevant Content", desc: "Non-academic content that does not belong in this learning portal" },
  { id: "inappropriate", label: "Inappropriate Content", desc: "Vulgar, offensive, or policy-violating language/media" },
  { id: "misinformation", label: "Academic Misinformation / Leak", desc: "Factually hazardous errors, exam paper leaks, or cheating solicitation" },
  { id: "other", label: "Other Academic Concern", desc: "Any other issue requiring moderator inspection" },
];

export function ReportModal({
  open,
  onOpenChange,
  contentId,
  contentType,
  excerpt,
  reporterId,
  onSuccess,
}: Props) {
  const [reason, setReason] = useState<ReportReason>("irrelevant");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await moderation.createReport({
        reporterId,
        contentId,
        contentType,
        excerpt,
        reason,
        customDetails: details,
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onOpenChange(false);
        onSuccess?.();
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="size-5" aria-hidden />
            <DialogTitle>Report {contentType === "question" ? "Question" : "Answer"}</DialogTitle>
          </div>
          <DialogDescription>
            CAMPUS-Q&amp;A maintains a respectful, structured, and academic learning environment.
            Reports are reviewed by department moderators and faculty.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="py-6 text-center">
            <p className="text-sm font-semibold text-emerald-600">✓ Report submitted successfully.</p>
            <p className="mt-1 text-xs text-muted-foreground">Thank you for keeping our campus knowledge base safe.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Content snippet:</span> &ldquo;{excerpt.slice(0, 90)}&hellip;&rdquo;
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Select Reason
              </label>
              <div className="space-y-2">
                {REASONS.map((r) => (
                  <label
                    key={r.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-2.5 text-xs transition-colors ${
                      reason === r.id
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border hover:bg-muted/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={r.id}
                      checked={reason === r.id}
                      onChange={() => setReason(r.id)}
                      className="mt-0.5"
                    />
                    <div>
                      <span className="font-semibold">{r.label}</span>
                      <p className="text-[11px] text-muted-foreground">{r.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium">Additional Context (Optional)</label>
              <textarea
                rows={2}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Briefly explain why this needs moderator attention..."
                className="w-full resize-none rounded-xl border border-input bg-background p-2.5 text-xs outline-none focus:border-primary"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" size="sm" disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Flag className="size-4" aria-hidden />}
                Submit Report
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
