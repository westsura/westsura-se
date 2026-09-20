import type { Metadata } from "next";
import AdminNav from "./AdminNav";
import { kravAdmin } from "@/lib/admin";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await kravAdmin();
  return (
    <div className="admin">
      <AdminNav roller={admin.roller} />
      <div className="admin__main">{children}</div>
    </div>
  );
}
