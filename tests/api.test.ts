import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/server/db";
import { createSessionToken, SESSION_COOKIE } from "@/server/auth";
import { GET as adminOrders } from "@/app/api/admin/orders/route";
import { GET as adminOrder } from "@/app/api/admin/orders/[id]/route";
import { GET as adminInventory } from "@/app/api/admin/inventory/route";
import { POST as login } from "@/app/api/admin/login/route";
import { POST as placeOrder } from "@/app/api/orders/route";
import { POST as quote } from "@/app/api/cart/quote/route";
import { GET as products } from "@/app/api/catalog/products/route";
import { checkout, createAdmin, resetDb, seedMini, stock } from "./helpers";

const req = (url: string, init: RequestInit & { ip?: string } = {}) =>
  new Request(`http://localhost${url}`, {
    ...init,
    headers: { "content-type": "application/json", "x-forwarded-for": init.ip ?? "10.0.0.1", ...(init.headers as object) },
  });

const EMAIL = "unitedpapers@gmail.com";
const PASSWORD = "Correct-Horse-9";
const attempt = (ip: string, email: string, password: string) =>
  login(req("/api/admin/login", { method: "POST", ip, body: JSON.stringify({ email, password }) }));

beforeEach(async () => {
  await resetDb();
  await seedMini();
  await createAdmin(EMAIL, PASSWORD);
});

describe("admin API authorization", () => {
  it("rejects unauthenticated requests to every admin endpoint with 401", async () => {
    const id = "00000000-0000-4000-8000-000000000000";
    const results = await Promise.all([
      adminOrders(req("/api/admin/orders")),
      adminInventory(req("/api/admin/inventory")),
      adminOrder(req(`/api/admin/orders/${id}`), { params: Promise.resolve({ id }) }),
    ]);
    expect(results.map((r) => r.status)).toEqual([401, 401, 401]);
  });

  it("rejects forged, tampered and garbage session cookies", async () => {
    for (const cookie of [`${SESSION_COOKIE}=garbage`, `${SESSION_COOKIE}=aaa.bbb.ccc`, `other=1`]) {
      const res = await adminOrders(req("/api/admin/orders", { headers: { cookie } }));
      expect(res.status).toBe(401);
    }
    const good = await createSessionToken(EMAIL, "ADMIN");
    const tampered = good.slice(0, -4) + (good.endsWith("AAAA") ? "BBBB" : "AAAA");
    expect((await adminOrders(req("/api/admin/orders", { headers: { cookie: `${SESSION_COOKIE}=${tampered}` } }))).status).toBe(401);
  });

  it("allows a validly signed admin session", async () => {
    const token = await createSessionToken(EMAIL, "ADMIN");
    const res = await adminOrders(req("/api/admin/orders", { headers: { cookie: `${SESSION_COOKIE}=${token}` } }));
    expect(res.status).toBe(200);
  });
});

