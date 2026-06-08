import AdminSectionEditor from "@/components/admin/AdminSectionEditor";
import AdminShell from "@/components/admin/AdminShell";
import { ADMIN_SECTIONS } from "@/lib/admin-sections";
import { adminTokenConfigured } from "@/lib/strapi-admin";
import { notFound } from "next/navigation";

type Props = { params: { section: string } };

export default function AdminSectionPage({ params }: Props) {
  const section = ADMIN_SECTIONS.find((s) => s.id === params.section);
  if (!section) notFound();

  const tokenReady = adminTokenConfigured();

  return (
    <AdminShell
      title={`${section.title.zh} · 在线编辑`}
      subtitle="直接修改文字与图片，保存后自动同步到官网"
    >
      <AdminSectionEditor section={section.id} tokenReady={tokenReady} />
    </AdminShell>
  );
}
