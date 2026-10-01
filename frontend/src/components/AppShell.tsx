import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  Bookmark,
  Compass,
  GraduationCap,
  Home,
  LogOut,
  Menu,
  MessageSquarePlus,
  Search,
  Shield,
  User as UserIcon,
  FileQuestion,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { auth } from "@/services/auth";
import { db } from "@/services/store";
import type { User } from "@/services/types";
import { RoleBadge } from "@/components/RoleBadge";

const navItems = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/ask", label: "Ask Question", icon: MessageSquarePlus },
  { to: "/my-questions", label: "My Questions", icon: FileQuestion },
  { to: "/saved", label: "Saved", icon: Bookmark },
  { to: "/mentors", label: "Mentors", icon: GraduationCap },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/profile", label: "Profile", icon: UserIcon },
] as const;

const mobileNav = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/mentors", label: "Mentors", icon: GraduationCap },
  { to: "/notifications", label: "Alerts", icon: Bell },
] as const;

export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span
        className={cn(
          "grid size-9 place-items-center rounded-xl font-bold",
          inverted ? "bg-navy-foreground text-navy" : "surface-gradient text-navy-foreground",
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

function NavList({ user, onNavigate }: { user: User; onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items: { to: string; label: string; icon: typeof Home }[] = [...navItems];
  if (user.role === "admin" || user.role === "faculty")
    items.push({ to: "/moderation", label: "Moderation", icon: Shield });

  return (
    <nav className="space-y-1" aria-label="Main">
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
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <Icon className="size-4.5" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ user, children }: { user: User; children: ReactNode }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
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

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="size-5" aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-5">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <Logo />
              <div className="mt-6">
                <NavList user={user} onNavigate={() => setOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          <Link to="/dashboard" className="shrink-0">
            <Logo />
          </Link>

          <form onSubmit={submitSearch} className="relative ml-auto hidden max-w-md flex-1 md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search questions, subjects, tags…"
              aria-label="Global search"
              className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary"
            />
          </form>

          <div className="ml-auto flex items-center gap-1 md:ml-0">
            <Button variant="ghost" size="icon" asChild className="md:hidden" aria-label="Search">
              <Link to="/explore" search={{ q: "" }}>
                <Search className="size-5" aria-hidden />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild aria-label="Notifications" className="relative">
              <Link to="/notifications">
                <Bell className="size-5" aria-hidden />
                {unread > 0 && (
                  <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive" aria-hidden />
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

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        <aside className="sticky top-22 hidden h-fit w-60 shrink-0 lg:block">
          <NavList user={user} />
        </aside>
        <main className="min-w-0 flex-1 pb-24 lg:pb-6">{children}</main>
      </div>

      <Link
        to="/ask"
        aria-label="Ask a question"
        className="fixed bottom-20 right-4 z-40 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lift transition-transform hover:scale-105 lg:hidden"
      >
        <Plus className="size-6" aria-hidden />
      </Link>

      <nav
        aria-label="Mobile"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border bg-card/95 backdrop-blur lg:hidden"
      >
        {mobileNav.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to as never}
            search={(to === "/explore" ? { q: "" } : {}) as never}
            className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground transition-colors [&.active]:text-primary"
            activeProps={{ className: "active text-primary" }}
          >
            <Icon className="size-5" aria-hidden />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function PageHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
