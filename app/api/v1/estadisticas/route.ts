import { NextResponse } from "next/server";
import { db } from "@/lib/demo-db";

export const dynamic = "force-dynamic";

function pct(a: number, b: number) {
  return b > 0 ? Math.round((a / b) * 100) : 0;
}

export async function GET() {
  /* ── PRODUCCIÓN ─────────────────────────────────────────────────── */
  const totalKg     = db.capturas.reduce((s, c) => s + c.kgProcesado, 0);
  const totalMerma  = db.capturas.reduce((s, c) => s + c.kgMerma, 0);
  const totalParos  = db.capturas.reduce((s, c) => s + c.minutosParo, 0);
  const mermaPct    = totalKg > 0 ? +(((totalMerma / totalKg) * 100).toFixed(1)) : 0;
  const eficiencia  = Math.max(0, 100 - mermaPct - +(totalParos / (db.capturas.length || 1) / 4).toFixed(1));

  const porArea: Record<string, { kg: number; merma: number; capturas: number }> = {};
  for (const c of db.capturas) {
    const name = db.AREA_NAMES[c.areaId] ?? `Área ${c.areaId}`;
    if (!porArea[name]) porArea[name] = { kg: 0, merma: 0, capturas: 0 };
    porArea[name].kg      += c.kgProcesado;
    porArea[name].merma   += c.kgMerma;
    porArea[name].capturas += 1;
  }

  const porTurno: Record<string, number> = {};
  for (const c of db.capturas) {
    porTurno[c.turno] = (porTurno[c.turno] ?? 0) + c.kgProcesado;
  }

  const incidencias = db.capturas.filter((c) => c.incidencia).length;

  /* ── INVENTARIOS ─────────────────────────────────────────────────── */
  const movByTipo: Record<string, number> = {};
  let entradas = 0, salidas = 0, transferencias = 0, ajustes = 0;
  for (const m of db.movimientos) {
    movByTipo[m.tipoMovimiento] = (movByTipo[m.tipoMovimiento] ?? 0) + m.cantidad;
    if (m.tipoMovimiento === "entrada")      entradas      += m.cantidad;
    if (m.tipoMovimiento === "salida")       salidas       += m.cantidad;
    if (m.tipoMovimiento === "transferencia")transferencias += m.cantidad;
    if (m.tipoMovimiento === "ajuste")       ajustes       += m.cantidad;
  }
  const stockEstimado = entradas - salidas - ajustes;

  /* ── VENTAS ──────────────────────────────────────────────────────── */
  const ventasTotal  = db.pedidos.reduce((s, p) => s + p.total, 0);
  const ventasPorEst: Record<string, number> = {};
  for (const p of db.pedidos) {
    ventasPorEst[p.estatus] = (ventasPorEst[p.estatus] ?? 0) + 1;
  }
  const ticketPromedio = db.pedidos.length > 0 ? Math.round(ventasTotal / db.pedidos.length) : 0;
  const pedidosActivos = db.pedidos.filter((p) => p.estatus !== "entregado" && p.estatus !== "cancelado").length;
  const ventasEntregadas = db.pedidos.filter((p) => p.estatus === "entregado").reduce((s, p) => s + p.total, 0);

  /* ── LOGÍSTICA ───────────────────────────────────────────────────── */
  const enviosByEst: Record<string, number> = {};
  for (const e of db.envios) {
    enviosByEst[e.estatus] = (enviosByEst[e.estatus] ?? 0) + 1;
  }
  const totalEnvios    = db.envios.length;
  const enviosEntregados = enviosByEst["entregado"] ?? 0;
  const fillRate       = pct(enviosEntregados, totalEnvios);
  const enRuta         = enviosByEst["en_ruta"] ?? 0;
  const programados    = enviosByEst["programado"] ?? 0;

  /* ── CRM ─────────────────────────────────────────────────────────── */
  const crmByEtapa: Record<string, { count: number; monto: number }> = {};
  for (const o of db.oportunidades) {
    if (!crmByEtapa[o.etapa]) crmByEtapa[o.etapa] = { count: 0, monto: 0 };
    crmByEtapa[o.etapa].count += 1;
    crmByEtapa[o.etapa].monto += o.montoEstimado;
  }
  const pipelineTotal   = db.oportunidades.reduce((s, o) => s + o.montoEstimado, 0);
  const pipelinePonderado = db.oportunidades.reduce((s, o) => s + o.montoEstimado * (o.probabilidad / 100), 0);
  const ganadas         = db.oportunidades.filter((o) => o.etapa === "ganado").length;
  const perdidas        = db.oportunidades.filter((o) => o.etapa === "perdido").length;
  const cerradas        = ganadas + perdidas;
  const tasaConversion  = pct(ganadas, cerradas);

  return NextResponse.json({
    produccion: {
      totalKg, totalMerma, mermaPct, totalParos, eficiencia: +eficiencia.toFixed(1),
      capturas: db.capturas.length, incidencias, porArea, porTurno,
    },
    inventarios: {
      totalMovimientos: db.movimientos.length,
      entradas, salidas, transferencias, ajustes, stockEstimado, movByTipo,
    },
    ventas: {
      totalPedidos: db.pedidos.length, ventasTotal, ventasEntregadas,
      ticketPromedio, pedidosActivos, ventasPorEst,
    },
    logistica: {
      totalEnvios, enviosEntregados, enRuta, programados, fillRate, enviosByEst,
    },
    crm: {
      totalOportunidades: db.oportunidades.length, pipelineTotal,
      pipelinePonderado: Math.round(pipelinePonderado), ganadas, perdidas,
      tasaConversion, crmByEtapa,
    },
    generatedAt: new Date().toISOString(),
  });
}
