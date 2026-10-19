# continuousvibe.com

The Continuous Vibe website: store, portfolio, bio, contact, and the free print sales funnel, all in one
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
| `/` | The free print funnel landing page (was on systeme.io) |
| `/store`, `/store/[slug]` | The store. Each painting page offers 5x7 print, 8x10 print, and the original |
| `/free-print/[slug]` | Funnel size selection: the same product page with the funnel pricing |
| `/checkout` | Checkout form (contact, shipping address, card) for the cart, or one funnel print (`?kind=funnel&slug=...`) |
| `/offer/stickers` | One-click sticker pack upsell, charged to the card from checkout |
| `/thank-you` | Order success with the receipt (updated when the sticker pack was added) |
| `/portfolio`, `/bio`, `/contact`, `/cart` | Same as the old Squarespace pages (Gallery is now Portfolio, grouped by the year folders in `public/assets/paintings/`) |

Checkout flow (store cart and free print funnel): checkout form → sticker pack upsell → thank you with receipt.
The card from checkout is saved so the upsell is one click, and the sticker pack can never be charged twice.

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
2. In Vercel, set `STRIPE_SECRET_KEY` (live key), `SITE_URL=https://www.continuousvibe.com`, and optionally
   `RESEND_API_KEY` for the contact form.
3. Point the `continuousvibe.com` domain at Vercel. Old Squarespace links redirect automatically
   (`src/data/redirects.json`).
# continuousvibe.com
