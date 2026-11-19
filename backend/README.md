# Bhumi Blend — backend API

Node.js + Express 5 + TypeScript, MongoDB (Mongoose), Cloudinary for photos, Razorpay for payments.
It replaces what WooCommerce did on the old site: products, orders, coupons, payments — plus the
login-protected API the admin panel (part of the storefront, in `../frontend/src/admin`) uses.

Shoppers need an **account** to buy: they register (with an emailed code) or log in, then check out; their orders appear in their account. There is no guest checkout. Admins log in separately.

## Try it right now (no database needed)

```bash
cd backend
npm install
npm run dev:memory
```

Starts a throwaway in-memory MongoDB, loads the 25 products, creates a demo admin
(`admin@bhumiblend.local` / `demo-password-123`) and serves the API on <http://localhost:4000>.
Everything disappears when you stop it. (First run downloads MongoDB, ~1 minute.)

## Real setup

1. `cp .env.example .env` and fill it in (see the table below). `.env` is git-ignored — **never commit it**.
2. `npm run seed` — loads the storefront's products and categories into your database.
   Safe to repeat: it only adds what's missing and never overwrites edits (`-- --reset` wipes products + categories first).
3. `npm run admin:create -- --email you@example.com --name "Your Name"` — makes an admin login
   (prints a generated password once, or pass `--password "..."`, 10+ characters).
4. `npm run dev` (auto-restart) — or `npm run build && npm start` in production.

| Variable | Needed | What it is |
| --- | --- | --- |
| `MONGODB_URI` | yes | MongoDB connection link (Atlas: *Connect → Drivers*). Put the database name in it, e.g. `.../bhumiblend?...` |
| `JWT_SECRET` | yes | 32+ random characters; signs admin logins. `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `CLIENT_ORIGINS` | yes in production | Websites allowed to call the API from a browser (storefront, admin), comma separated |
| `SMTP_HOST` `SMTP_PORT` `SMTP_SECURE` `SMTP_USER` `SMTP_PASS` `MAIL_FROM` | for sign-up codes | Your email provider's SMTP details (`SMTP_HOST` + `MAIL_FROM` are the minimum). Port 587 with `SMTP_SECURE=false`, or 465 with `true`. Without them: development prints the code in the backend console; production answers `503 EMAIL_NOT_CONFIGURED` |
| `ORDER_NOTIFY_EMAILS` | for the "New order" email | Who gets it (comma separated). Only the default: what is saved in the admin under **Settings → Emails → New order** wins. Needs the SMTP settings above to really send |
| `CLOUDINARY_CLOUD_NAME` `_API_KEY` `_API_SECRET` | for uploads | Without them admin uploads answer `503 IMAGES_NOT_CONFIGURED` |
| `RAZORPAY_KEY_ID` `_KEY_SECRET` | for checkout | Without them `POST /api/orders` still places the order, as **pending payment** with `payment: null` (nothing can be paid for yet; stock and coupons are untouched and the admin can only cancel it). Add the keys and new orders get a real Razorpay payment |
| `RAZORPAY_WEBHOOK_SECRET` | recommended | Razorpay dashboard → Webhooks → URL `https://<api>/api/webhooks/razorpay`, events `payment.captured`, `order.paid`, `payment.failed` |
| `STOREFRONT_URL` + `REVALIDATE_SECRET` | recommended | Make admin edits show on the website at once: where the storefront runs (e.g. `http://localhost:3000`) and a shared secret of 16+ characters. The SAME secret goes in `frontend/.env.local` as `REVALIDATE_SECRET`. Without them the site still picks changes up within a minute |
| `PORT`, `TRUST_PROXY`, `JWT_EXPIRES_IN`, `CUSTOMER_JWT_EXPIRES_IN`, `CLOUDINARY_FOLDER` | no | Defaults: 4000, 0, 12h (admin login), 30d (shopper login), `bhumiblend`. Set `TRUST_PROXY=1` behind Render/Railway/Nginx so rate limits see real IPs. |

Check what's connected: `GET /api/health` → `{ status, database, payments, images }`.

## Moving the existing photos to Cloudinary

Product photos currently live in `frontend/public`, and the database stores paths like `/Hair-Oil-Organic.jpg`
(which still work on the storefront). Once the Cloudinary keys are in `.env`:

