"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { site } from "@/config/offers";
import { useCart } from "@/lib/cart";
import { CartIcon, FacebookIcon, InstagramIcon, YouTubeIcon } from "@/components/Icons";

const NAV = [
  { href: "/contact", label: "Contact" },
  { href: "/store", label: "Store" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/neon-parties", label: "Neon Parties" },
  { href: "/bio", label: "Bio" },
];

export function SocialLinks({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <a href={site.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="hover:text-vibe-bright">
        <InstagramIcon />
      </a>
      <a href={site.youtube} target="_blank" rel="noreferrer" aria-label="YouTube" className="hover:text-vibe-bright">
        <YouTubeIcon />
      </a>
      <a href={site.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="hover:text-vibe-bright">
        <FacebookIcon />
      </a>
    </div>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const items = useCart();
  const count = items.reduce((n, i) => n + i.qty, 0);
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-ink/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-3 font-display text-2xl text-vibe sm:text-3xl"
          onClick={() => setOpen(false)}
        >
          <Image src="/assets/cv-logo-trimmed.png" alt="" width={48} height={48} preload className="size-10 sm:size-12" />
          Continuous Vibe
        </Link>

        <nav className="hidden items-center gap-6 text-lg text-vibe md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`underline-offset-8 hover:text-vibe-bright ${pathname.startsWith(n.href) ? "underline" : ""}`}
            >
              {n.label}
            </Link>
          ))}
          <SocialLinks />
        </nav>

        <div className="flex items-center gap-4 text-vibe">
          <Link href="/cart" className="flex items-center gap-1 hover:text-vibe-bright" aria-label={`Cart, ${count} items`}>
            <CartIcon />
            <span className="text-lg tabular-nums">{count}</span>
          </Link>
          <button
            type="button"
            className="md:hidden"
            aria-expanded={open}
            aria-label="Menu"
            onClick={() => setOpen((o) => !o)}
          >
            <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-white/5 px-4 pb-6 md:hidden">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className="block py-3 font-display text-3xl text-vibe"
            >
              {n.label}
            </Link>
          ))}
          <SocialLinks className="mt-4 text-vibe" />
        </nav>
      )}
    </header>
  );
}
