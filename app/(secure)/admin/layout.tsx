import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { isAdmin } from "@/lib/queries/reports";
import AdminNav from "@/components/admin/admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  if (!(await isAdmin(session.user.id))) notFound();
  return (
    <>
      <AdminNav />
      {children}
    </>
  );
}
