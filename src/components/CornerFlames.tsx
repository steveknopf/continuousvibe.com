import Image from "next/image";

/**
 * Flames rising from the bottom corners of a bar (header and footer). The parent needs `relative`.
 * Two layers per corner: a burst of tall flames out of the corner itself, in front of a strip of smaller
 * flames that stretches toward the content.
 */
export function CornerFlames() {
  return (
    <>
      <Corner side="left" />
      <Corner side="right" />
    </>
  );
}

// Never taller than the header bar, even where the footer stacks onto several lines.
const layer = "pointer-events-none absolute bottom-0 h-full max-h-20";

// On wide screens the strip reaches halfway from the side chain (17.11dvh wide: 308x1800 at full height) to
// the bar's content (2rem inside the centered 80rem column), and never gets shorter than on phones.
const stripWidth = "w-38 lg:w-[max(9.5rem,calc((17.11dvh_+_max(0px,(100vw_-_80rem)/2)_+_2rem)/2))]";

function Corner({ side }: { side: "left" | "right" }) {
  const place = side === "left" ? "left-0" : "right-0 -scale-x-100";
  return (
    <>
      <Image
        src="/assets/corner-flames-strip.svg"
        alt=""
        aria-hidden
        width={380}
        height={80}
        unoptimized
        className={`${layer} ${stripWidth} ${place}`}
      />
      <Image src="/assets/corner-flames.svg" alt="" aria-hidden width={190} height={100} unoptimized className={`${layer} w-auto ${place}`} />
    </>
  );
}
