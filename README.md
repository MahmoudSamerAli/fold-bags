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

### Admin Panel (local server)
- **Dashboard** — total products, orders, pending orders, revenue
- **Product management** — add, edit, delete products
- **Order management** — view order details, update status (pending → confirmed → shipped → delivered → cancelled)
- **Authentication** — JWT-based login with bcrypt password verification

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | HTML5, CSS3 (custom properties, Grid, Flexbox), Vanilla JS (ES6+) |
| **Storefront API** | Cloudflare Pages Functions (read-only products, order creation) |
| **Admin API** | Express.js server (local, full CRUD + order management) |
| **Database** | Google Sheets API v4 (shared between Cloudflare & local server) |
| **Admin Auth** | JWT + bcrypt (local server) |
| **Deployment** | Cloudflare Pages (storefront) + local `node server/index.js` (admin) |
| **Dependencies** | Cloudflare: `jose` — Server: `express`, `googleapis`, `jsonwebtoken`, `bcryptjs`, `cors`, `dotenv` |

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
├── functions/              # Cloudflare Functions (storefront API)
│   ├── _lib/
│   │   └── sheets.js       # Google Sheets API wrapper
│   └── api/
│       ├── products/
│       │   ├── index.js    # GET /api/products (list)
│       │   └── [id].js     # GET /api/products/:id (single)
│       └── orders/
│           └── index.js    # POST /api/orders (create)
│
├── server/                 # Local admin server
│   ├── index.js            # Express entry point
│   ├── sheets.js           # Google Sheets (service account)
│   ├── auth.js             # JWT + bcrypt helpers
│   ├── .env                # Environment config
│   ├── package.json
│   ├── admin/              # Admin panel pages
│   │   ├── admin.css
│   │   ├── login.html
│   │   ├── dashboard.html
│   │   ├── products.html
│   │   └── orders.html
│   └── routes/
│       ├── admin.js        # POST /api/admin/login, GET /api/admin/dashboard
│       ├── products.js     # CRUD /api/products
│       └── orders.js       # GET + PATCH /api/orders
│
├── images/                 # Product images (gitkeep placeholder)
├── package.json            # jose dependency (Cloudflare)
├── wrangler.toml           # Cloudflare Pages config
├── .env.example            # Environment variable reference
├── sitemap.xml
└── robots.txt
```

---

## API Endpoints

### Cloudflare (storefront — deployed)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/products` | List all products |
| `GET` | `/api/products/:id` | Get a single product |
| `POST` | `/api/orders` | Create an order (from checkout) |

### Local server (admin — `http://localhost:3000`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/admin/login` | — | Login, returns JWT token |
| `GET` | `/api/admin/dashboard` | Admin | Dashboard statistics |
| `POST` | `/api/products` | Admin | Add a product |
| `PUT` | `/api/products/:id` | Admin | Update a product |
| `DELETE` | `/api/products/:id` | Admin | Delete a product |
| `GET` | `/api/orders` | Admin | List all orders |
| `PATCH` | `/api/orders/:id` | Admin | Update order status |

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

Used as a fallback for admin login on the local server. Contains `username` and `password_hash` (bcrypt) columns.

---

## Deployment

### Prerequisites

1. A [Cloudflare](https://dash.cloudflare.com) account
2. A Google Cloud Project with Sheets API enabled and a service account
3. A Google Sheet with the three tabs above
4. Node.js 18+ on your machine

### Cloudflare Deployment (Storefront)

1. **Push to GitHub** and connect your repo to Cloudflare Pages
2. **Add environment variables** in the Cloudflare dashboard (Settings → Environment variables):

| Variable | Secret? | Value |
|----------|---------|-------|
| `SHEET_ID` | | Your Google Sheet ID |
| `GOOGLE_CLIENT_EMAIL` | | `fold-admin@your-project.iam.gserviceaccount.com` |
| `GOOGLE_PRIVATE_KEY` | ✅ | The full private key from your service account JSON |

3. **Deploy** — Cloudflare will build and deploy automatically

### Updating frontend config

Edit the values in `script.js`:

```js
const WHATSAPP_NUMBER = '201027993246';    // Your WhatsApp number
const INSTAPAY_PHONE = '01X XXX XXX XX';   // Your InstaPay account
const INSTAPAY_NAME = 'Your Name Here';    // Your InstaPay name
```

---

## Running Locally

### Storefront (static files)

Open the HTML files directly in a browser or use any static server:

```bash
npx serve .
```

API endpoints (`/api/*`) will use the live Cloudflare Functions on the deployed site. For the admin panel, run the local server.

### Admin Server

```bash
cd server
npm install
node index.js
```

Open `http://localhost:3000/admin/login.html` and sign in with your admin credentials.

---

## Architecture

```
Storefront (Cloudflare Pages)              Admin (Local Server)
  │                                             │
  ├── Static assets (HTML/CSS/JS)               ├── /admin/* (login, dashboard, products, orders)
  ├── /api/products (GET, read-only)            ├── /api/admin/* (login, dashboard)
  ├── /api/products/:id (GET, read-only)        ├── /api/products (CRUD)
  └── /api/orders (POST, create only)           ├── /api/orders (list, update status)
       │                                        │
       └────── Google Sheets API ───────────────┘
                     │
             ├── Products tab
             ├── Orders tab
             └── Admins tab
```

- The storefront is publicly available on Cloudflare Pages — products are read-only, orders can be created
- The admin panel runs locally on your machine — full CRUD, protected by JWT + bcrypt
- Both connect to the same Google Sheet (read-only public key for Cloudflare, service account for the local server)
- Orders from the storefront are simultaneously sent via WhatsApp and stored in Google Sheets
- No traditional database — Google Sheets acts as the data layer

---

## License

All rights reserved. This project is proprietary.
