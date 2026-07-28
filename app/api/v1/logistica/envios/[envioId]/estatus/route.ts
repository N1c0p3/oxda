import { NextRequest, NextResponse } from "next/server";

import { db, type Envio } from "@/lib/demo-db";

export async function PATCH(request: NextRequest, context: { params: Promise<{ envioId: string }> }) {
  const { envioId } = await context.params;
  const payload = await request.json();

  if (!payload.estatus) {
    return NextResponse.json({ error: "estatus es obligatorio" }, { status: 400 });
  }

  const id = Number(envioId);
  const envio = db.envios.find((item) => item.id === id);
  if (!envio) {
    return NextResponse.json({ error: "Envio no encontrado" }, { status: 404 });
  }

  envio.estatus = String(payload.estatus) as Envio["estatus"];
  envio.updatedAt = new Date().toISOString();

  return NextResponse.json(envio);
}
