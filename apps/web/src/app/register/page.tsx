"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { useLocale } from "@/components/providers";
import { Button, ErrorBox, Field, Input, Spinner } from "@/components/ui";
import SafeImage from "@/components/SafeImage";

interface RegisterOut {
  id: string;
  email: string;
  full_name: string;
  email_verified: boolean;
  message: string;
}

export default function RegisterPage() {
  const { dict } = useLocale();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  const isEs = dict["auth.login"] === "Iniciar sesión";

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (password !== confirm) {
      setError(isEs ? "Las contraseñas no coinciden" : "Passwords do not match");
      return;
    }
    setBusy(true);
    try {
      const res = await api.post<RegisterOut>(
        "/auth/register",
        { email, password, full_name: fullName },
        false,
      );
      setSuccess(
        res.message ||
          (res.email_verified
            ? "Account created. You can now sign in."
            : "Account created. Check your email to verify your address."),
      );
      setTimeout(() => router.push("/login"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : dict["common.error"]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="grid min-h-[calc(100vh-3.5rem)] lg:grid-cols-[1fr_1fr]">
      {/* Left: Editorial image panel */}
      <div className="relative hidden lg:block">
        <SafeImage
          src="https://images.unsplash.com/photo-1576086213369-97a306d36557?w=1200&q=80"
          alt={isEs ? "Investigación científica en genética" : "Scientific genetics research"}
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/60 to-navy-950/20" />
        <div className="absolute inset-0 flex flex-col justify-end p-12">
          <div className="max-w-lg">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-coral-300">
              {isEs ? "Únete a la red" : "Join the network"}
            </p>
            <h2 className="font-display mt-3 text-[1.65rem] font-bold leading-snug text-white">
              {isEs
                ? "Publica en revistas indexadas del Caribe"
                : "Publish in indexed Caribbean journals"}
            </h2>
            <p className="mt-4 text-[14px] leading-relaxed text-ocean-200">
              {isEs
                ? "Acceso abierto, revisión por pares, DOI asignado. Tu investigación alcanza a la comunidad científica internacional."
                : "Open access, peer review, assigned DOI. Your research reaches the international scientific community."}
            </p>
          </div>
          <div className="mt-8 grid grid-cols-3 gap-4 border-t border-white/20 pt-6">
            {[
              { n: "8+", l: isEs ? "Artículos" : "Articles" },
              { n: "50+", l: isEs ? "Investigadores" : "Researchers" },
              { n: "CC BY", l: "License" },
            ].map((s) => (
              <div key={s.l}>
                <p className="font-display text-[1.3rem] font-bold text-white">{s.n}</p>
                <p className="text-[11px] uppercase tracking-wider text-ocean-300">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex flex-col justify-center px-8 py-16 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-coral-600 dark:text-coral-400">
            {isEs ? "Crear cuenta" : "Create account"}
          </p>
          <h1 className="font-display mt-3 text-[2.1rem] font-bold leading-tight tracking-tight text-navy-900 dark:text-white">
            {dict["auth.register"]}
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-mut dark:text-gray-400">
            {isEs
              ? "Envía manuscritos, participa en revisión y construye tu perfil de investigador."
              : "Submit manuscripts, review for the journal and build your researcher profile."}
          </p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <ErrorBox message={error} />
            {success && (
              <div className="rounded-[2px] border border-coral-300 bg-coral-50 px-4 py-3 text-sm text-coral-700 dark:border-coral-500/40 dark:bg-coral-500/10 dark:text-coral-300">
                {success}
              </div>
            )}
            <Field label={isEs ? "Nombre completo" : "Full name"}>
              <Input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                placeholder={isEs ? "Dra. María García López" : "Dr. Jane Smith"}
              />
            </Field>
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
            <Field label={dict["auth.password"]} hint={isEs ? "Mínimo 8 caracteres" : "Minimum 8 characters"}>
              <Input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </Field>
            <Field label={isEs ? "Confirmar contraseña" : "Confirm password"}>
              <Input
                type="password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
              />
            </Field>
            <Button type="submit" disabled={busy} className="w-full text-base">
              {busy ? <Spinner /> : (isEs ? "Crear cuenta" : "Create account")}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-mut dark:text-gray-400">
            {isEs ? "¿Ya tienes cuenta?" : "Already have an account?"}{" "}
            <Link href="/login" className="font-semibold text-reef-700 hover:underline dark:text-reef-300">
              {dict["auth.login"]}
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
