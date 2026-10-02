import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  Bookmark,
  CheckSquare,
  Compass,
  FileQuestion,
  GraduationCap,
  Home,
  LogOut,
  MapPin,
  Menu,
  MessageSquarePlus,
  Plus,
  Search,
  Shield,
  Sparkles,
  User as UserIcon,
} from "lucide-react";
import { CampusAIChatModal } from "@/components/CampusAIChatModal";
import { DemoFlowsBar } from "@/components/DemoFlowsBar";
import { RoleBadge } from "@/components/RoleBadge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { auth } from "@/services/auth";
import { db } from "@/services/store";
import type { User } from "@/services/types";

export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span
        className={cn(
          "grid size-9 place-items-center rounded-xl font-bold border",
          inverted
            ? "bg-white text-blue-900 border-amber-300 shadow-xs"
            : "surface-gradient text-white border-amber-400/40 shadow-xs",
        )}
      >
        Q
      </span>
      <span className="font-display text-lg font-bold tracking-tight">
        CAMPUS<span className="text-primary">-Q&amp;A</span>
      </span>
    </span>
  );
}

function NavList({
  user,
  onNavigate,
  onOpenAI,
}: {
  user: User;
  onNavigate?: () => void;
  onOpenAI?: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const items = [
    { to: "/dashboard", label: "Dashboard", icon: Home },
    { to: "/explore", label: "Search Knowledge", icon: Compass },
    { to: "/ask", label: "Ask a Question", icon: MessageSquarePlus },
    { to: "/tasks", label: "Task Guidance", icon: CheckSquare },
    { to: "/resources", label: "Campus Directory", icon: MapPin },
    { to: "/mentors", label: "Peer Mentors", icon: GraduationCap },
    { to: "/my-questions", label: "My Questions", icon: FileQuestion },
    { to: "/saved", label: "Saved Library", icon: Bookmark },
    { to: "/notifications", label: "Notifications", icon: Bell },
    { to: "/profile", label: "My Profile", icon: UserIcon },
  ];

  if (user.role === "admin" || user.role === "faculty") {
    items.splice(4, 0, { to: "/moderation", label: "Moderation Queue", icon: Shield });
  }

  return (
    <nav className="space-y-1" aria-label="Main Navigation">
      {/* Ask Campus AI Direct Action */}
      <button
        type="button"
        onClick={() => {
          onNavigate?.();
          onOpenAI?.();
        }}
        className="mb-3 flex w-full items-center gap-3 rounded-xl border border-amber-500/35 bg-gradient-to-r from-amber-500/15 via-blue-500/10 to-amber-500/10 px-3 py-2.5 text-sm font-semibold text-amber-900 dark:text-amber-200 transition-all hover:border-amber-500/60 hover:shadow-xs"
      >
        <Sparkles className="size-4.5 text-amber-600 animate-spin-slow shrink-0" aria-hidden />
        <span className="flex-1 text-left">Ask Campus AI</span>
        <span className="rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
          CORE
        </span>
      </button>

      {items.map(({ to, label, icon: Icon }) => {
        const active = pathname === to;
        return (
          <Link
            key={to}
            to={to as never}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary font-semibold"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <Icon className="size-4.5 shrink-0" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ user, children }: { user: User; children: ReactNode }) {
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiInitialPrompt, setAiInitialPrompt] = useState<string | undefined>();
  const [term, setTerm] = useState("");
  const unread = db.notifications.filter((n) => !n.read).length;

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/explore", search: { q: term } });
  };

  const signOut = async () => {
    await auth.logout();
    navigate({ to: "/" });
  };

  const handleOpenAI = (prompt?: string) => {
    setAiInitialPrompt(prompt);
    setAiModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* College Heritage Banner (Theme: Yellow, Blue, Red, Brown, White) */}
      <div className="bg-gradient-to-r from-[#78350f] via-[#1e3a8a] to-[#991b1b] text-white px-4 py-1 text-[11px] font-medium tracking-wide flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <span className="inline-block size-2 rounded-full bg-amber-400" />
          <span className="font-semibold text-amber-200">NORTHFIELD INSTITUTE OF TECHNOLOGY</span>
          <span className="hidden md:inline opacity-75">· Smart India Hackathon 2026</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] opacity-90">
          <span className="bg-white/20 px-2 py-0.5 rounded text-white font-bold">CAMPUS-Q&amp;A</span>
          <span className="hidden sm:inline">Ask · Learn · Share · Grow</span>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
          <Sheet open={openMenu} onOpenChange={setOpenMenu}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="size-5" aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-5">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <Logo />
              <div className="mt-6">
                <NavList
                  user={user}
                  onNavigate={() => setOpenMenu(false)}
                  onOpenAI={() => {
                    setOpenMenu(false);
                    handleOpenAI();
                  }}
                />
              </div>
            </SheetContent>
          </Sheet>

          <Link to="/dashboard" className="shrink-0">
            <Logo />
          </Link>

          <form onSubmit={submitSearch} className="relative ml-auto hidden max-w-md flex-1 md:block">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search doubts, verified answers, resources, topics..."
              aria-label="Global search"
              className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary"
            />
          </form>

          <div className="ml-auto flex items-center gap-1.5 md:ml-0">
            {/* Quick Campus AI Button in Header */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenAI()}
              className="hidden sm:inline-flex border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200 hover:bg-amber-500/20 text-xs font-semibold gap-1.5"
            >
              <Sparkles className="size-3.5 text-amber-600" aria-hidden />
              <span>Campus AI</span>
            </Button>

            <Button variant="ghost" size="icon" asChild className="md:hidden" aria-label="Search">
              <Link to="/explore" search={{ q: "" }}>
                <Search className="size-5" aria-hidden />
              </Link>
            </Button>

            <Button variant="ghost" size="icon" asChild aria-label="Notifications" className="relative">
              <Link to="/notifications">
                <Bell className="size-5" aria-hidden />
                {unread > 0 && (
                  <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-red-600 animate-pulse" aria-hidden />
                )}
              </Link>
            </Button>

            <Link
              to="/profile"
              className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-secondary"
            >
              <span className="grid size-8 place-items-center rounded-full bg-primary/12 text-xs font-bold text-primary">
                {user.avatarInitials}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-xs font-semibold leading-tight">{user.name}</span>
                <RoleBadge role={user.role} className="mt-0.5" />
              </span>
            </Link>

            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out">
              <LogOut className="size-5" aria-hidden />
            </Button>
          </div>
        </div>
      </header>

      {/* Interactive Hackathon Demo Flows Bar */}
      <DemoFlowsBar currentUser={user} onOpenAIChat={handleOpenAI} />

      {/* Main Workspace */}
      <div className="mx-auto flex max-w-7xl flex-1 gap-6 px-4 py-6 w-full">
        <aside className="sticky top-26 hidden h-fit w-60 shrink-0 lg:block">
          <NavList user={user} onOpenAI={() => handleOpenAI()} />
        </aside>
        <main className="min-w-0 flex-1 pb-24 lg:pb-6">{children}</main>
      </div>

      {/* Floating Action Button for Asking Questions */}
      <Link
        to="/ask"
        aria-label="Ask a question"
        className="fixed bottom-20 right-4 z-40 grid size-13 place-items-center rounded-full bg-primary text-primary-foreground shadow-lift transition-transform hover:scale-105 lg:hidden"
      >
        <Plus className="size-6" aria-hidden />
      </Link>

      {/* Floating Ask Campus AI Assistant Widget on Desktop & Mobile */}
      <button
        type="button"
        onClick={() => handleOpenAI()}
        aria-label="Open Campus AI Assistant"
        className="fixed bottom-5 right-5 z-40 hidden sm:flex items-center gap-2 rounded-full border border-amber-500/40 bg-card px-4 py-2.5 text-xs font-bold text-foreground shadow-lift transition-transform hover:scale-105"
      >
        <span className="grid size-6 place-items-center rounded-full bg-amber-500/20 text-amber-600">
          <Sparkles className="size-3.5" aria-hidden />
        </span>
        <span>Ask Campus AI</span>
        <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">Instant</span>
      </button>

      {/* Mobile Bottom Navigation */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-card/95 backdrop-blur lg:hidden"
      >
        <Link
          to="/dashboard"
          className="flex flex-col items-center gap-1 py-2 text-[10px] font-medium text-muted-foreground [&.active]:text-primary"
          activeProps={{ className: "text-primary" }}
        >
          <Home className="size-4.5" />
          <span>Home</span>
        </Link>
        <Link
          to="/explore"
          search={{ q: "" }}
          className="flex flex-col items-center gap-1 py-2 text-[10px] font-medium text-muted-foreground [&.active]:text-primary"
          activeProps={{ className: "text-primary" }}
        >
          <Compass className="size-4.5" />
          <span>Search</span>
        </Link>
        <button
          type="button"
          onClick={() => handleOpenAI()}
          className="flex flex-col items-center gap-1 py-2 text-[10px] font-medium text-amber-700 dark:text-amber-300"
        >
          <Sparkles className="size-4.5 text-amber-600" />
          <span>AI Help</span>
        </button>
        <Link
          to="/tasks"
          className="flex flex-col items-center gap-1 py-2 text-[10px] font-medium text-muted-foreground [&.active]:text-primary"
          activeProps={{ className: "text-primary" }}
        >
          <CheckSquare className="size-4.5" />
          <span>Tasks</span>
        </Link>
        <Link
          to="/notifications"
          className="flex flex-col items-center gap-1 py-2 text-[10px] font-medium text-muted-foreground [&.active]:text-primary relative"
          activeProps={{ className: "text-primary" }}
        >
          <Bell className="size-4.5" />
          {unread > 0 && <span className="absolute top-1.5 right-6 size-1.5 rounded-full bg-red-600" />}
          <span>Alerts</span>
        </Link>
      </nav>

      {/* Campus AI Modal */}
      <CampusAIChatModal
        open={aiModalOpen}
        onOpenChange={setAiModalOpen}
        initialPrompt={aiInitialPrompt}
      />
    </div>
  );
}

export function PageHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h1 className="text-2xl font-bold sm:text-3xl text-foreground">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
