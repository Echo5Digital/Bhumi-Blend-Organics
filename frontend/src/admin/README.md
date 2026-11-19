# Bhumi Blend — admin panel

The shop's back office, rebuilt from the WooCommerce admin: **Dashboard, Orders, Products (+ Categories), Customers,
Coupons, Reports, Settings** — in the shop's white-and-gold look. It talks to the backend in `../../../backend` and has no
data of its own.

It is **part of the storefront**, not a separate app: this folder holds the screens, and `src/app/adminecho5/` serves them
at `/adminecho5` (locally <http://localhost:3000/adminecho5>, in production `https://yourshop.com/adminecho5`). One
`npm run dev` / `npm run build` in `frontend/` covers the shop and the admin together, and a deploy ships both.

## Run it

1. Start the backend (`cd backend && npm run dev`, listens on port 4000).
2. Make yourself a login, once: `cd backend && npm run admin:create -- --email you@example.com --name "Your Name"`
   (it prints a generated password; or add `--password "…"`, 10+ characters).
3. `cd frontend && npm run dev`, open **<http://localhost:3000/adminecho5>** and log in. Changes to the admin's code
   reload instantly.

## How it fits into the storefront

- `src/app/adminecho5/layout.tsx` is a **second root layout** (the shop's is `src/app/(site)/layout.tsx`), so the admin has its
  own `<html>` and its own stylesheet (`styles.css` here). The shop's header and Tailwind styles never reach it, and the
  admin's styles never reach the shop. Going between the two is a normal page load.
- `src/app/adminecho5/[[...slug]]/page.tsx` catches every address under `/adminecho5` and mounts `App.tsx` in the browser
  only (`client.tsx`); the admin's own router (`react-router`, base path `/adminecho5`) then shows the right screen.

## Settings

The admin reads one variable, the same one the storefront uses — set it in `frontend/.env.local` (and in Vercel):

| Variable | Default | What it is |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | Where the backend is (in production, the Render address) |

The backend must allow the address the admin is opened from. That is the shop's own address, so `CLIENT_ORIGINS` in
`backend/.env` covers it (it already has to list the shop for the storefront).

## What you change here shows on the website

Edit a product (name, price, offer price, stock, photos, page content, categories, home-page rows, published/hidden), a category,
or the contact details in Settings, and the website shows it on the next page load — the backend tells the website to refresh
(see "How the website stays in step with the admin" in `backend/README.md`; it needs `STOREFRONT_URL` and `REVALIDATE_SECRET`
in `backend/.env`). A sold-out or hidden product disappears from buying / the shop. Coupons apply at checkout straight away.
Not driven from here: a category's page design and wording (they live in the website's code), and the website's menus.

## What each screen does

| Screen | |
| --- | --- |
| **Dashboard** | Today's sales (against yesterday) with a 14-day sales column chart and this month's figures; orders to process and low stock; the order pipeline by stage; stock watch; the latest orders; and this month's best sellers |
| **Orders** | Status tabs with counts, search (number / name / email), filter by month and by registered customer, sortable table, **bulk status changes**. Click an order: change its status (only legal changes are offered), add tracking, see addresses/items/totals, and a notes timeline (private notes, notes the customer can see, automatic ones) |
| **Products** | Filter by status, stock and category; sort; hide/publish in one click. Edit: price and offer price, SKU, size, **stock count** (paid orders take from it), photos (upload goes to Cloudinary), categories, home-page rows, and the product page content as JSON |
| **Categories** | Add, rename, reorder, hide, delete |
| **Customers** | Registered customers and guests with orders, total spend, average order value, last active and location; CSV download; click a customer for their orders, or to switch their account off |
| **Coupons** | Percentage or fixed, optional cap, minimum spend, start/expiry dates, usage limit; usage counts |
| **Reports** | Sales by date (chart + totals, CSV), by product, by category, coupons, customers, stock — all follow the date range at the top |
| **Settings** | Store name, address and contact details, coupons on/off, low-stock level |

## Not here (yet)

"Add order" (entering an order by hand), taxes, downloads, marketing and extensions — there's nothing behind them in the new shop.
Editing a product's page content is raw JSON for now (a form for the description, ingredients and FAQs would be the next step).

## Code map

```
src/admin/
  App.tsx                 routes (everything but /login needs a login)
  lib/                    api (fetch + errors), auth (login state), useApi (loading data), format, csv, types
  components/             Shell (menu + top bar), ui (notices, pagination, sort headers), charts, DateRange,
                          dashboard (the dashboard's own column chart and meters)
  pages/                  one file per screen
  styles.css              the whole look (white + gold, black text); colours are tokens at the top
src/app/adminecho5/       the route that serves it (layout + catch-all page)
```

Charts are drawn by hand (no chart library): a 2px line with a hover crosshair and tooltip that also works with the arrow
keys, ranked bars, and a "View as table" under each chart.
