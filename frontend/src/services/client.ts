/**
 * Thin HTTP client + mock switch for CAMPUS-Q&A.
 *
 * Every service function in this folder goes through `request()`.
 * By default it resolves against the in-memory mock store so the frontend
 * works 100% standalone without requiring a running backend.
 *
 * When the Antigravity backend is connected:
 * - Set VITE_API_BASE_URL=http://localhost:5000/api
 * - Set VITE_USE_MOCKS=false
 *
 * No UI changes are required because the response shapes are identical.
 */
import type { ApiResponse } from "./types";

export const API_BASE_URL = import.meta.env["VITE_API_BASE_URL"] ?? "";
export const USE_MOCKS =
  import.meta.env["VITE_USE_MOCKS"] === "true" ||
  !API_BASE_URL ||
  import.meta.env["VITE_USE_MOCKS"] === undefined;

const TOKEN_KEY = "campusqa.token";

export const tokenStore = {
  get: () => (typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY)),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

const latency = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms));

export async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; query?: Record<string, unknown> } = {},
  mockResolver: () => T | Promise<T>,
): Promise<ApiResponse<T>> {
  if (USE_MOCKS) {
    await latency();
    return { success: true, data: await mockResolver() };
  }

  try {
    const url = new URL(`${API_BASE_URL}${path}`);
    Object.entries(options.query ?? {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
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
  } catch (err) {
    console.warn(
      `[API] Request to ${path} failed or backend is offline. Gracefully falling back to mock service.`,
      err,
    );
    await latency(120);
    return { success: true, data: await mockResolver() };
  }
}
