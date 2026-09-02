import type { Metadata } from "next";
import AdminNav from "@/app/admin/AdminNav";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin">
      <AdminNav />
      <div className="admin__main">{children}</div>
    </div>
  );
}
