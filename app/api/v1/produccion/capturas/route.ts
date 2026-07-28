import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/demo-db";

export async function POST(request: NextRequest) {
  const payload = await request.json();

  if (payload.kgProcesado < 0 || payload.kgMerma < 0 || payload.minutosParo < 0) {
    return NextResponse.json({ error: "Valores negativos no permitidos" }, { status: 400 });
  }

  if (payload.kgMerma > payload.kgProcesado * 1.2) {
    return NextResponse.json({ error: "Merma fuera de rango permitido" }, { status: 400 });
  }

  const registro = {
    id: db.capturas.length + 1,
    ordenId: Number(payload.ordenId),
    userId: Number(payload.userId),
    areaId: Number(payload.areaId),
    turno: String(payload.turno),
    kgProcesado: Number(payload.kgProcesado),
    kgMerma: Number(payload.kgMerma),
    minutosParo: Number(payload.minutosParo),
    incidencia: payload.incidencia ? String(payload.incidencia) : undefined,
    fechaHora: new Date().toISOString(),
  };

  db.capturas.push(registro);
  return NextResponse.json(registro, { status: 201 });
}

export async function GET(request: NextRequest) {
  const turno = request.nextUrl.searchParams.get("turno");
  const areaIdParam = request.nextUrl.searchParams.get("areaId");
  const areaId = areaIdParam ? Number(areaIdParam) : undefined;

  let data = db.capturas;
  if (turno) {
    data = data.filter((x) => x.turno === turno);
  }
  if (areaId) {
    data = data.filter((x) => x.areaId === areaId);
  }

  const totalProcesado = data.reduce((acc, item) => acc + item.kgProcesado, 0);
  const totalMerma = data.reduce((acc, item) => acc + item.kgMerma, 0);
  const mermaPct = totalProcesado ? (totalMerma / totalProcesado) * 100 : 0;

  return NextResponse.json({
    items: data,
    resumen: {
      registros: data.length,
      kgProcesado: Number(totalProcesado.toFixed(2)),
      kgMerma: Number(totalMerma.toFixed(2)),
      mermaPct: Number(mermaPct.toFixed(2)),
    },
  });
}
