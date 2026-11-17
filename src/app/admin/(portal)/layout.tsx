import { AdminSidebar } from "@/components/admin/sidebar";
import { requireAdminPage } from "@/server/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: { default: "Admin", template: "%s · Admin · United Papers" }, robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminPage();
  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      <AdminSidebar email={session.email} />
      <div className="min-w-0 flex-1 bg-slate-50">
        <div className="bg-amber-50 px-4 py-1.5 text-center text-xs font-medium text-amber-700">DEMO ENVIRONMENT — synthetic data only</div>
        <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-8">{children}</div>
      </div>
    </div>
  );
}
