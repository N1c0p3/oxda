import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/demo-db";

export async function GET(request: NextRequest) {
  const productoIdParam = request.nextUrl.searchParams.get("productoId");
  const productoId = productoIdParam ? Number(productoIdParam) : undefined;

  const data = productoId ? db.movimientos.filter((x) => x.productoId === productoId) : db.movimientos;

  return NextResponse.json({ items: data, total: data.length });
}
