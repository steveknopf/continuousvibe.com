"use client";

import { useState } from "react";

const SERVICES = [
  "Commissioned original painting",
  "Mural",
  "Live painting at your event",
  "Hosting Continuous Vibe and Friends pop up art experience",
  "Licensing",
];

const input = "mt-1 w-full border-2 border-cream/80 bg-forest px-3 py-2";

export function ContactForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    setError("");
    const res = await fetch("/api/contact", { method: "POST", body: new FormData(e.currentTarget) });
    const data = (await res.json()) as { error?: string };
    if (res.ok) {
      setState("sent");
    } else {
      setError(data.error ?? "Something went wrong.");
      setState("idle");
    }
  }

  if (state === "sent") {
    return <p className="py-10 text-center text-xl" role="status">Thanks! I&apos;ll get back to you soon.</p>;
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <fieldset>
        <legend>Name</legend>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            First Name <span className="text-mute">(required)</span>
            <input name="firstName" required autoComplete="given-name" className={input} />
          </label>
          <label className="text-sm">
            Last Name <span className="text-mute">(required)</span>
            <input name="lastName" required autoComplete="family-name" className={input} />
          </label>
        </div>
      </fieldset>
      <label className="block">
        Email <span className="text-mute">(required)</span>
        <input name="email" type="email" required autoComplete="email" className={input} />
      </label>
      <label className="block">
        Phone
        <input name="phone" type="tel" autoComplete="tel" className={input} />
      </label>
      <fieldset>
        <legend>What services are you interested in?</legend>
        <div className="mt-3 space-y-2">
          {SERVICES.map((s) => (
            <label key={s} className="flex items-center gap-3">
              <input type="checkbox" name="services" value={s} className="size-4 accent-vibe-bright" />
              {s}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block">
        Project start date
        <input name="startDate" type="date" className={`${input} w-auto [color-scheme:dark]`} />
      </label>
      <label className="block">
        Project Details <span className="text-mute">(required)</span>
        <textarea name="details" required rows={4} className={input} />
      </label>
      {error && <p className="text-red-400" role="alert">{error}</p>}
      <button
        type="submit"
        disabled={state === "sending"}
        className="bg-vibe px-6 py-3 text-white hover:bg-vibe-bright disabled:opacity-60"
      >
        {state === "sending" ? "Sending…" : "Submit"}
      </button>
    </form>
  );
}
