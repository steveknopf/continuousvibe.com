import "server-only";
import { site } from "@/config/offers";
import { LOGO_PNG, SIGN_OFF_PNG, SIGN_OFF_SIZE, WORDMARK_PNG, WORDMARK_SIZE } from "@/lib/email-images";

// The look shared by the emails sent to buyers: a black header with the logo, a white card for the
// message, and a black footer with the white signature, logo and social links.
//
// Gmail on iPhone flips every colour in dark mode, which would turn the black bars white (hiding the white
// signature) and their white text dark. It leaves background images alone, so the bars' black is also
// set as a background image, and their text is wrapped in two blend layers that undo the text flip (only
// in Gmail, which the `u + .body` selector matches). The blend layers flip colours too (red came out
// blue), so anything coloured on a bar is an image, and images stay outside the blend layers.

export const MUTE = "#77756d";

// Mail apps that show emails dark (Apple Mail, Outlook, some phones) darken the card; the rest keep it light.
const DARK_CSS = `
  @media (prefers-color-scheme: dark) {
    .cv-bg { background: #121412 !important; }
    .cv-card { background: #1b1e1b !important; color: #eeece6 !important; }
    .cv-mute { color: #9da39b !important; }
    .cv-line { border-color: #323732 !important; }
  }
  [data-ogsc] .cv-card { color: #eeece6 !important; }
  [data-ogsc] .cv-mute { color: #9da39b !important; }
  u + .body .gmail-screen { background: #000000; mix-blend-mode: screen; }
  u + .body .gmail-difference { background: #000000; mix-blend-mode: difference; }
`;

const BAR = "background:#000000;background-image:linear-gradient(#000000,#000000);";

/** Light text on a black bar that stays light in Gmail's dark mode. */
const barText = (html: string) => `<div class="gmail-screen"><div class="gmail-difference">${html}</div></div>`;

/** The logo and signature, attached to each email for the `cid:` images in `emailLayout`. */
export const layoutImages = [
  { id: "logo", filename: "continuous-vibe-logo.png", base64: LOGO_PNG },
  { id: "wordmark", filename: "continuous-vibe.png", base64: WORDMARK_PNG },
  { id: "sign-off", filename: "steve-knopf.png", base64: SIGN_OFF_PNG },
];

export const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const link = (href: string, label: string) =>
  `<a href="${href}" style="color:#f7e346;text-decoration:underline;">${label}</a>`;

export const socialLinks = () => `${link(site.instagram, "Instagram")} &nbsp;·&nbsp; ${link(site.facebook, "Facebook")}`;

/** A whole email: `body` goes in the card, `footerNote` (html) under the signature in the footer. */
export function emailLayout({ body, footerNote }: { body: string; footerNote: string }) {
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark">
<style>${DARK_CSS}</style></head>
<body class="body cv-bg" style="margin:0;padding:0;background:#f3f1ea;">
<table class="cv-bg" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f1ea;">
<tr><td align="center" style="padding:24px 12px;">
  <table class="cv-card" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;font-family:Helvetica,Arial,sans-serif;color:#1c201c;font-size:15px;line-height:1.5;">
    <tr><td style="${BAR}padding:14px 28px;">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td style="padding-right:14px;"><img src="cid:logo" width="52" height="52" alt="" style="display:block;border:0;"></td>
        <td><img src="cid:wordmark" width="${WORDMARK_SIZE.width}" height="${WORDMARK_SIZE.height}" alt="Continuous Vibe" style="display:block;border:0;"></td>
      </tr></table>
    </td></tr>
    <tr><td style="padding:32px 28px;">
      ${body}
    </td></tr>
    <tr><td style="${BAR}padding:16px 16px 26px 16px;color:#e8e6df;font-size:14px;line-height:1.55;">
      <img src="cid:sign-off" width="${SIGN_OFF_SIZE.width}" height="${SIGN_OFF_SIZE.height}" alt="${site.artist}, ${site.name}" style="display:block;border:0;">
      ${barText(`<p style="margin:14px 12px 0;">${footerNote}</p>`)}
    </td></tr>
  </table>
</td></tr>
</table>
</body></html>`;
}
