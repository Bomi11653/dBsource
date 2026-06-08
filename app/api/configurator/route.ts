import { recommendSystem, resolveBomModels } from "@/lib/configurator";
import type { ConfiguratorInput } from "@/data/configurator-templates";
import { getProducts } from "@/lib/cms";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const scene = body.scene as ConfiguratorInput["scene"];
  if (!["livehouse", "stadium", "conference"].includes(scene)) {
    return NextResponse.json({ ok: false, message: "无效场景" }, { status: 400 });
  }

  const input: ConfiguratorInput = {
    scene,
    areaSqm: body.areaSqm ? Number(body.areaSqm) : undefined,
    seats: body.seats ? Number(body.seats) : undefined,
    hasBand: Boolean(body.hasBand),
    needsRecording: Boolean(body.needsRecording),
    budget: body.budget === "premium" ? "premium" : "standard",
  };

  const products = await getProducts();
  const result = recommendSystem(input, products);
  const bom = resolveBomModels(result.lines, products);

  return NextResponse.json({ ok: true, result, bom });
}
