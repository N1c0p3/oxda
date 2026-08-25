import { NextRequest, NextResponse } from "next/server";

import { adminClient, numberValue, supabaseError } from "@/lib/supabase/api";
import { loadSalesRows } from "@/lib/sales-history";

type PedidoItem = {
  productoId: number;
  productoNombre?: string;
  cantidad: number;
  precioUnitario: number;
};

type PriceHistory = {
  customerCode: string;
  productCode: string;
  prices: Array<{ price: number; date: string; document: string }>;
};

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const items = (payload.items ?? []) as PedidoItem[];

  if (!payload.clienteId || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Selecciona un cliente y al menos un producto" }, { status: 400 });
  }
  for (const item of items) {
    if (!Number.isInteger(Number(item.productoId)) || Number(item.cantidad) <= 0 || Number(item.precioUnitario) < 0) {
      return NextResponse.json({ error: "Revisa producto, cajas y precio de cada partida" }, { status: 400 });
    }
  }

  const client = adminClient();
  const [customerResult, productsResult] = await Promise.all([
    client.from("clientes").select("id").eq("id", Number(payload.clienteId)).maybeSingle(),
    client.from("productos").select("id").in("id", items.map((item) => Number(item.productoId))).eq("en_catalogo_precios", true),
  ]);
  if (customerResult.error) return supabaseError(customerResult.error);
  if (!customerResult.data) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  if (productsResult.error) return supabaseError(productsResult.error);
  if ((productsResult.data ?? []).length !== new Set(items.map((item) => Number(item.productoId))).size) {
    return NextResponse.json({ error: "Uno o más productos no pertenecen al catálogo vigente" }, { status: 400 });
  }

  const subtotal = items.reduce((acc, item) => acc + Number(item.cantidad) * Number(item.precioUnitario), 0);
  const impuestos = subtotal * 0.16;
  const total = subtotal + impuestos;

  const folio = `PED-${Date.now()}`;
  const { data: pedido, error: pedidoError } = await client.from("ventas_pedidos").insert({
    folio,
    cliente_id: Number(payload.clienteId),
    fecha_pedido: new Date().toISOString().slice(0, 10),
    fecha_compromiso: payload.fechaCompromiso ? String(payload.fechaCompromiso) : null,
    comentarios: payload.comentarios ? String(payload.comentarios).trim() : null,
    estatus: "pendiente",
    subtotal: Number(subtotal.toFixed(2)),
    impuestos: Number(impuestos.toFixed(2)),
    total: Number(total.toFixed(2)),
  }).select().single();
  if (pedidoError) return supabaseError(pedidoError);

  const { error: itemsError } = await client.from("ventas_pedidos_detalle").insert(items.map((item) => ({
    pedido_id: pedido.id,
    producto_id: Number(item.productoId),
    cantidad: Number(item.cantidad),
    precio_unitario: Number(item.precioUnitario),
    subtotal: Number((Number(item.cantidad) * Number(item.precioUnitario)).toFixed(2)),
  })));
  if (itemsError) return supabaseError(itemsError);

  return NextResponse.json({
    id: pedido.id,
    clienteId: pedido.cliente_id,
    fechaCompromiso: pedido.fecha_compromiso ?? undefined,
    comentarios: pedido.comentarios ?? undefined,
    items,
    subtotal: numberValue(pedido.subtotal),
    impuestos: numberValue(pedido.impuestos),
    total: numberValue(pedido.total),
    estatus: pedido.estatus,
    createdAt: pedido.created_at,
  }, { status: 201 });
}

