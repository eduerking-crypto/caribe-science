"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ThemeProvider } from "next-themes";
import type { Locale } from "@/lib/dicts";
import { dicts, getInitialLocale } from "@/lib/dicts";
import { clearSession, getUser, setSession } from "@/lib/api";
import type { UserOut } from "@/lib/types";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  dict: Record<string, string>;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: "en",
  setLocale: () => {},
  dict: dicts.en,
});

export const useLocale = () => useContext(LocaleContext);

interface AuthContextValue {
  user: UserOut | null;
  loading: boolean;
  login: (token: string, user: UserOut) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

const EDITOR_ROLES = new Set([
  "editor",
  "section_editor",
  "editor_in_chief",
  "journal_admin",
  "platform_admin",
]);

export function isEditor(user: UserOut | null): boolean {
  return !!user && EDITOR_ROLES.has(user.role);
}

export function Providers({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [user, setUser] = useState<UserOut | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLocaleState(getInitialLocale());
    const cached = getUser() as UserOut | null;
    if (cached) setUser(cached);
    setLoading(false);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      window.localStorage.setItem("caribe_locale", l);
      document.cookie = `caribe_locale=${l}; path=/; max-age=31536000; samesite=lax`;
    } catch {
      /* almacenamiento no disponible */
    }
  }, []);

  const login = useCallback((token: string, u: UserOut) => {
    setSession(token, u);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    window.location.href = "/";
  }, []);

  const auth = useMemo(
    () => ({ user, loading, login, logout }),
    [user, loading, login, logout],
  );
  const localeValue = useMemo(
    () => ({ locale, setLocale, dict: dicts[locale] }),
    [locale, setLocale],
  );

  return (
    <ThemeProvider attribute="data-theme" defaultTheme="light" enableSystem>
      <LocaleContext.Provider value={localeValue}>
        <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
      </LocaleContext.Provider>
    </ThemeProvider>
  );
}