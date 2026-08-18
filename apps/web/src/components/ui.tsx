import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import Link from "next/link";
import { WORKFLOW_STATUS_LABELS } from "@/lib/types";

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "sun";
  size?: "sm" | "md" | "lg";
}

export function Button({ variant = "primary", size = "md", className, ...rest }: BtnProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-[2px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-reef-500 disabled:opacity-50 disabled:pointer-events-none cursor-pointer";
  const sizes = {
    sm: "text-[13px] px-3.5 py-1.5",
    md: "text-sm px-5 py-2",
    lg: "text-[15px] px-6 py-2.5",
  };
  const variants = {
    primary: "bg-reef-600 text-white hover:bg-reef-700 dark:bg-reef-500 dark:text-white dark:hover:bg-reef-400",
    secondary:
      "border border-gray-300 bg-white text-[#33383d] hover:border-navy-700 hover:text-navy-900 dark:border-gray-700 dark:bg-[#121b2b] dark:text-gray-200 dark:hover:border-gray-500 dark:hover:bg-gray-800",
    ghost: "text-reef-700 hover:bg-reef-50 dark:text-reef-300 dark:hover:bg-gray-800",
    danger: "bg-coral-500 text-white hover:bg-coral-600",
    sun: "bg-sun-400 text-[#3c2c0a] hover:bg-sun-500",
  };
  return (
    <button className={cn(base, sizes[size], variants[variant], className)} {...rest} />
  );
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: {
  href: string;
  variant?: BtnProps["variant"];
  size?: BtnProps["size"];
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[2px] font-medium transition-colors",
        size === "sm" && "text-[13px] px-3.5 py-1.5",
        size === "md" && "text-sm px-5 py-2",
        size === "lg" && "text-[15px] px-6 py-2.5",
        variant === "primary" &&
          "bg-reef-600 text-white hover:bg-reef-700 dark:bg-reef-500 dark:text-white dark:hover:bg-reef-400",
        variant === "secondary" &&
          "border border-gray-300 bg-white text-[#33383d] hover:border-navy-700 hover:text-navy-900 dark:border-gray-700 dark:bg-[#121b2b] dark:text-gray-200 dark:hover:border-gray-500 dark:hover:bg-gray-800",
        variant === "sun" && "bg-sun-400 text-[#3c2c0a] hover:bg-sun-500",
        variant === "ghost" &&
          "text-reef-700 hover:bg-reef-50 dark:text-reef-300 dark:hover:bg-gray-800",
        className,
      )}
    >
      {children}
    </Link>
  );
}

type Tone = "ocean" | "reef" | "sun" | "coral" | "neutral" | "sand" | "gray" | "oa";

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: Tone }) {
  const tones: Record<Tone, string> = {
    ocean: "bg-ocean-50 text-ocean-800 dark:bg-ocean-900/60 dark:text-ocean-200",
    reef: "bg-reef-50 text-reef-700 dark:bg-reef-900/50 dark:text-reef-200",
    sun: "bg-sun-100 text-sun-600 dark:bg-sun-400/15 dark:text-sun-300",
    coral: "bg-coral-50 text-coral-600 dark:bg-coral-500/15 dark:text-coral-300",
    neutral: "bg-ocean-50 text-ocean-700 dark:bg-gray-800 dark:text-gray-300",
    sand: "bg-sand-100 text-[#6b5b32] dark:bg-sand-100/10 dark:text-sand-100",
    gray: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
    oa: "border border-coral-400/70 text-coral-600 dark:border-coral-400/50 dark:text-coral-300",
  };
  const oa = tone === "oa" ? "uppercase tracking-[0.12em]" : "";
  return (
    <span className={cn("inline-flex items-center rounded-[2px] px-2 py-0.5 text-[11px] font-semibold leading-4", oa, tones[tone])}>
      {children}
    </span>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-[2px] border border-gray-200 bg-white dark:border-gray-800 dark:bg-[#121b2b]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  kicker,
  title,
  subtitle,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="max-w-3xl">
      {kicker && (
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-coral-600 dark:text-coral-400">
          {kicker}
        </p>
      )}
      <h2 className="font-display mt-1.5 text-[1.7rem] font-semibold leading-tight tracking-tight text-ink dark:text-white">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-2 text-sm text-mut dark:text-gray-400">{subtitle}</p>
      )}
    </div>
  );
}

const inputBase =
  "w-full rounded-[2px] border border-gray-300 bg-white px-3.5 py-2 text-sm text-ink placeholder:text-gray-400 focus:border-reef-600 focus:outline-none focus:ring-2 focus:ring-reef-400/30 dark:border-gray-700 dark:bg-[#0b1322] dark:text-gray-100 dark:placeholder:text-gray-500";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputBase, props.className)} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(inputBase, "min-h-28", props.className)} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(inputBase, "cursor-pointer", props.className)} />;
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-[#3a4046] dark:text-gray-300">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">{hint}</span>}
    </label>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent",
        className,
      )}
      role="status"
      aria-label="Loading"
    />
  );
}

export function ErrorBox({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="rounded-md border border-coral-200 bg-coral-50 px-4 py-3 text-sm text-coral-600 dark:border-coral-500/30 dark:bg-coral-500/10 dark:text-coral-300">
      {message}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone: Tone =
    status === "published"
      ? "reef"
      : status === "rejected"
        ? "coral"
        : status === "accepted" || status === "minor_revision"
          ? "sun"
          : status === "draft"
            ? "gray"
            : "neutral";
  return <Badge tone={tone}>{WORKFLOW_STATUS_LABELS[status] ?? status}</Badge>;
}

export function EmptyState({ title, body, cta }: { title: string; body?: string; cta?: ReactNode }) {
  return (
    <div className="rounded-[2px] border border-dashed border-gray-300 px-6 py-12 text-center dark:border-gray-700">
      <p className="font-display text-lg font-semibold text-ink dark:text-gray-100">{title}</p>
      {body && <p className="mx-auto mt-2 max-w-md text-sm text-mut dark:text-gray-400">{body}</p>}
      {cta && <div className="mt-5 flex justify-center">{cta}</div>}
    </div>
  );
}

export function PageHeader({ kicker, title, subtitle }: { kicker?: string; title: string; subtitle?: string }) {
  return (
    <header className="border-b border-gray-200 bg-paper dark:border-gray-800 dark:bg-[#0b1322]">
      <div className="mx-auto max-w-6xl px-6 py-10">
        {kicker && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-coral-600 dark:text-coral-400">
            {kicker}
          </p>
        )}
        <h1 className="font-display mt-2 text-[2.1rem] font-semibold leading-tight tracking-tight text-ink sm:text-[2.5rem] dark:text-white">
          {title}
        </h1>
        {subtitle && <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-mut dark:text-gray-400">{subtitle}</p>}
      </div>
    </header>
  );
}