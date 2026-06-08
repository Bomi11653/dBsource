import AdminShell from "@/components/admin/AdminShell";
import AdminLoginForm from "@/components/admin/AdminLoginForm";
import { isAdminAuthEnabled } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "管理登录",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  if (!isAdminAuthEnabled()) {
    redirect(searchParams.next || "/admin");
  }

  return (
    <AdminShell title="管理登录" subtitle="请输入后台访问密码">
      <AdminLoginForm nextPath={searchParams.next || "/admin"} />
    </AdminShell>
  );
}
