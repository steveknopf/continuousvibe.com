# continuousvibe.com

The Continuous Vibe website: store, portfolio, bio, contact, and the print pair sales funnel, all in one
Next.js app with Stripe payments.

## Run it locally

```bash
npm install
cp .env.example .env.local   # then add your Stripe test keys
npm run dev                  # http://localhost:3000
```

Use a Stripe **test** key (`sk_test_...`) and the test card `4242 4242 4242 4242` (any future date, any CVC)
to try checkout without real charges.

## How the site is organized

| Page | What it is |
| --- | --- |
| `/` | The funnel landing page (was on systeme.io): buy a Daylight print, get the Blacklight print discounted |
| `/store`, `/store/[slug]` | The store. Each painting page offers 5x7 print, 8x10 print, and the original |
| `/print-pair/[slug]` | Funnel size selection: the same product page selling the Daylight + Blacklight pair |
| `/checkout` | Checkout form (contact, shipping address, card) for the cart, or one funnel print (`?kind=funnel&slug=...`). Saves the card, doesn't charge |
| `/offer/size`, `/offer/version`, `/offer/stickers` | Offers after checkout: 5x7 → 8x10 upgrade, the other Daylight/Blacklight version of a print, then the sticker pack. Only recorded, not charged |
| `/review` | Review page: remove add-ons, then Submit charges the card once for the total |
| `/thank-you` | Order success with the receipt |
| `/portfolio`, `/bio`, `/contact`, `/cart` | Same as the old Squarespace pages (Gallery is now Portfolio, grouped by the year folders in `public/assets/paintings/`) |

Checkout flow (store cart and funnel): checkout form (card saved, not charged) → size offer (only when the order's one
print is a single 5x7: the 8x10 instead) → version offer (skipped when the order already has both versions) → sticker pack offer → review (remove add-ons) → Submit charges the card once →
thank you with receipt.
Preview the pages after checkout without Stripe at `/offer/size?order=preview-5x7` (or `order=preview`, `preview-8x8`, `preview-pair`).

## Changing things

- **Prices, offers, shipping**: `src/config/offers.ts`. Every page and the checkout read from here.
- **Products and paintings**: `src/data/artworks.json` (paintings and prints) and `src/data/products.json`
  (stickers, pins). When an original sells, set its `"available"` to `false`.
- **Photos**: `public/assets/`, sorted into `paintings/`, `stickers/`, `pins/`, `mockups/`, `steve/` (any photo with
  Steve in it goes here only) and `other/` (logos, reviewer photos, graphics). Reference them in the JSON as
  `/assets/...` with their width and height.
- **Page text**: the page files in `src/app/` (e.g. `src/app/page.tsx` for the homepage).

Orders show up in the Stripe Dashboard under Payments with the shipping address. Upsells are separate payments
tagged with the original order.

## Going live

1. Deploy to [Vercel](https://vercel.com) (import this repo; no config needed).
2. In Vercel, set `STRIPE_SECRET_KEY` (live key), `SITE_URL=https://www.continuousvibe.com`, and the email
   settings below.
3. Point the `continuousvibe.com` domain at Vercel. Old Squarespace links redirect automatically
   (`src/data/redirects.json`).

## Email

Contact form messages and order receipts are sent through [Resend](https://resend.com) from the site's own
address. Set:

- `RESEND_API_KEY`: from Resend, after verifying the `continuousvibe.com` domain there.
- `EMAIL_FROM`: the sender, e.g. `Continuous Vibe <steve@continuousvibe.com>`.
- `CONTACT_TO_EMAIL`: where contact messages and a copy of every receipt go.

The receipt goes out once per payment (`src/lib/receipt-email.ts`), and a follow-up asking for a review is
scheduled in Resend for 16 days later (`src/lib/follow-up-email.ts`). Both share `src/lib/email-layout.ts`; the
logo, wordmark and signature images are rebuilt with `design/scripts/email_images.py`. Keep Stripe's own receipts off
(Settings → Customer emails → Successful payments) so buyers don't get two.
# continuousvibe.com
