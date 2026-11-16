import { AdminSidebar, AdminTopBar } from "@/components/admin-shell";
import { requireStaff } from "@/lib/auth";
import { getActiveSeason } from "@/lib/data/public";

export const instant = false;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff();
  const season = await getActiveSeason();

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar role={user.role} seasonName={season?.name ?? "CPE Fair 2026"} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopBar crumbs="Admin / Control room" role={user.role} />
        <div className="flex-1 p-6">{children}</div>
      </div>
    </div>
  );
}
