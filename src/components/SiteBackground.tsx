import Image from "next/image";

/** Fixed backdrop behind every page: ghost hot rod flames, with silver broken chains down both sides on top. */
export function SiteBackground() {
  return (
    <>
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-20 bg-[url(/assets/ghost-flames.svg)] bg-cover bg-center" />
      {/* Chains only on wide screens, where they sit in the margins beside the content. */}
      <Image
        src="/assets/chain-silver.webp"
        alt=""
        aria-hidden
        width={308}
        height={1800}
        unoptimized
        className="pointer-events-none fixed left-0 top-0 -z-10 hidden h-dvh w-auto lg:block"
      />
      <Image
        src="/assets/chain-silver.webp"
        alt=""
        aria-hidden
        width={308}
        height={1800}
        unoptimized
        className="pointer-events-none fixed right-0 top-0 -z-10 hidden h-dvh w-auto -scale-x-100 lg:block"
      />
    </>
  );
}
