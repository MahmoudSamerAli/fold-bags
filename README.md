# Fold — E-Commerce (Cash on Delivery)

Minimal bags for the modern journey. A static storefront built with **HTML, CSS, and JavaScript only**, deployed on **Cloudflare Pages**, with **Cash on Delivery** as the only payment method. Includes a password-protected **admin dashboard** for managing orders, products, and payments.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML + CSS + vanilla JS (no framework, no build step) |
| Product data | Cloudflare D1 (served via `/api/products`), seeded from `data/products.js` |
| Order storage | Cloudflare Pages Function + Cloudflare D1 (SQLite) |
| Admin dashboard | Static `admin.html` + protected `/api/admin/*` Functions |
| Deployment | Cloudflare Pages (static) + GitHub |

## Project Structure

```
fold-bags/
├── index.html            # Home page (hero, featured, categories)
├── shop.html             # Product catalog with filters & search
├── product.html          # Product detail
├── cart.html             # Shopping cart
├── checkout.html         # COD checkout form
├── confirmation.html     # Order confirmation
├── about.html            # About the brand
├── contact.html          # Contact info + form (via WhatsApp)
├── faq.html              # FAQ accordion
├── admin.html            # Admin dashboard (login + orders/products/payments)
├── 404.html              # Custom 404
├── data/
│   └── products.js       # Seed catalog (used to populate D1; offline fallback)
├── images/               # Product images
├── functions/
│   ├── admin.html.js      # /admin.html gate (login form → dashboard)
│   ├── admin/             # /admin gate (login form → dashboard)
│   ├── api/
│   │   ├── products/      # Public: GET active products
│   │   ├── orders/        # Public: POST (place order) + GET (recent)
│   │   ├── admin/         # Protected: login, logout, orders, products
│   │   └── _lib/          # Shared auth + admin gate helpers
│   └── ...
├── migrations/           # D1 schema + seed
├── scripts/              # Tooling (product seed generator)
├── style.css             # Storefront styles (light/dark themes)
├── script.js             # Storefront behavior (cart, wishlist, COD, renderers)
├── admin.css             # Admin dashboard styles
├── admin.js              # Admin dashboard logic
├── favicon.svg
├── robots.txt
├── sitemap.xml
```

## Running Locally

Since the storefront is static, serve it with any static server:

```bash
python -m http.server 8080
```

Then visit `http://localhost:8080`.

> **Note:** The storefront now loads products from `/api/products` (D1-backed) and orders need the Pages Function + D1. The project ships **without a `wrangler.toml`** — the D1 binding (`DB` → `fold`) and the `ADMIN_PASSWORD` secret are configured in the Cloudflare dashboard (see *Deployment*). To test Functions and D1 locally, create a local (git-ignored) `wrangler.toml` with the D1 binding, then run with Wrangler:
>
> ```bash
> # local wrangler.toml (DO NOT commit):
> # name = "fold"
> # compatibility_date = "2026-05-01"
> # [[d1_databases]]
> # binding = "DB"
> # database_name = "fold"
> # database_id = "<database id>"
>
> npx wrangler pages dev . --d1 DB=fold
> ```
>
> Running with a plain `python -m http.server` will fall back to the bundled `data/products.js` catalog, and `POST /api/orders` will fail (expected — no Function runtime).

## Payments — Cash on Delivery only

This store does **not** offer online payments. Checkout always uses **Cash on Delivery (COD)**:

1. Customer adds items to cart.
2. At checkout they enter name, Egyptian phone, city, and address.
3. On submit, the order is:
   - Saved server-side to **Cloudflare D1** via `POST /api/orders`.
   - Sent to the seller via **WhatsApp**.
   - The customer is redirected to the confirmation page.
4. Payment happens in cash upon delivery.

The admin dashboard tracks whether each COD payment has been **collected** per order (`unpaid` / `paid` / `refunded`). This ledger is designed to be extended when online payment methods are added in the future.

## Inventory & stock

- Placing an order **decrements** the relevant products' `stock` server-side and atomically (D1 batch), clamped at `0`.
- Cancelling an order (admin status → `cancelled`) **restores** the corresponding stock.
- The storefront shows a **SOLD OUT** badge (and disables Add to Cart) when `stock` is `0`, and an "Only X left" low-stock note when `stock <= 3`.
- Cart quantities are **clamped to available stock** — the cart `+` button disables at the cap and the backend rejects any quantity above stock.
- The order totals are **recomputed server-side** from product prices — the API does not trust client-supplied subtotal/shipping/total.
- A per-phone **cooldown** on `POST /api/orders` guards against rapid-fire automated submissions.

## Database (Cloudflare D1)

Migrations (run in order):

