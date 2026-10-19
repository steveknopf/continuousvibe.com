import Image from "next/image";
import { SocialLinks } from "@/components/SiteHeader";
import { site } from "@/config/offers";

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-forest px-4 py-16 text-center text-vibe">
      <SocialLinks className="justify-center" />
      <p className="mt-6">Made with LOVE</p>
      <Image src="/assets/cv-logo-trimmed.png" alt="Continuous Vibe" width={48} height={48} className="mx-auto mt-4 size-12" />
      <p className="mt-2 text-sm">
        Questions? <a href={`mailto:${site.email}`} className="underline">{site.email}</a>
      </p>
    </footer>
  );
}
