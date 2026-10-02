import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Compass,
  FileCheck,
  HelpCircle,
  Lightbulb,
  Loader2,
  MapPin,
  Send,
  Sparkles,
  UserCheck,
  X,
} from "lucide-react";
import { AIResponseBadge } from "@/components/AIResponseBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ai, type AIChatMessage } from "@/services/ai";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPrompt?: string;
}

export function CampusAIChatModal({ open, onOpenChange, initialPrompt }: Props) {
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: "intro",
      sender: "ai",
      situation: "general",
      responseType: "ai_suggested",
      badgeLabel: "🤖 Campus Academic Assistant",
      text: "Hello! I am your friendly **Campus Academic Assistant** 🎓\n\nMy role is **ANSWER → GUIDE → CONNECT**.\n\n• For straightforward doubts, I give quick, clear explanations.\n• For advanced problems, I provide concepts and connect you with verified Peer Mentors and Faculty.\n• For campus procedures, I point you to the exact office, coordinator, or venue.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState(initialPrompt ?? "");
  const [loading, setLoading] = useState(false);

  const sendQuery = async (queryText?: string) => {
    const textToSend = queryText ?? input;
    if (!textToSend.trim() || loading) return;

    const userMsg: AIChatMessage = {
      id: `usr_${Date.now()}`,
      sender: "user",
      situation: "general",
      responseType: "quick",
      badgeLabel: "Student Question",
      text: textToSend,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const reply = await ai.askAssistant(textToSend);
      setMessages((prev) => [...prev, reply]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: "ai",
          situation: "general",
          responseType: "ai_uncertain",
          badgeLabel: "⚠ System Notice",
          text: ai.UNAVAILABLE_NOTICE,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sampleScenarios = [
    {
      label: "🌱 Simple Doubt (Photosynthesis)",
      query: "What is photosynthesis and how does it release oxygen?",
      desc: "Situation A: Direct, friendly & concise instant answer",
    },
    {
      label: "⚠ Complex Doubt (Aldol Mechanism)",
      query: "Kinetic vs thermodynamic enolate mechanism for crossed aldol with steric hindrance",
      desc: "Situation B: Basic concepts, hints, and mentor/faculty routing",
    },
    {
      label: "🧭 Campus Navigation (Capstone Office)",
      query: "Where do I submit my capstone proposal and who is the coordinator?",
      desc: "Situation C: Exact office, venue, working hours, and contact",
    },
    {
      label: "📋 Task Guidance (Submission Steps)",
      query: "What do I need to do next for my project submission?",
      desc: "Situation D: Checklist steps + View Task Details",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[88vh] max-h-[760px] w-full max-w-2xl flex-col p-0 overflow-hidden sm:rounded-2xl">
        {/* Header */}
        <DialogHeader className="border-b border-border bg-card px-5 py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="size-5" aria-hidden />
              </span>
              <div>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  Campus AI Assistant
                  <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                    ANSWER · GUIDE · CONNECT
                  </span>
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  Academic doubt clarification, task navigation &amp; mentor routing
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Quick Scenario Chips */}
        <div className="border-b border-border bg-muted/40 px-4 py-2.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
            <Bot className="size-3.5" aria-hidden /> Try Hackathon Scenarios:
          </div>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {sampleScenarios.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => void sendQuery(s.query)}
                className="rounded-lg border border-border bg-card p-1.5 text-left text-[11px] transition-colors hover:border-primary hover:bg-primary/5 focus:outline-none"
              >
                <span className="block font-medium truncate text-foreground">{s.label}</span>
                <span className="block text-[10px] text-muted-foreground truncate">{s.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
            >
              <div className="mb-1 flex items-center gap-1.5">
                {m.sender === "ai" ? (
                  <AIResponseBadge type={m.responseType} size="sm" />
                ) : (
                  <span className="text-[11px] font-medium text-muted-foreground">You</span>
                )}
              </div>

              <div
                className={`max-w-[90%] rounded-2xl p-4 text-sm leading-relaxed sm:max-w-[85%] ${
                  m.sender === "user"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card text-foreground shadow-xs"
                }`}
              >
                <p className="whitespace-pre-line">{m.text}</p>

                {/* Concepts & Hints for complex doubts */}
                {m.concepts && m.concepts.length > 0 && (
                  <div className="mt-3 rounded-xl bg-amber-500/10 border border-amber-500/25 p-3 text-xs text-amber-900 dark:text-amber-200">
                    <p className="font-semibold flex items-center gap-1 mb-1.5">
                      <Lightbulb className="size-3.5 text-amber-600" aria-hidden /> Key Theoretical Concepts:
                    </p>
                    <ul className="list-disc pl-4 space-y-1">
                      {m.concepts.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Campus Resource Card */}
                {m.campusResource && (
                  <div className="mt-3 rounded-xl border border-sky-500/30 bg-sky-500/10 p-3 text-xs text-sky-950 dark:text-sky-200">
                    <div className="flex items-center gap-2 font-semibold text-sm">
                      <MapPin className="size-4 text-sky-600" aria-hidden />
                      {m.campusResource.name}
                    </div>
                    <p className="mt-1 text-muted-foreground">📍 {m.campusResource.location}</p>
                    <p className="text-muted-foreground">🕒 {m.campusResource.workingHours}</p>
                    <p className="text-muted-foreground">👤 {m.campusResource.contactPerson} ({m.campusResource.email})</p>
                    <div className="mt-2.5">
                      <Button variant="secondary" size="sm" asChild className="h-7 text-xs">
                        <Link to="/resources" onClick={() => onOpenChange(false)}>
                          View in Campus Directory <ArrowRight className="size-3 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Task Guidance Steps */}
                {m.taskGuidance && (
                  <div className="mt-3 rounded-xl border border-purple-500/30 bg-purple-500/10 p-3 text-xs text-purple-950 dark:text-purple-200">
                    <p className="font-semibold flex items-center gap-1.5 text-sm mb-2">
                      <FileCheck className="size-4 text-purple-600" aria-hidden />
                      Submission Steps: {m.taskGuidance.task.title}
                    </p>
                    <div className="space-y-1.5">
                      {m.taskGuidance.steps.map((st, idx) => (
                        <div key={st.id} className="flex items-center gap-2">
                          <span className={`size-4 grid place-items-center rounded-full text-[10px] font-bold ${st.completed ? "bg-emerald-600 text-white" : "border border-muted-foreground"}`}>
                            {st.completed ? "✓" : idx + 1}
                          </span>
                          <span className={st.completed ? "line-through text-muted-foreground" : "font-medium"}>
                            {st.title}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3">
                      <Button variant="outline" size="sm" asChild className="h-7 text-xs">
                        <Link to="/tasks" onClick={() => onOpenChange(false)}>
                          Open Task Guidance Portal <ArrowRight className="size-3 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Recommended Mentor & Faculty + Get Human Help */}
                {(m.recommendedMentor || m.canRequestHumanHelp) && (
                  <div className="mt-3 rounded-xl border border-border bg-muted/60 p-3 text-xs">
                    <p className="font-semibold text-foreground flex items-center gap-1.5 mb-2">
                      <UserCheck className="size-3.5 text-primary" aria-hidden /> Recommended Campus Helpers:
                    </p>
                    {m.recommendedMentor && (
                      <p className="text-muted-foreground">
                        👤 <strong>{m.recommendedMentor.name}</strong> (Peer Mentor, {m.recommendedMentor.department}) · Status: {m.recommendedMentor.availability}
                      </p>
                    )}
                    {m.recommendedFaculty && (
                      <p className="text-muted-foreground mt-0.5">
                        🎓 <strong>{m.recommendedFaculty.name}</strong> (Faculty Advisor) · Office: {m.recommendedFaculty.office}
                      </p>
                    )}
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      <Button size="sm" asChild className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white">
                        <Link to="/ask" onClick={() => onOpenChange(false)}>
                          <HelpCircle className="size-3 mr-1" /> Get Human Help (Post to Mentors)
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-4 text-xs text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-primary" aria-hidden />
              <span>Campus AI is reasoning, cross-checking campus directory, and preparing guidance&hellip;</span>
            </div>
          )}
        </div>

        {/* Input Footer */}
        <div className="border-t border-border bg-card p-3 sm:p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendQuery();
            }}
            className="flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask an academic doubt, campus question, or next step..."
              className="h-11 flex-1 rounded-xl border border-input bg-background px-3.5 text-sm outline-none transition-colors focus:border-primary"
            />
            <Button type="submit" size="lg" disabled={!input.trim() || loading} className="px-4">
              {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
              <span className="hidden sm:inline ml-1.5">Ask</span>
            </Button>
          </form>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            {ai.DISCLAIMER}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