```bash
npm run images:upload -- --dry-run   # lists the 184 photos; checks they all exist
npm run images:upload                # uploads them, then rewrites every photo address in the database
```

Safe to repeat. After that, new photos come from the admin upload endpoint.

## API

All responses are JSON. Errors always look like `{ "error": { "code", "message", "details?" } }`.
Money is in rupees. Product "cards" have the same shape as the storefront's `Product` type, plus `inStock`.

### Public

| | |
| --- | --- |
| `GET /api/categories` | Categories (`hair`, `face`, `body`, `combo`) |
| `GET /api/products` | `?category=hair` `&collection=best-sellers` `&search=` `&sort=default\|price-asc\|price-desc` `&page=1&limit=50`. Default order = the storefront's order for that category / home row / shop. → `{ items, page, limit, total, pages }` |
| `GET /api/products/:slug` | Card + `sku`, `weight`, `categories`, `details` (the whole product-page content), `related`, `bundle` |
| `POST /api/coupons/validate` | `{ code, items:[{slug,qty}] }` → `{ code, discount, subtotal, total }` or a 400 saying why not |
| `POST /api/orders` | Place an order (below) |
| `GET /api/orders/:number` | The shopper's order. Needs header `X-Order-Token` |
| `POST /api/orders/:number/payment` | Razorpay popup details again (page reloaded) |
| `POST /api/orders/:number/verify-payment` | Confirm a payment (below). The first time an order is marked paid, the shop owner gets the "New order" email and the customer gets the "Order received" email |
| `POST /api/orders/:number/confirm` | "Pay Now" while Razorpay isn't set up: there is nothing to pay, so this is when the order counts as placed and the owner gets the "New order" email and the customer the "Order received" email (each once per order; `409 ORDER_NEEDS_PAYMENT` when Razorpay is set up, `409 ORDER_NOT_CONFIRMABLE` for a cancelled or paid order) |
| `POST /api/orders/:number/cancel` | The "Cancel" button; only before payment |
| `POST /api/webhooks/razorpay` | Called by Razorpay, signature-checked |

### Checkout flow

1. Storefront → `POST /api/orders`
   ```json
   { "items": [{ "slug": "buy-pure-aloe-vera-gel", "qty": 2 }],
     "email": "shopper@example.com",
     "shipping": { "firstName": "", "lastName": "", "line1": "", "line2": "", "city": "", "state": "Kerala", "pin": "682001", "phone": "9876543210" },
     "billingSameAsShipping": true, "billing": { }, "note": "", "couponCode": "" }
   ```
   Prices are **always read from the database**; any price the browser sends is ignored.
   Reply `201`: `{ order, accessToken, payment }`. Keep `accessToken` (it's shown once; only its hash is stored) —
   it's the key to that order. `order.number` is the "Order number" shown on the pay screen (first one: 20001).
2. Open Razorpay Checkout with `payment` (`keyId`, `razorpayOrderId`, `amountPaise`, `currency`, `name`, `prefill`):
   ```js
   new Razorpay({ key: p.keyId, order_id: p.razorpayOrderId, amount: p.amountPaise, currency: p.currency,
     name: p.name, prefill: p.prefill, handler: (r) => verify(r) }).open();
   ```
3. In `handler`, call `POST /api/orders/:number/verify-payment` (header `X-Order-Token`) with
   `{ razorpay_order_id, razorpay_payment_id, razorpay_signature }` → the order comes back `paymentStatus: "paid"`.
4. The webhook does the same job if the shopper closes the tab before step 3. Doing both is safe — an order is marked paid once.

Order states: stored as `paymentStatus` (`pending → paid → refunded`) and `fulfilmentStatus` (`new → processing → shipped → delivered`, or `cancelled`).
The admin and the shopper see ONE WooCommerce-style `status` worked out from the pair: `pending` (not paid), `failed` (not paid, Razorpay reported a
failed attempt), `processing`, `shipped`, `completed`, `cancelled`, `refunded`.

**Stock.** A product with a `stockQuantity` is counted: a paid order takes from it (the product sells out at 0), an order for more than is left is
refused (`INSUFFICIENT_STOCK`), and cancelling or refunding a paid order gives the items back — once. A product without a quantity is just in/out.

**Also public:** `GET /api/settings` → `{ storeName, contactEmail, contactPhone, address }` — the store details from the admin's Settings (the website's footer and Contact Us page use them; blank = the website keeps its own text).

### How the website stays in step with the admin

