import Image from "next/image";
import { CornerFlames } from "@/components/CornerFlames";
import { SocialLinks } from "@/components/SiteHeader";
import { site } from "@/config/offers";

/** One bar the height of the header: logo and sign-off, contact email, social links. */
export function SiteFooter() {
  return (
    <footer className="relative mt-auto border-t border-white/5 bg-ink text-vibe">
      <CornerFlames />
      <div className="relative mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-4 text-center sm:flex-row sm:px-8 sm:text-left">
        <div className="flex items-center gap-3">
          <Image src="/assets/cv-logo-trimmed.png" alt="Continuous Vibe" width={48} height={48} className="size-10 sm:size-12" />
          <p>Made with LOVE</p>
        </div>
        <p className="text-sm">
          Questions? <a href={`mailto:${site.email}`} className="underline">{site.email}</a>
        </p>
        <SocialLinks />
      </div>
    </footer>
  );
}
