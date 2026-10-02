import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Award,
  BookOpen,
  GraduationCap,
  Loader2,
  Lock,
  Shield,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Logo } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
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
  const [department, setDepartment] = useState("Computer Science & Engineering");
  const [year, setYear] = useState("3rd Year");
  const [selectedRole, setSelectedRole] = useState<Role>("student");

  const go = (role: Role) => {
    navigate({ to: role === "admin" ? "/moderation" : "/dashboard" });
  };

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
        const user = await auth.register({
          name,
          email: identifier,
          studentId,
          department,
          year,
          role: selectedRole,
          password,
        });
        go(user.role);
      } else {
        await auth.forgotPassword(identifier);
        setNotice("If that institution email exists in our records, a secure reset link has been dispatched.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setLoading(null);
    }
  };

  const demo = async (role: Role) => {
    setLoading(role);
    try {
      const user = await auth.loginAs(role);
      go(user.role);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* College Left Branding Hero (Colors: Yellow, Blue, Red, Brown, White) */}
      <section className="surface-gradient relative hidden flex-col justify-between p-12 text-white lg:flex border-r border-amber-500/20">
        <div className="flex items-center justify-between">
          <Logo inverted />
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-amber-300 backdrop-blur">
            Smart India Hackathon 2026
          </span>
        </div>

        <div className="max-w-lg my-auto py-8">
          <span className="inline-block rounded-md bg-amber-500/20 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-300 mb-3">
            Ask. Learn. Share. Grow.
          </span>
          <h1 className="text-4xl font-extrabold leading-tight text-white">
            Institution-Exclusive Academic Q&amp;A Portal
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-blue-100 opacity-90">
            Connecting students, verified peer mentors, and faculty across our campus. Instant AI academic guidance,
            human-verified problem solutions, and campus navigation in a safe, structured environment.
          </p>

          <div className="mt-8 space-y-3.5 text-xs">
            <div className="flex items-start gap-3 rounded-xl bg-white/10 p-3 backdrop-blur border border-white/10">
              <ShieldCheck className="size-5 shrink-0 text-amber-300 mt-0.5" />
              <div>
                <strong className="block text-white">Institution-Exclusive Access</strong>
                <span className="text-blue-100">Only verified students, researchers, and faculty can participate.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-white/10 p-3 backdrop-blur border border-white/10">
              <Sparkles className="size-5 shrink-0 text-amber-300 mt-0.5" />
              <div>
                <strong className="block text-white">Multi-Tiered AI Assistance (ANSWER → GUIDE → CONNECT)</strong>
                <span className="text-blue-100">Instant direct help for simple doubts; hints &amp; mentor routing for complex queries.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-white/10 p-3 backdrop-blur border border-white/10">
              <Award className="size-5 shrink-0 text-amber-300 mt-0.5" />
              <div>
                <strong className="block text-white">Official Faculty Verification 🎓</strong>
                <span className="text-blue-100">Faculty verified answers are permanently indexed into the campus repository.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/20 pt-4 flex items-center justify-between text-xs text-blue-200">
          <span>Northfield Institute of Technology</span>
          <span>CAMPUS-Q&amp;A Portal v2.0</span>
        </div>
      </section>

      {/* Right Login / Register / Demo Form */}
      <section className="flex items-center justify-center px-6 py-10 bg-background">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden">
            <Logo />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 px-3 py-1 text-xs font-semibold text-blue-800 dark:text-blue-300">
              <Lock className="size-3.5" aria-hidden /> Institutional Single Sign-On Ready
            </div>
            <h2 className="mt-3 text-2xl font-bold sm:text-3xl text-foreground">
              {mode === "login" ? "Sign In to CAMPUS-Q&A" : mode === "register" ? "Create Campus Account" : "Reset Portal Password"}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {mode === "login"
                ? "Sign in with your institutional email or student ID."
                : mode === "register"
                  ? "Register using your university credentials."
                  : "Enter your registered email to receive a password reset link."}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === "register" && (
              <>
                <Field label="Full Name" value={name} onChange={setName} placeholder="Ananya Iyer" required />
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Student / Faculty ID" value={studentId} onChange={setStudentId} placeholder="CS22B041" required />
                  <label className="block text-xs font-medium">
                    <span className="mb-1 block">Role</span>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as Role)}
                      className="h-10 w-full rounded-xl border border-input bg-card px-2.5 text-xs outline-none focus:border-primary"
                    >
                      <option value="student">Student</option>
                      <option value="mentor">Peer Mentor</option>
                      <option value="faculty">Faculty</option>
                    </select>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Department" value={department} onChange={setDepartment} placeholder="CSE" required />
                  <Field label="Year" value={year} onChange={setYear} placeholder="3rd Year" required />
                </div>
              </>
            )}

            <Field
              label="Institution Email"
              value={identifier}
              onChange={setIdentifier}
              placeholder="ananya.iyer@university.edu"
              type="text"
              required
            />

            {mode !== "forgot" && (
              <Field
                label="Password (Demo: campus2026)"
                value={password}
                onChange={setPassword}
                type="password"
                required
              />
            )}

            {error && (
              <p role="alert" className="rounded-xl bg-red-500/15 p-3 text-xs font-semibold text-red-700 dark:text-red-300">
                {error}
              </p>
            )}
            {notice && (
              <p role="status" className="rounded-xl bg-emerald-500/15 p-3 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                {notice}
              </p>
            )}

            <Button type="submit" className="w-full h-11 text-sm font-semibold" disabled={loading === "form"}>
              {loading === "form" && <Loader2 className="size-4 animate-spin mr-2" />}
              {mode === "login" ? "Sign In" : mode === "register" ? "Register Account" : "Send Reset Link"}
            </Button>
          </form>

          {/* Mode Switchers */}
          <div className="flex items-center justify-between text-xs pt-1">
            <button
              type="button"
              className="font-semibold text-primary hover:underline"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
            >
              {mode === "login" ? "Don't have an account? Register" : "Already registered? Sign In"}
            </button>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground hover:underline"
              onClick={() => setMode(mode === "forgot" ? "login" : "forgot")}
            >
              {mode === "forgot" ? "Back to Login" : "Forgot Password?"}
            </button>
          </div>

          {/* DEMO 1-CLICK ROLE ACCESS FOR HACKATHON JUDGES (Section 2 & 24) */}
          <div className="pt-4 border-t border-border space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                ⚡ 1-Click Demo Logins for Judges:
              </span>
              <span className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold bg-amber-500/15 px-2 py-0.5 rounded-full">
                All 4 Roles
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void demo("student")}
                disabled={Boolean(loading)}
                className="h-14 flex-col text-[11px] font-semibold border-border hover:border-primary hover:bg-primary/5"
              >
                <GraduationCap className="size-4 text-blue-600 mb-1" />
                <span>Student</span>
                <span className="text-[9px] text-muted-foreground font-normal">Ananya (3rd Yr)</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => void demo("mentor")}
                disabled={Boolean(loading)}
                className="h-14 flex-col text-[11px] font-semibold border-border hover:border-amber-500 hover:bg-amber-500/5"
              >
                <Users className="size-4 text-amber-600 mb-1" />
                <span>Peer Mentor</span>
                <span className="text-[9px] text-muted-foreground font-normal">Kabir (Senior)</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => void demo("faculty")}
                disabled={Boolean(loading)}
                className="h-14 flex-col text-[11px] font-semibold border-border hover:border-amber-700 hover:bg-amber-700/5"
              >
                <Award className="size-4 text-amber-700 mb-1" />
                <span>Faculty</span>
                <span className="text-[9px] text-muted-foreground font-normal">Dr. Meera (HOD)</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => void demo("admin")}
                disabled={Boolean(loading)}
                className="h-14 flex-col text-[11px] font-semibold border-border hover:border-red-500 hover:bg-red-500/5"
              >
                <Shield className="size-4 text-red-600 mb-1" />
                <span>Admin</span>
                <span className="text-[9px] text-muted-foreground font-normal">Moderation Desk</span>
              </Button>
            </div>
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
    <label className="block text-xs font-medium">
      <span className="mb-1 block text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-xl border border-input bg-card px-3 text-xs outline-none transition-colors focus:border-primary"
      />
    </label>
  );
}
