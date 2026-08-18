"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import type { UserOut } from "@/lib/types";
import { useAuth, useLocale } from "@/components/providers";
import { Button, ErrorBox, Field, Input, Spinner } from "@/components/ui";
import SafeImage from "@/components/SafeImage";

interface TokenOut {
  access_token: string;
  token_type: string;
  user: UserOut;
}

export default function LoginPage() {
  const { dict } = useLocale();
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await api.post<TokenOut>("/auth/login", { email, password }, false);
      login(res.access_token, res.user);
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : dict["common.error"]);
    } finally {
      setBusy(false);
    }
  };

  const isEs = dict["auth.login"] === "Iniciar sesión";

  return (
    <section className="grid min-h-[calc(100vh-3.5rem)] lg:grid-cols-[1fr_1fr]">
      {/* Left: Form */}
      <div className="flex flex-col justify-center px-8 py-16 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-coral-600 dark:text-coral-400">
            {isEs ? "Acceso a la plataforma" : "Platform access"}
          </p>
          <h1 className="font-display mt-3 text-[2.1rem] font-bold leading-tight tracking-tight text-navy-900 dark:text-white">
            {dict["auth.login"]}
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-mut dark:text-gray-400">
            {dict["auth.subtitle"]}
          </p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <ErrorBox message={error} />
            <Field label={dict["auth.email"]}>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder={isEs ? "correo@universidad.edu" : "researcher@university.edu"}
              />
            </Field>
            <Field label={dict["auth.password"]}>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </Field>
            <Button type="submit" disabled={busy} className="w-full text-base">
              {busy ? <Spinner /> : dict["auth.login"]}
            </Button>
          </form>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-sm text-mut dark:text-gray-400">
            <span>{dict["auth.register"]}</span>
            <Link href="/register" className="font-semibold text-reef-700 hover:underline dark:text-reef-300">
              {isEs ? "Crear una cuenta" : "Create an account"}
            </Link>
          </div>

          <div className="mt-10 rounded-[2px] border border-gray-200 bg-paper-dim p-5 text-xs leading-relaxed text-mut dark:border-gray-800 dark:bg-[#0e1726] dark:text-gray-400">
            <strong className="text-ink dark:text-gray-100">Demo accounts:</strong>
            <ul className="mt-2 space-y-1 font-mono text-[11px]">
              <li><span className="text-reef-700 dark:text-reef-300">admin@</span> / Editor123!</li>
              <li><span className="text-reef-700 dark:text-reef-300">editor@</span> / Editor123!</li>
              <li><span className="text-reef-700 dark:text-reef-300">reviewer@</span> / Reviewer123!</li>
              <li><span className="text-reef-700 dark:text-reef-300">author@</span> / Author123!</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Right: Editorial image panel */}
      <div className="relative hidden lg:block">
        <SafeImage
          src="https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1200&q=80"
          alt={isEs ? "Investigación genética y medicina" : "Genetics and medicine research"}
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/60 to-navy-950/20" />
        <div className="absolute inset-0 flex flex-col justify-end p-12">
          <blockquote className="max-w-lg">
            <p className="font-display text-[1.45rem] font-semibold leading-[1.35] text-white">
              &ldquo;{isEs
                ? "La genética de poblaciones admixed del Caribe es una ventana única hacia la medicina de precisión."
                : "Population genetics of admixed Caribbean populations is a unique window into precision medicine."}&rdquo;
            </p>
          </blockquote>
          <div className="mt-6 flex items-center gap-4 border-t border-white/20 pt-6">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-[2px] bg-white/15 font-display text-sm font-bold text-white backdrop-blur">
              GM
            </span>
            <div>
              <p className="font-display text-sm font-semibold text-white">
                Gustavo José Mora-García
              </p>
              <p className="text-[12px] text-ocean-200">
                MD, PhD · Editor-in-Chief
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {["Genetics", "Epidemiology", "Nutrition", "Public Health"].map((tag) => (
              <span key={tag} className="rounded-[2px] border border-white/20 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wider text-white/80">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