export async function GET() {
  const client = adminClient();
  const [ordersResult, customersResult, productsResult, salesRows] = await Promise.all([
    client
      .from("ventas_pedidos")
      .select("*, clientes(nombre_comercial, codigo_externo, zona_comercial, vendedor), ventas_pedidos_detalle(*, productos(nombre, sku, kg_caja))")
      .order("created_at", { ascending: false }),
    client
      .from("clientes")
      .select("id, codigo_externo, nombre_comercial, zona_comercial, vendedor")
      .not("codigo_externo", "is", null)
      .order("nombre_comercial", { ascending: true }),
    client
      .from("productos")
      .select("id, sku, codigo_vulpes, nombre, kg_caja, unidad_venta")
      .eq("en_catalogo_precios", true)
      .eq("activo", true)
      .order("nombre", { ascending: true }),
    loadSalesRows(),
  ]);

  if (ordersResult.error) return supabaseError(ordersResult.error);
  if (customersResult.error) return supabaseError(customersResult.error);
  if (productsResult.error) return supabaseError(productsResult.error);

  const catalogCodes = new Set((productsResult.data ?? []).map((product) => product.sku));
  const historyMap = new Map<string, PriceHistory>();
  const recentRows = [...salesRows].sort((a, b) => b.date.localeCompare(a.date));
  for (const row of recentRows) {
    if (!catalogCodes.has(row.productCode) || !row.customerCode || row.unitPrice <= 0) continue;
    const key = `${row.customerCode}\u0000${row.productCode}`;
    const entry = historyMap.get(key) ?? { customerCode: row.customerCode, productCode: row.productCode, prices: [] };
    const roundedPrice = Math.round(row.unitPrice * 100) / 100;
    if (!entry.prices.some((price) => price.price === roundedPrice)) {
      entry.prices.push({ price: roundedPrice, date: row.date, document: row.document });
    }
    if (entry.prices.length > 5) entry.prices.length = 5;
    historyMap.set(key, entry);
  }

  const items = (ordersResult.data ?? []).map((pedido) => ({
    id: pedido.id,
    clienteId: pedido.cliente_id,
    cliente: pedido.clientes?.nombre_comercial ?? String(pedido.cliente_id),
    clienteCodigo: pedido.clientes?.codigo_externo ?? "",
    zona: pedido.clientes?.zona_comercial ?? "",
    ejecutivo: pedido.clientes?.vendedor ?? "",
    fechaCompromiso: pedido.fecha_compromiso ?? undefined,
    comentarios: pedido.comentarios ?? undefined,
    items: pedido.ventas_pedidos_detalle.map((item: {
      producto_id: number;
      cantidad: unknown;
      precio_unitario: unknown;
      productos?: { nombre?: string; sku?: string; kg_caja?: unknown };
    }) => ({
      productoId: item.producto_id,
      productoCodigo: item.productos?.sku ?? "",
      productoNombre: item.productos?.nombre ?? String(item.producto_id),
      cantidad: numberValue(item.cantidad),
      kgCaja: numberValue(item.productos?.kg_caja),
      precioUnitario: numberValue(item.precio_unitario),
    })),
    subtotal: numberValue(pedido.subtotal),
    impuestos: numberValue(pedido.impuestos),
    total: numberValue(pedido.total),
    estatus: pedido.estatus,
    createdAt: pedido.created_at,
  }));

  return NextResponse.json({
    items,
    total: items.length,
    catalogs: {
      customers: (customersResult.data ?? []).map((customer) => ({
        id: customer.id,
        code: customer.codigo_externo,
        name: customer.nombre_comercial,
        label: `${customer.codigo_externo} · ${customer.nombre_comercial}`,
        zone: customer.zona_comercial ?? "",
        seller: customer.vendedor ?? "",
      })),
      products: (productsResult.data ?? []).map((product) => ({
        id: product.id,
        code: product.sku,
        vulpesCode: product.codigo_vulpes ?? "",
        name: product.nombre,
        label: `${product.sku} · ${product.nombre}`,
        kgBox: numberValue(product.kg_caja),
        salesUnit: product.unidad_venta ?? "CAJA",
      })),
      priceHistory: [...historyMap.values()],
    },
  });
}
