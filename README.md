# Fold — Minimal Bags E-Commerce

A handcrafted bags e-commerce store built with vanilla JavaScript and powered by Cloudflare Pages + Google Sheets.

**Live site:** [fold-eg.com](https://fold-eg.com)

---

## Features

### Storefront
- **Product catalog** — browse backpacks, totes, crossbody bags, clutches, and duffles
- **Search & filter** — by category, price range, and keyword
- **Sorting** — by price or name (ascending/descending)
- **Product details** — image gallery with lightbox, color swatches, size selector, quantity picker
- **Shopping cart** — localStorage-based, slide-out drawer + full cart page
- **Wishlist** — save favorites with a heart toggle
- **Checkout** — name, phone (Egyptian validation), address, city, payment method
- **Payment options** — Cash on Delivery or InstaPay
- **WhatsApp orders** — formatted order summary sent directly to the store's WhatsApp
- **Order confirmation** — dedicated page with order ID and InstaPay details
- **Related products** — same-category suggestions on the product page
- **Contact form** — sends inquiries via WhatsApp
- **FAQ accordion** — expandable questions and answers
- **Responsive design** — mobile-first, works on all screen sizes
- **SEO** — meta tags, Open Graph, Twitter Cards, sitemap.xml, robots.txt

### Admin Panel
- **Dashboard** — total products, orders, pending orders, revenue
- **Product management** — add, edit, delete products
- **Order management** — view order details, update status (pending → confirmed → shipped → delivered → cancelled)
- **Authentication** — JWT-based login with password protection

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | HTML5, CSS3 (custom properties, Grid, Flexbox), Vanilla JS (ES6+) |
| **Backend** | Cloudflare Pages Functions (serverless, Edge Workers) |
| **Database** | Google Sheets API v4 (lightweight CMS) |
| **Auth** | JWT via [jose](https://github.com/panva/jose) library (HS256, 24h expiry) |
| **Password** | SHA-256 hashing (Web Crypto API) |
| **Deployment** | Cloudflare Pages |
| **Dependencies** | 1 npm package — `jose` |

---

## Project Structure

```
├── index.html              # Homepage
├── shop.html               # Product listing with filters
├── product.html            # Product detail (?id=N)
├── cart.html               # Shopping cart
├── checkout.html           # Checkout form
├── confirmation.html       # Order confirmation
├── contact.html            # Contact form
├── about.html              # Brand story
├── faq.html                # FAQ accordion
├── 404.html                # Custom error page
├── script.js               # All frontend logic
├── style.css               # All styles (2100+ lines)
│
├── admin/                  # Admin panel
│   ├── admin.css
│   ├── login.html
│   ├── dashboard.html
│   ├── products.html
│   └── orders.html
│
├── functions/              # Cloudflare Functions (API)
│   ├── _lib/
│   │   ├── auth.js         # JWT + password helpers
│   │   └── sheets.js       # Google Sheets API wrapper
│   └── api/
│       ├── admin/
│       │   ├── login.js
│       │   └── dashboard.js
│       ├── products/
│       │   ├── index.js
│       │   └── [id].js
│       └── orders/
│           ├── index.js
│           └── [id].js
│
├── images/                 # Product images (gitkeep placeholder)
├── package.json            # jose dependency
├── wrangler.toml           # Cloudflare Pages config
├── .env.example            # Environment variable reference
├── sitemap.xml
└── robots.txt
```

---

## API Endpoints

All endpoints are served from the same Cloudflare Pages domain under `/api/`.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/products` | — | List all products |
| `GET` | `/api/products/:id` | — | Get a single product |
| `POST` | `/api/products` | Admin | Add a product |
| `PUT` | `/api/products/:id` | Admin | Update a product |
| `DELETE` | `/api/products/:id` | Admin | Delete a product |
| `POST` | `/api/orders` | — | Create an order (from checkout) |
| `GET` | `/api/orders` | Admin | List all orders |
| `PATCH` | `/api/orders/:id` | Admin | Update order status |
| `POST` | `/api/admin/login` | — | Login, returns JWT token |
| `GET` | `/api/admin/dashboard` | Admin | Dashboard statistics |

---

## Google Sheets Setup

The project uses a Google Sheet with three tabs as its database.

### 1. Products tab

| Column | Field | Example |
|--------|-------|---------|
| A | `id` | `1` |
| B | `name` | Heritage Leather Backpack |
| C | `category` | backpacks |
| D | `price` | 1250 |
| E | `description` | Handcrafted from full-grain leather... |
| F | `image` | `https://example.com/image.jpg` |
| G | `images` | `["url1", "url2", "url3"]` |
| H | `colors` | `[{"name":"Black","hex":"#000"}]` |
| I | `sizes` | `["S","M","L"]` |
| J | `created_at` | ISO timestamp |
| K | `updated_at` | ISO timestamp |

### 2. Orders tab

| Column | Field | Example |
|--------|-------|---------|
| A | `id` | `1` |
| B | `order_id` | `#A3XK9M2Q` |
| C | `customer_name` | Ahmed Ali |
| D | `customer_phone` | 010XXXXXXXX |
| E | `city` | Cairo |
| F | `address` | 12 Street, apt 5 |
| G | `payment_method` | cod / instapay |
| H | `items` | `[{"name":"...","qty":1,...}]` |
| I | `subtotal` | 1250 |
| J | `shipping` | 0 |
| K | `total` | 1250 |
| L | `status` | pending |
| M | `created_at` | ISO timestamp |
| N | `updated_at` | ISO timestamp |

### 3. Admins tab

Not actively used — admin credentials are stored as Cloudflare environment variables instead.

---

## Deployment

### Prerequisites

1. A [Cloudflare](https://dash.cloudflare.com) account
2. A Google Cloud Project with Sheets API enabled and a service account
3. A Google Sheet with the three tabs above

### Steps

1. **Push to GitHub** and connect your repo to Cloudflare Pages
2. **Add environment variables** in the Cloudflare dashboard (Settings → Environment variables):

| Variable | Secret? | Value |
|----------|---------|-------|
| `SHEET_ID` | | Your Google Sheet ID |
| `GOOGLE_CLIENT_EMAIL` | | `fold-admin@your-project.iam.gserviceaccount.com` |
| `GOOGLE_PRIVATE_KEY` | ✅ | The full private key from your service account JSON |
| `JWT_SECRET` | ✅ | A random string for signing admin tokens |
| `ADMIN_USERNAME` | | `MD` (or your desired username) |
| `ADMIN_PASSWORD_HASH` | | SHA-256 hash of your admin password |

3. **Deploy** — Cloudflare will build and deploy automatically

### Generating the password hash

```bash
node -e "const crypto=require('crypto'); console.log(crypto.createHash('sha256').update('your-password').digest('hex'))"
```

### Updating frontend config

Edit the values in `script.js`:

```js
const WHATSAPP_NUMBER = '201027993246';    // Your WhatsApp number
const INSTAPAY_PHONE = '01X XXX XXX XX';   // Your InstaPay account
const INSTAPAY_NAME = 'Your Name Here';    // Your InstaPay name
```

---

## Running Locally

Since the API runs on Cloudflare Functions, local development requires the full Cloudflare Pages environment.

### Option 1: Cloudflare Wrangler

```bash
npm install
npx wrangler pages dev . --binding env
```

### Option 2: Static file server (frontend only)

Open the HTML files directly in a browser or use any static server:

```bash
npx serve .
```

Note: The API endpoints (`/api/*`) will not be available without the Cloudflare Functions runtime.

---

## Architecture

```
Browser ──► Cloudflare Pages ──► Google Sheets API
  │                                       │
  ├── Static assets                  Products tab
  ├── /api/products ◄────────────────► Orders tab
  ├── /api/orders ◄──────────────────► Admins tab
  ├── /api/admin/*
  └── WhatsApp (checkout)
```

- Products are fetched from Google Sheets on every page load
- Orders are simultaneously sent via WhatsApp and stored in Google Sheets
- The admin panel is deployed alongside the storefront, protected by JWT auth
- No traditional database — Google Sheets acts as the data layer
- Zero server management — everything runs on Cloudflare's edge network

---

## License

All rights reserved. This project is proprietary.
