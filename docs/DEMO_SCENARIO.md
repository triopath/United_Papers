# Client Demo Script (~8 minutes)

Say up front: *everything is synthetic; payment, delivery and email are simulated; the order and stock changes are real database transactions.*

1. **Storefront** (`/`): brand, categories, featured products "loaded live from the database". Point out case pricing + per-piece cost, stock badges.
2. **Catalog** → *Paper Cups & Lids*; use search (try `UP-CUP-H16` or `foil`). Open **Hot Paper Cups** → pick 16 oz, show specs and quantity stepper.
3. **Cart**: add 8 cases → prices come from the server; the free-delivery bar flips at $200. Change quantity, remove an item.
4. **Checkout**: pre-filled demo buyer, choose delivery/pickup, **Place demo order** → confirmation with order number (UP-100xx).
5. **Admin** (`/admin`, sign in): dashboard shows the new order, revenue and reserved cases. **Orders → open the order**: line items, price snapshots, reservation *active*.
6. **Inventory**: the SKU's *Reserved* went up and *Available* went down by exactly what was ordered. Low-stock list and statuses (try the out-of-stock gloves `UP-GLV-NM`).
7. **Safety story** (optional live proof): in the storefront try to order more cases than available → rejected with "Only N available". Double-click *Place order* → still one order. Visit `/admin` in a private window → redirected to login; `/api/admin/orders` → 401.
8. Close: what the **full project** adds — supplier POs & receiving, order fulfillment/dispatch, payments & invoicing, customer accounts & price tiers, product management.

Before each demo run `npm run db:reset && npm run db:seed` for a clean state (known numbers: UP-CUP-H08 starts at 180 on hand / 2 reserved).