describe("admin login (database users)", () => {
  it("accepts correct credentials, sets an httpOnly cookie and records lastLoginAt", async () => {
    const ok = await attempt("10.1.0.3", EMAIL, PASSWORD);
    expect(ok.status).toBe(200);
    const setCookie = ok.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain(SESSION_COOKIE);
    expect(setCookie.toLowerCase()).toContain("httponly");
    expect((await prisma.adminUser.findUniqueOrThrow({ where: { email: EMAIL } })).lastLoginAt).not.toBeNull();
  });

  it("is case-insensitive on email and case-sensitive on password", async () => {
    expect((await attempt("10.1.1.1", "UnitedPapers@GMAIL.com", PASSWORD)).status).toBe(200);
    expect((await attempt("10.1.1.2", EMAIL, PASSWORD.toLowerCase())).status).toBe(401);
  });

  it("rejects wrong password, unknown email, and returns the same message for both", async () => {
    const wrongPass = await attempt("10.1.0.1", EMAIL, "nope-nope-nope");
    const unknown = await attempt("10.1.0.2", "someone@else.com", PASSWORD);
    expect(wrongPass.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(await wrongPass.json()).toEqual(await unknown.json());
  });

  it("rejects deactivated users and non-portal roles", async () => {
    await createAdmin("off@x.com", PASSWORD, { active: false });
    await createAdmin("staff@x.com", PASSWORD, { role: "STAFF" });
    expect((await attempt("10.1.2.1", "off@x.com", PASSWORD)).status).toBe(401);
    expect((await attempt("10.1.2.2", "staff@x.com", PASSWORD)).status).toBe(401);
  });

  it("never stores the password in plain text", async () => {
    const u = await prisma.adminUser.findUniqueOrThrow({ where: { email: EMAIL } });
    expect(u.passwordHash).not.toContain(PASSWORD);
    expect(u.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it("with no admin users configured nobody can log in", async () => {
    await prisma.adminUser.deleteMany();
    expect((await attempt("10.1.3.1", EMAIL, PASSWORD)).status).toBe(401);
  });

  it("rate-limits repeated login attempts", async () => {
    let last = 0;
    for (let i = 0; i < 10; i++) last = (await attempt("10.9.9.9", EMAIL, "wrong-password")).status;
    expect(last).toBe(429);
  });
});

describe("public API", () => {
  it("GET products loads from the database", async () => {
    const res = await products(req("/api/catalog/products"));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.products).toHaveLength(2);
  });

  it("POST orders validates input and rejects cross-origin posts", async () => {
    const bad = await placeOrder(req("/api/orders", { method: "POST", ip: "10.2.0.1", body: JSON.stringify({ items: [] }) }));
    expect(bad.status).toBe(400);
    const cross = await placeOrder(req("/api/orders", { method: "POST", ip: "10.2.0.2", headers: { origin: "https://evil.example" }, body: JSON.stringify(checkout([{ sku: "UP-CUP-H16", quantity: 1 }])) }));
    expect(cross.status).toBe(403);
  });

  it("POST orders creates (201), replays (200) and rejects oversell (409)", async () => {
    const input = checkout([{ sku: "UP-CUP-H16", quantity: 2 }]);
    const a = await placeOrder(req("/api/orders", { method: "POST", ip: "10.2.1.1", body: JSON.stringify(input) }));
    expect(a.status).toBe(201);
    const first = await a.json();
    expect(first.orderNumber).toMatch(/^UP-\d+$/);
    const b = await placeOrder(req("/api/orders", { method: "POST", ip: "10.2.1.1", body: JSON.stringify(input) }));
    expect(b.status).toBe(200);
    expect((await b.json()).orderId).toBe(first.orderId);
    expect((await stock("UP-CUP-H16")).reserved).toBe(2);

    const tooMuch = await placeOrder(req("/api/orders", { method: "POST", ip: "10.2.1.1", body: JSON.stringify(checkout([{ sku: "UP-CUP-H16", quantity: 50 }])) }));
    expect(tooMuch.status).toBe(409);
    expect((await tooMuch.json()).code).toBe("INSUFFICIENT_STOCK");
    expect(await prisma.salesOrder.count()).toBe(1);
  });

  it("quote prices come from the server", async () => {
    const res = await quote(req("/api/cart/quote", { method: "POST", ip: "10.2.2.1", body: JSON.stringify({ items: [{ sku: "UP-CUP-H16", quantity: 2, unitPrice: 0.01 }] }) }));
    const body = await res.json();
    expect(body.subtotalCents).toBe(6800);
  });

  it("order endpoint is rate limited", async () => {
    let last = 0;
    for (let i = 0; i < 12; i++) {
      last = (await placeOrder(req("/api/orders", { method: "POST", ip: "10.7.7.7", body: JSON.stringify({ items: [] }) }))).status;
    }
    expect(last).toBe(429);
  });
});
