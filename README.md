# Fold — Static E-Commerce (Cash on Delivery)

Minimal bags for the modern journey. A fully static storefront built with **HTML, CSS, and JavaScript only**, deployed on **Cloudflare Pages**, with **Cash on Delivery** as the only payment method.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML + CSS + vanilla JS (no framework, no build step) |
| Product data | Static `data/products.js` |
| Order storage | Cloudflare Pages Function + Cloudflare D1 (SQLite) |
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
├── 404.html              # Custom 404
├── data/
│   └── products.js       # Static catalog of all 47 products
├── images/               # Product images
├── functions/
│   └── api/orders/       # Cloudflare Function → stores orders in D1
├── migrations/
│   └── 0001_orders.sql   # D1 schema for orders
├── style.css             # All styles (light/dark themes)
├── script.js             # All behavior (cart, wishlist, COD, renderers)
├── favicon.svg
├── robots.txt
├── sitemap.xml
└── wrangler.toml         # Cloudflare Pages / D1 config
```

## Running Locally

Since this is a pure static site, just open the pages with any static server:

```bash
# e.g. with python
python -m http.server 8080
# or with npx
npx serve .
```

Then visit `http://localhost:8080`.

> Note: `POST /api/orders` requires the Cloudflare Pages Function + D1 binding to run. Locally this only matters when submitting checkout.

## Payments — Cash on Delivery only

This store does **not** offer online payments. Checkout always uses **Cash on Delivery (COD)**:

1. Customer adds items to cart.
2. At checkout they enter name, Egyptian phone, city, and address.
3. On submit, the order is:
   - Saved server-side to **Cloudflare D1** via `POST /api/orders`.
   - Sent to the seller via **WhatsApp**.
   - The customer is redirected to the confirmation page.
4. Payment happens in cash upon delivery.

## Orders (Cloudflare Pages Function + D1)

Orders are stored in a Cloudflare D1 database using a single Pages Function at `functions/api/orders/index.js`, which connects to the `DB` binding defined in `wrangler.toml`.

### Setup D1

```bash
# 1. Create the D1 database (do once)
wrangler d1 create fold

# 2. Copy the returned database_id into wrangler.toml

# 3. Apply the schema locally / remotely
wrangler d1 execute fold --local --file=./migrations/0001_orders.sql
wrangler d1 execute fold --remote --file=./migrations/0001_orders.sql
```

### API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/orders` | Store a COD order |
| `GET` | `/api/orders` | List recent orders (latest 100) |

## Deployment (Cloudflare Pages)

1. Push the repo to GitHub.
2. In Cloudflare Pages, create a new project and connect the GitHub repo `MahmoudSamerAli/fold-bags`.
3. **Build settings:** No build command, output directory `/` (root). Cloudflare auto-detects the Pages Functions.
4. Bind the D1 database:
   - Settings → Functions → D1 database bindings → add binding named `DB`, select the `fold` database.
5. Deploy. The site will be served statically from the root, and `POST /api/orders` will store orders in D1.

## Adding / Editing Products

Products live in `data/products.js` as a JS array. Add or edit entries there, then commit and push — the storefront updates automatically with no rebuild.

Each product:

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

- Phone: 01099997543
- Email: mahmoud.samer2005@gmail.com
- Location: Cairo, Egypt

## License

Proprietary — All rights reserved.
