import { assertAdminRequest } from "@/lib/admin-auth";
import { adminUploadFile } from "@/lib/strapi-admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const denied = assertAdminRequest(request);
  if (denied) return denied;
  const form = await request.formData();
  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "请选择文件" }, { status: 400 });
  }

  const result = await adminUploadFile(file);
  if (!result.ok) {
    return NextResponse.json(result, { status: 502 });
  }

  return NextResponse.json({ ok: true, ...result.data });
}
