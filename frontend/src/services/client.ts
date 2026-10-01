/**
 * Thin HTTP client + mock switch.
 *
 * Every service function in this folder goes through `request()`. Today it
 * resolves against the in-memory mock store. When the Antigravity backend is
 * ready, set VITE_API_BASE_URL and flip USE_MOCKS to false — no UI changes
 * required, because the response shapes are identical.
 *
 * Secrets never live here: the browser only sends the session token issued by
 * the backend. API keys stay server-side.
 */
import type { ApiResponse } from "./types";

export const API_BASE_URL = import.meta.env["VITE_API_BASE_URL"] ?? "";
export const USE_MOCKS = !API_BASE_URL;

const TOKEN_KEY = "campusqa.token";

export const tokenStore = {
  get: () => (typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY)),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

const latency = (ms = 260) => new Promise((resolve) => setTimeout(resolve, ms));

export async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; query?: Record<string, unknown> },
  mockResolver: () => T | Promise<T>,
): Promise<ApiResponse<T>> {
  if (USE_MOCKS) {
    await latency();
    return { success: true, data: await mockResolver() };
  }

  const url = new URL(`${API_BASE_URL}${path}`);
  Object.entries(options.query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  });

  const token = tokenStore.get();
  const response = await fetch(url.toString(), {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });

  const payload = (await response.json()) as ApiResponse<T>;
  if (!response.ok || payload.success === false) {
    throw new Error(payload.error ?? `Request failed with status ${response.status}`);
  }
  return payload;
}