The website (`frontend/`) no longer has its own product list: it reads products, categories, prices and stock from this API
(`frontend/src/lib/catalog.ts`), cached so pages stay fast. After an admin changes a product, a category or the settings — or an
order is paid / cancelled / refunded, which moves stock — this backend calls the website's `POST /api/revalidate` with the shared
secret (`STOREFRONT_URL` + `REVALIDATE_SECRET` above), naming what changed (`catalog` or `settings`); the next page load shows it.
It never blocks or fails a save: if the website is down or the secret is wrong it just logs a warning, and every cached page
refreshes itself after a minute anyway. Coupons aren't cached — checkout asks `POST /api/coupons/validate` live.

Building the website for production (`next build`) reads the catalogue, so this API must be reachable at that moment.

### Shopper accounts (`/api/account`)

| | |
| --- | --- |
| `POST /api/account/register` | **Step 1.** `{ firstName, lastName, email, password }` (password 8–72 chars) → `202 { status, email, expiresInSeconds: 600, resendAfterSeconds: 30 }` and a 6-digit code is **emailed**. No account exists yet. 409 `EMAIL_TAKEN` if the email already has one |
| `POST /api/account/register/verify` | **Step 2.** `{ email, code }` → `201 { token, customer }` — the account is created, verified and logged in. Errors: `OTP_INVALID` (says how many tries are left), `OTP_EXPIRED`, `OTP_TOO_MANY_ATTEMPTS`, `OTP_NOT_FOUND` (sign-up expired: register again) |
| `POST /api/account/register/resend` | `{ email }` → a fresh code; the old one stops working. 429 `OTP_COOLDOWN` (`details.retryAfterSeconds`) if asked within 30 s; 429 `OTP_SEND_LIMIT` after 5 codes |
| `POST /api/account/login` | `{ email, password }` → `{ token, customer }`. A wrong email and a wrong password give the same 401 |
| `GET /api/account/me` | The logged-in shopper (header `Authorization: Bearer <token>`) |
| `PATCH /api/account/me` | `{ firstName, lastName, email, currentPassword, newPassword }`. Changing the email or password needs `currentPassword` |
| `PUT /api/account/addresses/shipping` and `/billing` | Save an address (same fields as checkout) |
| `GET /api/account/orders`, `GET /api/account/orders/:number` | The shopper's own orders |

**How the code works.** The sign-up is held as a *pending* record (password already hashed, code stored as a keyed hash, never in plain
text) and expires on its own. A code lasts 10 minutes and allows 5 wrong guesses, counted atomically so parallel requests can't get
extra tries; after that the sign-up is thrown away. A code only works for the address it was sent to. The API never returns the code.
Because the account is only created after the code is entered, nobody can register an address they can't read mail for.
(Changing the email later in *Account details* is not re-verified yet.)

`POST /api/orders` **needs the shopper's token** (`Authorization: Bearer …`): with none it answers `401 Please log in.`, with an expired
or switched-off account `401 TOKEN_INVALID`, and no order is created. The order is saved in that shopper's account. (The admin's customer
list and reports still handle orders without an account, for any imported from the old shop; they are not matched to accounts by email.)
Shopper tokens and admin tokens are not interchangeable.

### Admin (all need `Authorization: Bearer <token>` except login)

