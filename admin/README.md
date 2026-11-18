# Bhumi Blend — admin panel

The shop's back office, rebuilt from the WooCommerce admin: **Dashboard, Orders, Products (+ Categories), Customers,
Coupons, Reports, Settings** — styled like WordPress / WooCommerce so it feels familiar. It is a plain React
app (Vite + TypeScript) that talks to the backend in `../backend`; it has no data of its own.

## Run it

1. Start the backend (`cd backend && npm run dev`, listens on port 4000).
2. Make yourself a login, once: `cd backend && npm run admin:create -- --email you@example.com --name "Your Name"`
   (it prints a generated password; or add `--password "…"`, 10+ characters).
3. `cd admin && npm install && npm run dev` → open <http://localhost:3001> and log in.

Settings (optional — the defaults work locally): copy `.env.example` to `.env.local`.

| Variable | Default | What it is |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:4000` | Where the backend is |
| `VITE_STOREFRONT_URL` | `http://localhost:3000` | For "View on site" links, and to show product photos that are still stored as storefront paths |

The backend must allow this site's address: `CLIENT_ORIGINS` in `backend/.env` already lists `http://localhost:3001`.
For production add your real admin address there (e.g. `https://admin.yourshop.com`).

`npm run build` makes a static site in `dist/` — host it anywhere (Netlify, Vercel, S3, Nginx…).
`npm run typecheck` checks the code.

## What you change here shows on the website

Edit a product (name, price, offer price, stock, photos, page content, categories, home-page rows, published/hidden), a category,
or the contact details in Settings, and the website shows it on the next page load — the backend tells the website to refresh
(see "How the website stays in step with the admin" in `backend/README.md`; it needs `STOREFRONT_URL` and `REVALIDATE_SECRET`
in `backend/.env`). A sold-out or hidden product disappears from buying / the shop. Coupons apply at checkout straight away.
Not driven from here: a category's page design and wording (they live in the website's code), and the website's menus.

## What each screen does

| Screen | |
| --- | --- |
| **Dashboard** | This month's sales, then collapsible panels: orders waiting to be processed, and stock running low or out |
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
src/
  main.tsx, App.tsx       routes (everything but /login needs a login)
  lib/                    api (fetch + errors), auth (login state), useApi (loading data), format, csv, types
  components/             Shell (menu + top bar), ui (notices, pagination, sort headers), charts, DateRange
  pages/                  one file per screen
  styles.css              the whole WordPress-style look; chart colours are tokens at the top
```

Charts are drawn by hand (no chart library): a 2px line with a hover crosshair and tooltip that also works with the arrow
keys, ranked bars, and a "View as table" under each chart.
