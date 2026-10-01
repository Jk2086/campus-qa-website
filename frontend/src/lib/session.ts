import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { auth } from "@/services/auth";
import type { User } from "@/services/types";

export function useSession(options: { required?: boolean } = { required: true }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const current = auth.currentUser();
    setUser(current);
    setReady(true);
    if (!current && options.required) navigate({ to: "/" });
  }, [navigate, options.required]);

  return { user, ready };
}

export const roleLabel: Record<User["role"], string> = {
  student: "Student",
  mentor: "Mentor",
  faculty: "Faculty",
  admin: "Admin",
};

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}
