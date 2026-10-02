import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  CheckSquare,
  Clock,
  FileCheck,
  ListTodo,
  Sparkles,
} from "lucide-react";
import { AppShell, PageHeading } from "@/components/AppShell";
import { CampusAIChatModal } from "@/components/CampusAIChatModal";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/session";
import { tasks as tasksApi } from "@/services/tasks";
import type { CampusTask } from "@/services/types";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "Task & Action Guidance · CAMPUS-Q&A" },
      { name: "description", content: "Structured checklists and step-by-step guidance for submissions, registrations and academic milestones." },
    ],
  }),
  component: TasksPage,
});

function TasksPage() {
  const { user } = useSession();
  const [taskList, setTaskList] = useState<CampusTask[]>([]);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState<string | undefined>();

  const loadTasks = () => void tasksApi.getTasks().then(setTaskList);

  useEffect(() => {
    loadTasks();
  }, []);

  if (!user) return null;

  const toggle = async (taskId: string, stepId: string) => {
    await tasksApi.toggleStep(taskId, stepId);
    loadTasks();
  };

  const askAIStep = (taskTitle: string, stepTitle: string) => {
    setAiPrompt(`What do I need to do for "${stepTitle}" in the task "${taskTitle}"?`);
    setAiModalOpen(true);
  };

  return (
    <AppShell user={user}>
      <PageHeading
        title="Task &amp; Action Guidance"
        subtitle="Never miss an academic milestone. Clear, structured submission roadmaps with AI guidance."
      />

      <div className="space-y-5">
        {taskList.map((task) => {
          const completedCount = task.steps.filter((s) => s.completed).length;
          const percent = Math.round((completedCount / task.steps.length) * 100);

          return (
            <article
              key={task.id}
              className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-card space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-purple-500/15 px-2.5 py-0.5 text-xs font-bold text-purple-800 dark:text-purple-300">
                    {task.category}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                      task.status === "completed"
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                        : task.status === "in_progress"
                          ? "bg-amber-500/15 text-amber-800 dark:text-amber-300"
                          : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {task.status.replace("_", " ")}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="size-3.5" />
                  <span>Due: {new Date(task.deadline).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-bold text-foreground">{task.title}</h2>
                <p className="mt-1 text-xs text-muted-foreground">{task.description}</p>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-muted-foreground">Completion Progress</span>
                  <span className="text-primary">{completedCount} of {task.steps.length} steps ({percent}%)</span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              {/* Steps Checklist (Section 18) */}
              <div className="space-y-2 pt-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Submission Steps &amp; Action Items:
                </p>
                <div className="space-y-2">
                  {task.steps.map((s, idx) => (
                    <div
                      key={s.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border p-3 text-xs transition-colors ${
                        s.completed
                          ? "border-emerald-500/30 bg-emerald-500/5 text-muted-foreground"
                          : "border-border bg-card text-foreground"
                      }`}
                    >
                      <label className="flex items-start gap-3 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          checked={s.completed}
                          onChange={() => void toggle(task.id, s.id)}
                          className="mt-0.5 size-4 rounded border-input text-primary focus:ring-primary"
                        />
                        <div>
                          <span className={`font-semibold ${s.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                            {idx + 1}. {s.title}
                          </span>
                          {s.guidance && (
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              💡 {s.guidance}
                            </p>
                          )}
                        </div>
                      </label>

                      {!s.completed && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => askAIStep(task.title, s.title)}
                          className="h-7 text-xs text-amber-700 dark:text-amber-300 gap-1 self-start sm:self-auto shrink-0 hover:bg-amber-500/10"
                        >
                          <Sparkles className="size-3 text-amber-600" />
                          <span>Ask AI Guidance</span>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <CampusAIChatModal
        open={aiModalOpen}
        onOpenChange={setAiModalOpen}
        initialPrompt={aiPrompt}
      />
    </AppShell>
  );
}
