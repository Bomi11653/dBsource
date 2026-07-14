import { assertAdminRequest } from "@/lib/admin-auth";
import { refreshLkgForAdminCollection } from "@/lib/cms-cache-refresh";
import { revalidateSiteModules } from "@/lib/revalidate";
import { adminStrapiRequest } from "@/lib/strapi-admin";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type SwapSortOrderBody = {
  productDocumentId?: string;
  targetSortOrder?: number | string;
};

type ProductRecord = {
  documentId?: string;
  id?: number | string;
  sortOrder?: number | null;
  model?: string | null;
  nameZh?: string | null;
  nameEn?: string | null;
};

function toPositiveInteger(value: unknown): number | null {
  const numberValue =
    typeof value === "string" ? Number(value.trim()) : Number(value);
  if (!Number.isInteger(numberValue) || numberValue <= 0) return null;
  return numberValue;
}

function unwrapProduct(payload: unknown): ProductRecord | null {
  if (!payload || typeof payload !== "object") return null;
  const root = payload as { data?: unknown };
  const data = root.data ?? payload;
  if (!data || typeof data !== "object") return null;
  return data as ProductRecord;
}

function unwrapProductList(payload: unknown): ProductRecord[] {
  if (!payload || typeof payload !== "object") return [];
  const root = payload as { data?: unknown };
  const data = root.data ?? payload;
  return Array.isArray(data) ? (data as ProductRecord[]) : [];
}

function productDocId(product: ProductRecord | null | undefined): string {
  if (!product) return "";
  return String(product.documentId ?? product.id ?? "").trim();
}

async function updateProductSortOrder(documentId: string, sortOrder: number) {
  return adminStrapiRequest("PUT", `/products/${documentId}`, {
    data: {
      sortOrder,
      publishedAt: new Date().toISOString(),
    },
  });
}

export async function POST(request: NextRequest) {
  const denied = assertAdminRequest(request);
  if (denied) return denied;

  let body: SwapSortOrderBody = {};
  try {
    body = (await request.json()) as SwapSortOrderBody;
  } catch {
    return NextResponse.json({ ok: false, error: "请求体无效" }, { status: 400 });
  }

  const productDocumentId = body.productDocumentId?.trim();
  const targetSortOrder = toPositiveInteger(body.targetSortOrder);

  if (!productDocumentId) {
    return NextResponse.json(
      { ok: false, error: "缺少 productDocumentId" },
      { status: 400 }
    );
  }

  if (!targetSortOrder) {
    return NextResponse.json(
      { ok: false, error: "排序号必须是正整数" },
      { status: 400 }
    );
  }

  const currentResult = await adminStrapiRequest("GET", `/products/${productDocumentId}`);
  if (!currentResult.ok) {
    return NextResponse.json(
      { ok: false, error: currentResult.error || "未找到当前产品" },
      { status: currentResult.error?.includes("404") ? 404 : 502 }
    );
  }

  const currentProduct = unwrapProduct(currentResult.data);
  if (!currentProduct || !productDocId(currentProduct)) {
    return NextResponse.json({ ok: false, error: "未找到当前产品" }, { status: 404 });
  }

  const currentSortOrder = toPositiveInteger(currentProduct.sortOrder);
  if (!currentSortOrder) {
    return NextResponse.json(
      { ok: false, error: "当前产品排序号无效" },
      { status: 400 }
    );
  }

  if (currentSortOrder === targetSortOrder) {
    return NextResponse.json({
      ok: true,
      changed: false,
      currentProduct,
      swappedProduct: null,
      oldSortOrder: currentSortOrder,
      newSortOrder: targetSortOrder,
      message: "排序未变化",
    });
  }

  const targetListResult = await adminStrapiRequest(
    "GET",
    `/products?filters[sortOrder][$eq]=${encodeURIComponent(String(targetSortOrder))}&pagination[pageSize]=10`
  );

  if (!targetListResult.ok) {
    return NextResponse.json(
      { ok: false, error: targetListResult.error || "查询目标排序号失败" },
      { status: 502 }
    );
  }

  const targetProducts = unwrapProductList(targetListResult.data).filter(
    (item) => productDocId(item) && productDocId(item) !== productDocumentId
  );

  if (targetProducts.length > 1) {
    return NextResponse.json(
      {
        ok: false,
        error: `排序号 ${targetSortOrder} 已被多个产品使用，请先修复重复排序号。`,
        code: "SORT_ORDER_DUPLICATED",
        targetSortOrder,
        duplicatedCount: targetProducts.length,
      },
      { status: 409 }
    );
  }

  const swappedProduct = targetProducts[0] ?? null;
  const swappedDocumentId = productDocId(swappedProduct);

  if (swappedDocumentId) {
    const swapUpdate = await updateProductSortOrder(swappedDocumentId, currentSortOrder);
    if (!swapUpdate.ok) {
      return NextResponse.json(
        { ok: false, error: swapUpdate.error || "交换目标产品排序失败" },
        { status: 502 }
      );
    }
  }

  const currentUpdate = await updateProductSortOrder(productDocumentId, targetSortOrder);
  if (!currentUpdate.ok) {
    // 尽量回滚已交换的对方，避免长期占用同一号
    if (swappedDocumentId) {
      await updateProductSortOrder(swappedDocumentId, targetSortOrder);
    }
    return NextResponse.json(
      { ok: false, error: currentUpdate.error || "更新当前产品排序失败" },
      { status: 502 }
    );
  }

  const { revalidated } = revalidateSiteModules(["products", "home"], {
    detailId: String(currentSortOrder),
  });
  revalidatePath(`/products/${targetSortOrder}`);
  revalidated.push(`/products/${targetSortOrder}`);

  const cacheRefresh = await refreshLkgForAdminCollection("products");

  return NextResponse.json({
    ok: true,
    changed: true,
    oldSortOrder: currentSortOrder,
    newSortOrder: targetSortOrder,
    currentProduct: unwrapProduct(currentUpdate.data) ?? {
      ...currentProduct,
      sortOrder: targetSortOrder,
    },
    swappedProduct: swappedProduct
      ? { ...swappedProduct, sortOrder: currentSortOrder }
      : null,
    revalidated,
    cacheRefresh,
    message: swappedProduct ? "排序已交换" : "排序已更新",
  });
}