| | |
| --- | --- |
| `POST /api/admin/auth/login` | `{ email, password }` → `{ token, admin }` |
| `GET /api/admin/auth/me` | |
| `GET/POST /api/admin/products`, `GET/PATCH/DELETE /api/admin/products/:idOrSlug` | List takes `search`, `status=all\|active\|hidden`, `category`, paging. PATCH: a field sent as `null` clears it. Hide a product with `isActive:false` instead of deleting it |
| `GET/POST /api/admin/categories`, `PATCH/DELETE …/:idOrSlug` | |
| `GET/POST /api/admin/coupons`, `PATCH/DELETE …/:idOrCode` | `percent` (≤100, optional `maxDiscount`) or `fixed`; `minSubtotal`, `startsAt`, `expiresAt`, `usageLimit` |
| `GET /api/admin/orders` | `status=all|pending|processing|shipped|completed|cancelled|refunded|failed`, `search` (number, email or name), `from`/`to` (YYYY-MM-DD, Indian days), `customer` (id), `sort=date|total|number&dir`, paging. Also returns `counts` for every status tab |
| `GET/PATCH /api/admin/orders/:number` | PATCH `{ status: processing|shipped|completed|cancelled|refunded, tracking:{carrier,trackingNumber} }`. Illegal changes → 409 `INVALID_STATUS_CHANGE` (unpaid orders can only be cancelled; cancelled/refunded are final). Every change writes a note |
| `POST /api/admin/orders/:number/notes`, `DELETE …/notes/:noteId` | `{ text, customerNote }`; customer notes show on the shopper's order, private ones never do |
| `POST /api/admin/orders/bulk` | `{ numbers:[…], status }` → `{ updated, skipped:[{number,reason}] }` |
| `GET /api/admin/customers`, `GET/PATCH /api/admin/customers/:id` | Registered customers and guests (grouped by email) with orders, total spend, AOV, last active, location; `type`, `search`, `sort`, paging. PATCH `{ isActive }` switches an account off/on. `DELETE …/:id` removes the account for good: the shopper can't log in, but their orders are kept (as orders with no account, i.e. guest orders) → `{ deleted, ordersKept }` |
| `GET /api/admin/reports/sales|products|categories|coupons|customers|stock` | `?from=&to=` (default: this month so far; max one year; ranges over ~3 months group by month). Sales counts paid, uncancelled orders; refunds come off the net figure |
| `GET/PUT /api/admin/settings` | Store address and contact details, coupons on/off, low-stock level |
| `GET /api/admin/emails` | The two order emails and whether each is on: `new-order` (to the shop owner) and `order-received` (to the customer who ordered) |
| `GET/PUT /api/admin/emails/:kind` | `:kind` is `new-order` or `order-received`. `{ enabled, recipients, subject, heading, additionalContent, format }` (`format` = `html` or `plain`; `recipients` only for `new-order`, since the customer's email goes to the address they gave at checkout). `{site_title}`, `{order_number}`, `{order_date}` and `{customer_name}` can be used in the text. Kept apart from the public settings, which never carry the recipients |
| `POST /api/admin/emails/:kind/preview` | The email built from a made-up order, with the settings in the body laid over the saved ones (nothing is saved) → `{ subject, html, text, format }` |
| `POST /api/admin/emails/:kind/test` | `{ to, …optional draft }` sends that made-up email, subject starting `[TEST]` |
| `GET /api/admin/system` | What's connected (database, Razorpay, Cloudinary, SMTP), server info, record counts — never a secret |
| `POST /api/admin/uploads` | multipart, field `file` (JPG/PNG/WebP/GIF/AVIF, ≤5 MB) → `{ url, publicId, width, height }` |
| `DELETE /api/admin/uploads?publicId=` | |
| `GET /api/admin/stats` | Dashboard numbers: orders by state, revenue, product counts |

## Project layout

```
src/
  server.ts            starts everything          app.ts   builds the Express app (tests use this)
  config/              env.ts (validated settings), db.ts
  models/              Product, Category, Coupon, Order, Customer, AdminUser, Counter
  routes/              catalog, orders, account, webhooks, admin/*
  services/            pricing (cart + coupons), orders, payments (Razorpay), images (Cloudinary)
  middleware/          auth (JWT), errors, rateLimit
scripts/               seed, create-admin, upload-images, dev-memory, export-seed
seed/catalogue.json    the storefront's catalogue, exported from frontend/src/data
test/                  205 tests (incl. emails sent through a real in-test SMTP server) on an in-memory MongoDB (no keys or network needed)
```

`npm run seed:export` regenerates `seed/catalogue.json` from `frontend/src/data` — only needed if those
files change before the database becomes the source of truth.

## Commands

`npm run dev` · `dev:memory` · `build` · `start` · `test` · `typecheck` · `seed` · `admin:create` · `images:upload`

On Windows, run `npm test` from PowerShell or cmd (Git Bash's lowercase `c:` path confuses Vitest).

## Not included yet

- Other emails (order confirmation, shipping updates) and SMS/WhatsApp notifications. Only the sign-up code is emailed so far.
- "Forgot password" (the email sending is ready; the reset flow isn't built) and re-verifying a changed email address.
- Reviews, "Add order" (manual orders) in the admin, refunds through Razorpay's API
  (refund in their dashboard, then mark the order refunded here).
- Shipping rates — every order ships free, as on the live site.
- The storefront still reads its own data files; wiring it to this API is the next step.
