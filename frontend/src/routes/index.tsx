import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { GraduationCap, Loader2, Lock, ShieldCheck, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/AppShell";
import { auth } from "@/services/auth";
import type { Role } from "@/services/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CAMPUS-Q&A — Ask. Learn. Share. Grow." },
      {
        name: "description",
        content:
          "An institution-exclusive student Q&A and collaborative learning portal connecting students, peers, mentors and faculty.",
      },
      { property: "og:title", content: "CAMPUS-Q&A — Ask. Learn. Share. Grow." },
      {
        property: "og:description",
        content: "Institution-exclusive academic Q&A with verified mentors and AI study assistance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

type Mode = "login" | "register" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [identifier, setIdentifier] = useState("ananya.iyer@university.edu");
  const [password, setPassword] = useState("campus2026");
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");

  const go = (role: Role) => navigate({ to: role === "admin" ? "/moderation" : "/dashboard" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading("form");
    try {
      if (mode === "login") {
        const user = await auth.login({ identifier, password });
        go(user.role);
      } else if (mode === "register") {
        const user = await auth.register({ name, email: identifier, studentId, password, role: "student" });
        go(user.role);
      } else {
        await auth.forgotPassword(identifier);
        setNotice("If that institution address exists, a reset link is on its way.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(null);
    }
  };

  const demo = async (role: Role) => {
    setLoading(role);
    const user = await auth.loginAs(role);
    go(user.role);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <section className="surface-gradient relative hidden flex-col justify-between p-12 text-navy-foreground lg:flex">
        <Logo inverted />
        <div className="max-w-md">
          <h1 className="text-4xl font-bold leading-tight">Ask. Learn. Share. Grow.</h1>
          <p className="mt-4 text-sm leading-relaxed opacity-85">
            The academic Q&amp;A portal built for your campus. Get unstuck fast with answers from peers,
            verified mentors and faculty — all inside your institution.
          </p>
          <ul className="mt-8 space-y-4 text-sm">
            <li className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden />
              <span>Exclusive to your institution — verified campus accounts only.</span>
            </li>
            <li className="flex items-start gap-3">
              <Users className="mt-0.5 size-5 shrink-0" aria-hidden />
              <span>Verified mentors and faculty across six core subjects.</span>
            </li>
            <li className="flex items-start gap-3">
              <Sparkles className="mt-0.5 size-5 shrink-0" aria-hidden />
              <span>AI study assistance that guides you instead of handing over answers.</span>
            </li>
          </ul>
        </div>
        <p className="text-xs opacity-70">Northfield Institute of Technology · Student Portal</p>
      </section>

      <section className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden">
            <Logo />
          </div>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Lock className="size-3.5" aria-hidden /> Exclusive to your institution
          </div>

          <h2 className="mt-4 text-3xl font-bold">
            {mode === "login" ? "Welcome back" : mode === "register" ? "Create your account" : "Reset your password"}
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {mode === "forgot"
              ? "Enter your institution email and we'll send a reset link."
              : "Sign in with your institution email or student ID."}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === "register" && (
              <Field label="Full name" value={name} onChange={setName} placeholder="Ananya Iyer" required />
            )}
            <Field
              label={mode === "register" ? "Institution email" : "Institution email or student ID"}
              value={identifier}
              onChange={setIdentifier}
              placeholder="you@university.edu"
              type="email"
              required
            />
            {mode === "register" && (
              <Field label="Student ID" value={studentId} onChange={setStudentId} placeholder="CS22B041" required />
            )}
            {mode !== "forgot" && (
              <Field label="Password" value={password} onChange={setPassword} type="password" required />
            )}

            {error && (
              <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            {notice && (
              <p role="status" className="rounded-lg bg-success/12 px-3 py-2 text-sm text-success">
                {notice}
              </p>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading === "form"}>
              {loading === "form" && <Loader2 className="size-4 animate-spin" aria-hidden />}
              {mode === "login" ? "Login" : mode === "register" ? "Register" : "Send reset link"}
            </Button>
          </form>

          <div className="mt-4 flex items-center justify-between text-sm">
            <button
              type="button"
              className="font-medium text-primary hover:underline"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
            >
              {mode === "login" ? "Create an account" : "Back to login"}
            </button>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground hover:underline"
              onClick={() => setMode("forgot")}
            >
              Forgot password?
            </button>
          </div>

          <div className="my-7 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> Demo access <span className="h-px flex-1 bg-border" />
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            {(["student", "mentor", "admin"] as Role[]).map((role) => (
              <Button key={role} variant="outline" onClick={() => demo(role)} disabled={loading === role}>
                {loading === role ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <GraduationCap className="size-4" aria-hidden />
                )}
                <span className="capitalize">{role}</span>
              </Button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm outline-none transition-colors focus:border-primary"
      />
    </label>
  );
}
