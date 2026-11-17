import { CartProvider } from "@/components/store/cart-provider";
import { StoreFooter } from "@/components/store/store-footer";
import { StoreHeader } from "@/components/store/store-header";

export const dynamic = "force-dynamic";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <StoreHeader />
      <main id="main" className="flex-1">{children}</main>
      <StoreFooter />
    </CartProvider>
  );
}
