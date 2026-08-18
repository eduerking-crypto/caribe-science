"use client";

import { useState, type FormEvent } from "react";
import { useLocale } from "@/components/providers";

export function EmailAlert() {
  const { dict } = useLocale();
  const [done, setDone] = useState(false);
  const [email, setEmail] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return;
    setDone(true);
  };

  return (
    <div className="rounded-md border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-[#111a22]">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-mut dark:text-gray-500">
        {dict["journal.alert.title"]}
      </p>
      {done ? (
        <p className="mt-3 text-sm font-medium text-ink dark:text-gray-200">
          {dict["journal.alert.done"]}
        </p>
      ) : (
        <>
          <p className="mt-2 text-sm text-mut dark:text-gray-400">
            {dict["journal.alert.body"]}
          </p>
          <form onSubmit={submit} className="mt-3 flex gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={dict["footer.newsletter.placeholder"]}
              aria-label={dict["journal.alert.title"]}
              className="h-9 min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-2.5 text-sm text-ink placeholder:text-gray-400 focus:border-reef-500 focus:outline-none focus:ring-2 focus:ring-reef-400/30 dark:border-gray-700 dark:bg-[#0c131a] dark:text-gray-100"
            />
            <button
              type="submit"
              className="h-9 shrink-0 cursor-pointer rounded-md bg-reef-600 px-3.5 text-sm font-semibold text-white transition-colors hover:bg-reef-700 dark:bg-reef-500 dark:hover:bg-reef-400"
            >
              {dict["journal.alert.subscribe"]}
            </button>
          </form>
        </>
      )}
    </div>
  );
}