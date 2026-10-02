import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Compass,
  FileText,
  Mail,
  MapPin,
  Phone,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { AppShell, PageHeading } from "@/components/AppShell";
import { CampusAIChatModal } from "@/components/CampusAIChatModal";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/session";
import { resources as resourcesApi } from "@/services/resources";
import type { CampusResource } from "@/services/types";

export const Route = createFileRoute("/resources")({
  head: () => ({
    meta: [
      { title: "Campus Resource Directory · CAMPUS-Q&A" },
      { name: "description", content: "Searchable directory of campus coordinators, department offices, labs, and guidance centers." },
    ],
  }),
  component: ResourcesPage,
});

function ResourcesPage() {
  const { user } = useSession();
  const [term, setTerm] = useState("");
  const [type, setType] = useState("all");
  const [list, setList] = useState<CampusResource[]>([]);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState<string | undefined>();

  useEffect(() => {
    void resourcesApi.getResources({ search: term, type }).then(setList);
  }, [term, type]);

  if (!user) return null;

  const askAIAbout = (resource: CampusResource) => {
    setAiPrompt(`Where is the ${resource.name} located and what are their procedures?`);
    setAiModalOpen(true);
  };

  const types = [
    { id: "all", label: "All Campus Resources" },
    { id: "coordinator", label: "Project & Academic Coordinators" },
    { id: "office", label: "Department Offices" },
    { id: "library", label: "Central Library" },
    { id: "lab", label: "Labs & GPU Clusters" },
    { id: "placement", label: "Placement & Internships" },
    { id: "student_affairs", label: "Student Welfare" },
  ];

  return (
    <AppShell user={user}>
      <PageHeading
        title="Campus Resource Directory"
        subtitle="Official directory of academic coordinators, department offices, laboratories, and student welfare desks."
      />

      {/* Search and Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search office name, coordinator, building, hall ticket..."
            className="h-11 w-full rounded-xl border border-input bg-card pl-10 pr-3 text-sm outline-none transition-colors focus:border-primary"
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5 border-b border-border pb-3">
        {types.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setType(t.id)}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
              type === t.id
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-secondary text-muted-foreground hover:bg-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Resources Grid */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {list.map((r) => (
          <article
            key={r.id}
            className="rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:border-primary/40 space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="rounded-full bg-sky-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-800 dark:text-sky-300">
                {r.type.replace("_", " ")}
              </span>
              <span className="text-[11px] text-muted-foreground">{r.department}</span>
            </div>

            <h2 className="text-base font-bold text-foreground">{r.name}</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">{r.description}</p>

            <div className="space-y-1 rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground border border-border/50">
              <p className="flex items-center gap-2">
                <MapPin className="size-3.5 text-red-500 shrink-0" />
                <span className="text-foreground font-medium">{r.location}</span>
              </p>
              <p className="flex items-center gap-2">
                <Users className="size-3.5 text-primary shrink-0" />
                <span>POC: {r.contactPerson}</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="size-3.5 text-amber-600 shrink-0" />
                <span>{r.email}</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="size-3.5 text-emerald-600 shrink-0" />
                <span>{r.phone}</span>
              </p>
              <p className="text-[11px] pt-1 border-t border-border/40 font-semibold text-foreground">
                🕒 Hours: {r.workingHours}
              </p>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex flex-wrap gap-1">
                {r.tags.slice(0, 3).map((t) => (
                  <span key={t} className="rounded bg-secondary px-2 py-0.5 text-[10px] text-secondary-foreground">
                    #{t}
                  </span>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => askAIAbout(r)}
                className="h-7 text-xs text-amber-700 dark:text-amber-300 gap-1 hover:bg-amber-500/10"
              >
                <Sparkles className="size-3 text-amber-600" />
                <span>Ask AI Navigation</span>
              </Button>
            </div>
          </article>
        ))}

        {list.length === 0 && (
          <div className="col-span-2 rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            No campus resources match your search.
          </div>
        )}
      </div>

      <CampusAIChatModal
        open={aiModalOpen}
        onOpenChange={setAiModalOpen}
        initialPrompt={aiPrompt}
      />
    </AppShell>
  );
}
