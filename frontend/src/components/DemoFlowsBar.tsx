import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Award,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  HelpCircle,
  MapPin,
  PlayCircle,
  Shield,
  Sparkles,
  User,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { auth } from "@/services/auth";
import type { Role, User as UserType } from "@/services/types";

interface Props {
  currentUser: UserType;
  onOpenAIChat?: (prompt?: string) => void;
}

export function DemoFlowsBar({ currentUser, onOpenAIChat }: Props) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const switchRole = async (role: Role) => {
    const nextUser = await auth.loginAs(role);
    if (role === "admin") {
      navigate({ to: "/moderation" });
    } else {
      window.location.reload();
    }
  };

  const triggerFlow = async (flowNumber: number) => {
    switch (flowNumber) {
      case 1:
        // Flow 1: Student asks simple academic doubt -> Instant AI answer
        onOpenAIChat?.("What is photosynthesis and how does it release oxygen?");
        break;
      case 2:
        // Flow 2: Complex doubt -> AI limited assistance + recommends mentor + Get Human Help
        navigate({ to: "/questions/$questionId", params: { questionId: "q7" } });
        break;
      case 3:
        // Flow 3: Campus procedure question -> AI identifies office/person/venue
        navigate({ to: "/resources" });
        break;
      case 4:
        // Flow 4: Task guidance -> Step-by-step guidance
        navigate({ to: "/tasks" });
        break;
      case 5:
        // Flow 5: Urgent question flow -> Instant assistance + peer mentors notified
        navigate({ to: "/questions/$questionId", params: { questionId: "q5" } });
        break;
      case 6:
        // Flow 6: Peer mentor answers -> Student accepts answer
        if (currentUser.role !== "student") {
          await auth.loginAs("student");
        }
        navigate({ to: "/questions/$questionId", params: { questionId: "q1" } });
        break;
      case 7:
        // Flow 7: Faculty verifies answer -> Faculty Verified
        if (currentUser.role !== "faculty") {
          await auth.loginAs("faculty");
        }
        navigate({ to: "/questions/$questionId", params: { questionId: "q1" } });
        break;
    }
  };

  return (
    <aside
      aria-label="Hackathon Demo Controller"
      className="sticky top-16 z-30 border-b border-border bg-gradient-to-r from-amber-500/10 via-blue-500/10 to-red-500/10 backdrop-blur"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-bold text-amber-900 dark:text-amber-200">
            <PlayCircle className="size-3.5" aria-hidden /> SIH HACKATHON DEMO CONTROLLER
          </span>

          {/* Quick Role Switcher */}
          <div className="hidden sm:flex items-center gap-1 text-xs">
            <span className="text-muted-foreground mr-1">Active Role:</span>
            {(["student", "mentor", "faculty", "admin"] as Role[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => void switchRole(r)}
                className={`rounded-lg px-2 py-0.5 text-xs font-semibold capitalize transition-all ${
                  currentUser.role === r
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-card text-muted-foreground hover:bg-secondary hover:text-foreground border border-border"
                }`}
              >
                {r === "mentor" ? "Peer Mentor" : r}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-7 text-xs font-semibold gap-1 text-primary"
          >
            <span>Test 7 Evaluation Flows</span>
            {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </Button>
        </div>
      </div>

      {/* Expanded Flow Launcher */}
      {expanded && (
        <div className="border-t border-border bg-card/95 p-4 shadow-lg backdrop-blur">
          <div className="mx-auto max-w-7xl">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Click any Hackathon Flow to demonstrate in 1 second:
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <button
                type="button"
                onClick={() => void triggerFlow(1)}
                className="flex items-start gap-2.5 rounded-xl border border-border p-2.5 text-left text-xs transition-colors hover:border-primary hover:bg-primary/5"
              >
                <Zap className="size-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">FLOW 1: Simple Academic Doubt</span>
                  <span className="text-[11px] text-muted-foreground">Photosynthesis → AI instant concise answer</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => void triggerFlow(2)}
                className="flex items-start gap-2.5 rounded-xl border border-border p-2.5 text-left text-xs transition-colors hover:border-primary hover:bg-primary/5"
              >
                <HelpCircle className="size-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">FLOW 2: Complex Doubt &amp; Mentor Routing</span>
                  <span className="text-[11px] text-muted-foreground">Aldol mechanism → Hints + &quot;Get Human Help&quot;</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => void triggerFlow(3)}
                className="flex items-start gap-2.5 rounded-xl border border-border p-2.5 text-left text-xs transition-colors hover:border-primary hover:bg-primary/5"
              >
                <MapPin className="size-4 text-sky-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">FLOW 3: Campus Navigation</span>
                  <span className="text-[11px] text-muted-foreground">Office, venue, coordinator &amp; hours directory</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => void triggerFlow(4)}
                className="flex items-start gap-2.5 rounded-xl border border-border p-2.5 text-left text-xs transition-colors hover:border-primary hover:bg-primary/5"
              >
                <CheckCircle2 className="size-4 text-purple-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">FLOW 4: Task Action Guidance</span>
                  <span className="text-[11px] text-muted-foreground">Capstone submission checklist &amp; next step</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => void triggerFlow(5)}
                className="flex items-start gap-2.5 rounded-xl border border-border p-2.5 text-left text-xs transition-colors hover:border-primary hover:bg-primary/5"
              >
                <span className="size-2 rounded-full bg-red-600 animate-ping mt-1" />
                <div>
                  <span className="font-bold block text-red-600">FLOW 5: Urgent Help Flow</span>
                  <span className="text-[11px] text-muted-foreground">B-Tree segfault → Urgent badge &amp; mentors alerted</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => void triggerFlow(6)}
                className="flex items-start gap-2.5 rounded-xl border border-border p-2.5 text-left text-xs transition-colors hover:border-primary hover:bg-primary/5"
              >
                <Users className="size-4 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">FLOW 6: Peer Answer &amp; Acceptance</span>
                  <span className="text-[11px] text-muted-foreground">Kabir answers → Student accepts (+15 rep)</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => void triggerFlow(7)}
                className="flex items-start gap-2.5 rounded-xl border border-border p-2.5 text-left text-xs transition-colors hover:border-primary hover:bg-primary/5"
              >
                <Award className="size-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-amber-800 dark:text-amber-300">FLOW 7: Faculty Verification</span>
                  <span className="text-[11px] text-muted-foreground">Dr. Meera verifies → 🎓 Faculty Verified badge</span>
                </div>
              </button>

              <div className="flex sm:hidden flex-col gap-1 pt-1">
                <span className="text-[11px] font-semibold text-muted-foreground">Switch role:</span>
                <div className="grid grid-cols-4 gap-1">
                  {(["student", "mentor", "faculty", "admin"] as Role[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => void switchRole(r)}
                      className="rounded bg-secondary p-1 text-[10px] font-bold capitalize"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
