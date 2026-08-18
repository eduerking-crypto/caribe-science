export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const TOKEN_KEY = "caribe_token";
const USER_KEY = "caribe_user";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setSession(token: string, user: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getUser(): unknown | null {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(window.localStorage.getItem(USER_KEY) ?? "null");
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  auth = true,
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const token = getToken();
  if (auth && token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    try {
      const data = await res.json();
      if (data.detail) {
        message =
          typeof data.detail === "string"
            ? data.detail
            : data.detail.map((d: { msg: string }) => d.msg).join("; ");
      } else if (data.error?.message) {
        message = data.error.message;
      }
    } catch {
      /* body vacío */
    }
    if (res.status === 401) clearSession();
    throw new ApiError(res.status, message);
  }
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string, auth = true) => request<T>(path, {}, auth),
  post: <T>(path: string, body: unknown, auth = true) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }, auth),
  patch: <T>(path: string, body: unknown, auth = true) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }, auth),
  put: <T>(path: string, body: unknown, auth = true) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }, auth),
  del: <T>(path: string, auth = true) =>
    request<T>(path, { method: "DELETE" }, auth),
  upload: <T>(path: string, form: FormData, auth = true) =>
    request<T>(path, { method: "POST", body: form }, auth),
};

export const fmtDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";

export const fmtNumber = (n: number | undefined | null) =>
  (n ?? 0).toLocaleString("en-US");

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const fileUrl = (kind: string, filename: string) =>
  `${process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000"}/files/${kind}/${encodeURIComponent(filename)}`;