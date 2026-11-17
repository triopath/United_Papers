import { z } from "zod";
import { MAX_CASES_PER_LINE, MAX_LINES_PER_ORDER } from "./pricing";

const sku = z
  .string()
  .trim()
  .min(3)
  .max(40)
  .regex(/^[A-Za-z0-9-]+$/, "Invalid SKU");

export const cartItemSchema = z.object({
  sku,
  quantity: z.number().int().min(1).max(MAX_CASES_PER_LINE),
});

export const cartQuoteSchema = z.object({
  items: z.array(cartItemSchema).min(1).max(MAX_LINES_PER_ORDER),
});

const text = (max: number) => z.string().trim().min(1).max(max);

export const checkoutSchema = z.object({
  idempotencyKey: z.string().uuid(),
  items: z.array(cartItemSchema).min(1).max(MAX_LINES_PER_ORDER),
  deliveryMethod: z.enum(["DELIVERY", "PICKUP"]),
  customer: z.object({
    companyName: text(120),
    contactName: text(80),
    email: z.string().trim().toLowerCase().email().max(120),
    phone: text(30),
    addressLine: text(160),
    city: text(80),
    state: z.string().trim().length(2).toUpperCase(),
    zip: z.string().trim().regex(/^\d{5}$/, "5-digit ZIP"),
  }),
  notes: z.string().trim().max(300).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(120),
  password: z.string().min(1).max(200),
});

export type CartItemInput = z.infer<typeof cartItemSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
