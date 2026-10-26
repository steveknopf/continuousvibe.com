"use client";

import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { ContactForm } from "@/app/contact/ContactForm";
import { MailIcon } from "@/components/Icons";

/** Floating mail button in the bottom-right corner that opens the contact form in a pop-up. Hidden on /contact. */
export function MailButton() {
  const pathname = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  // Bumped on every open so the form starts fresh (not on the "Thanks!" screen) each time.
  const [opened, setOpened] = useState(0);

  if (pathname.startsWith("/contact")) return null;

  function open() {
    setOpened((n) => n + 1);
    dialog.current?.showModal();
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-label="Send me a message"
        aria-haspopup="dialog"
        className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1.25rem,env(safe-area-inset-right))] z-40 flex size-14 items-center justify-center rounded-full bg-vibe text-white shadow-[0_0_24px_-4px] shadow-vibe-bright/70 transition hover:scale-105 hover:bg-vibe-bright"
      >
        <MailIcon className="size-7" />
      </button>

      <dialog
        ref={dialog}
        // A click on the dimmed backdrop lands on the dialog itself; clicks on the form land inside it.
        onClick={(e) => e.target === e.currentTarget && dialog.current?.close()}
        aria-labelledby="mail-title"
        className="m-auto max-h-[92dvh] w-[min(40rem,94vw)] overflow-auto border-2 border-line bg-ink p-0 text-cream backdrop:bg-black/80"
      >
        <div className="relative px-5 py-8 sm:px-10">
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            aria-label="Close"
            className="absolute right-3 top-3 flex size-9 items-center justify-center text-2xl leading-none text-mute hover:text-cream"
          >
            ×
          </button>
          <h2 id="mail-title" className="pr-8 text-3xl text-vibe sm:text-4xl">
            Let&apos;s Work Together
          </h2>
          <p className="mt-2 text-mute">Send me a message and I&apos;ll get back to you soon.</p>
          <div className="mt-8">{opened > 0 && <ContactForm key={opened} />}</div>
        </div>
      </dialog>
    </>
  );
}