```bash
wrangler d1 execute fold --remote --file=./migrations/0001_orders.sql      # orders table
wrangler d1 execute fold --remote --file=./migrations/0002_admin.sql       # products + payment_status + sessions
wrangler d1 execute fold --remote --file=./migrations/0003_seed_products.sql # seed 47 products
```

The seed SQL is generated from `data/products.js`:

```bash
node scripts/seed-products-generate.js
```

## API

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/products` | Public | List active products (storefront) |
| `POST` | `/api/orders` | Public | Store a COD order |
| `GET` | `/api/orders` | Public | List recent orders (latest 100) |
| `POST` | `/api/admin/login` | — | Verify password, issue session token + cookie |
| `POST` | `/api/admin/logout` | Bearer/cookie | Invalidate session, clear cookie |
| `GET` | `/api/admin/orders` | Bearer | List orders (paged, filterable) |
| `PATCH` | `/api/admin/orders` | Bearer | Update order `status` / `payment_status` |
| `GET` | `/api/admin/products` | Bearer | List all products |
| `POST` | `/api/admin/products` | Bearer | Create a product |
| `PATCH` | `/api/admin/products/:id` | Bearer | Update a product |
| `DELETE` | `/api/admin/products/:id` | Bearer | Soft-delete a product (hide) |

## Admin Dashboard

Open `/admin.html`, enter the admin password, and manage:

- **Orders** — search/filter, change order status (`pending → confirmed → shipped → delivered → cancelled`) and mark COD payment status.
- **Products** — add/edit/hide products. The product form supports **colors** (name + hex swatches) and **sizes** (comma-separated) in addition to name, brand, category, price, old price, stock, image, and description. Changes reflect on the storefront immediately (no redeploy).
- **Payments** — COD collection ledger, track paid/unpaid/refunded per order.

**Protection:** Open **`/admin`** (or `/admin.html`) to reach the admin area. A Pages Function (`functions/admin.html.js` + `functions/admin/index.js`, sharing `functions/api/_lib/adminGate.js`) serves a **password login form** until a valid admin session exists, and serves the actual dashboard (`admin.html`) only once authenticated. Unauthorized visitors never see any admin data. On successful login the API sets an **HttpOnly, Secure, SameSite=Strict** session cookie (`fold_admin`) and returns a bearer token; the dashboard is served only when that session verifies against D1 (`admin_sessions`). Logging out (`/api/admin/logout`) deletes the server session row and clears the cookie. The `/api/admin/*` endpoints remain individually protected by the bearer token.

### Set the admin password

The password is **not** stored in the repo. Set it as a Cloudflare Pages **secret** (encrypted variable):

1. Cloudflare Pages dashboard → your project → **Settings → Environment variables**.
2. Add **`ADMIN_PASSWORD`** with a strong value.
3. (Optional) Deploy a new version or redeploy to push the secret.
4. Session tokens are short-lived (24h) and stored in D1 (`admin_sessions`).

## Deployment (Cloudflare Pages)

1. Push the repo to GitHub.
2. In Cloudflare Pages, create a project and connect the GitHub repo `MahmoudSamerAli/fold-bags`.
3. **Build settings:** No build command, no build output directory (leave the **Root directory** at the repo root `/`). The repo has **no `wrangler.toml`**, so Cloudflare's v2 root-directory strategy serves the static files and auto-detects the `functions/` directory. Do **not** set `wrangler.toml`'s `pages_build_output_dir` to `/` — an absolute path resolves outside the repository and fails the build.
4. Bind the D1 database:
   - Settings → Functions → D1 database bindings → add binding named `DB`, select the `fold` database.
5. Set the `ADMIN_PASSWORD` secret (see above).
6. Deploy. Run the three migrations (`--remote`) at least once so products and the admin tables exist.

## Adding / Editing Products

Use the **admin dashboard** (recommended) — product edits go straight to D1 and appear on the storefront instantly.

To change the **seed** catalog (e.g. for a wholesale re-seed), edit `data/products.js`, then regenerate and apply the seed migration:

```bash
node scripts/seed-products-generate.js
wrangler d1 execute fold --remote --file=./migrations/0003_seed_products.sql
```

Each seed product:

```js
{
  id: 48,
  name: 'Product Name',
  brand: 'Brand',
  category: 'totes',          // backpacks | totes | crossbody
  price: 1200,                // EGP
  image: 'images/file.jpeg',
  description: '...',
  colors: [{ name: 'Black', hex: '#111111' }],
  sizes: ['OS'],
  stock: 8
}
```

## Contact

- Phone: 0101143370
- Email: mahmoud.samer2005@gmail.com
- Location: Cairo, Egypt

> The phone number is centralized in `script.js` (`CONTACT_PHONE`) and injected into every page footer / the contact page via `<p data-phone>`, keeping the displayed number in sync with the WhatsApp order line (`WHATSAPP_NUMBER`).

## License

Proprietary — All rights reserved.
