import { NextResponse } from "next/server";

import { EMPTY_PRODUCT_COSTING } from "@/lib/product-costing";
import { adminClient, numberValue, supabaseError } from "@/lib/supabase/api";

export const dynamic = "force-dynamic";

type PriceRow = {
  id: number;
  producto_id: number;
  lista_id: number;
  modalidad: string;
  rango: string;
  unidad_precio: string;
  precio: number | string;
  orden: number;
};

type CostingRow = {
  zona: string | null;
  entrega: string | null;
  condiciones: string | null;
  moneda: string;
  cajas_por_tarima: number | string;
  tarimas_por_contenedor: number | string;
  precio_origen_kg: number | string;
  flete_maritimo: number | string;
  tipo_cambio_base: number | string;
  factor_tipo_cambio: number | string;
  tasa_interes_impuestos: number | string;
  gastos_aduanales: number | string;
  flete_aduana_cliente: number | string;
  almacenaje_caja: number | string;
  margen_objetivo: number | string;
};

function optionalText(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}

function requiredText(value: unknown, fallback = "") {
  return String(value ?? fallback).trim();
}

function safeNumber(value: unknown, field: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${field} debe ser un número mayor o igual a cero`);
  }
  return parsed;
}

function positiveNumber(value: unknown, field: string) {
  const parsed = safeNumber(value, field);
  if (parsed <= 0) throw new Error(`${field} debe ser mayor a cero`);
  return parsed;
}

function rate(value: unknown, field: string) {
  const parsed = safeNumber(value, field);
  if (parsed >= 1) throw new Error(`${field} debe ser menor a 100%`);
  return parsed;
}

export async function GET() {
  const client = adminClient();
  const [productsResult, listsResult, pricesResult] = await Promise.all([
    client
      .from("productos")
      .select(
        "id, sku, nombre, categoria, codigo_vulpes, disponibilidad, tipo_empaque, presentacion, unidad_venta, kg_caja, costo_estandar, precio_venta, activo, producto_costeos(zona, entrega, condiciones, moneda, cajas_por_tarima, tarimas_por_contenedor, precio_origen_kg, flete_maritimo, tipo_cambio_base, factor_tipo_cambio, tasa_interes_impuestos, gastos_aduanales, flete_aduana_cliente, almacenaje_caja, margen_objetivo)",
      )
      .eq("en_catalogo_precios", true)
      .order("nombre", { ascending: true }),
    client
      .from("listas_precios")
      .select("id, clave, nombre, vigencia, activa")
      .eq("activa", true)
      .order("id", { ascending: true }),
    client
      .from("producto_precios")
      .select("id, producto_id, lista_id, modalidad, rango, unidad_precio, precio, orden")
      .order("orden", { ascending: true }),
  ]);

  if (productsResult.error) return supabaseError(productsResult.error);
  if (listsResult.error) return supabaseError(listsResult.error);
  if (pricesResult.error) return supabaseError(pricesResult.error);

  const pricesByProduct = new Map<number, PriceRow[]>();
  for (const row of pricesResult.data as PriceRow[]) {
    const current = pricesByProduct.get(row.producto_id) ?? [];
    current.push(row);
    pricesByProduct.set(row.producto_id, current);
  }

  const items = productsResult.data.map((product) => {
    const relation = product.producto_costeos as CostingRow | CostingRow[] | null;
    const costing = Array.isArray(relation) ? relation[0] : relation;
    return {
      id: product.id,
      code: product.sku,
      product: product.nombre,
      category: product.categoria ?? "",
      vulpesCode: product.codigo_vulpes ?? "",
      availability: product.disponibilidad ?? "",
      packageType: product.tipo_empaque ?? "",
      presentation: product.presentacion ?? "",
      salesUnit: product.unidad_venta ?? "CAJA",
      kgBox: numberValue(product.kg_caja),
      costBox: numberValue(product.costo_estandar),
      generalPrice: numberValue(product.precio_venta),
      active: Boolean(product.activo),
      costModel: costing ? {
        zone: costing.zona ?? "",
        delivery: costing.entrega ?? "",
        conditions: costing.condiciones ?? "",
        currency: costing.moneda || EMPTY_PRODUCT_COSTING.currency,
        boxesPerPallet: numberValue(costing.cajas_por_tarima),
        palletsPerContainer: numberValue(costing.tarimas_por_contenedor),
        originPriceKg: numberValue(costing.precio_origen_kg),
        seaFreight: numberValue(costing.flete_maritimo),
        exchangeRateBase: numberValue(costing.tipo_cambio_base),
        exchangeRateFactor: numberValue(costing.factor_tipo_cambio),
        interestTaxRate: numberValue(costing.tasa_interes_impuestos),
        customsExpenses: numberValue(costing.gastos_aduanales),
        inlandFreight: numberValue(costing.flete_aduana_cliente),
        storagePerBox: numberValue(costing.almacenaje_caja),
        targetMargin: numberValue(costing.margen_objetivo),
      } : { ...EMPTY_PRODUCT_COSTING },
      prices: (pricesByProduct.get(product.id) ?? []).map((price) => ({
        id: price.id,
        listId: price.lista_id,
        mode: price.modalidad,
        range: price.rango,
        priceUnit: price.unidad_precio,
        price: numberValue(price.precio),
        order: price.orden,
      })),
    };
  });

  return NextResponse.json({
    items,
    lists: listsResult.data.map((list) => ({
      id: list.id,
      key: list.clave,
      name: list.nombre,
      validFrom: list.vigencia,
      active: list.activa,
    })),
    total: items.length,
  });
}

export async function PATCH(request: Request) {
  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "El cuerpo de la solicitud no es válido" }, { status: 400 });
  }

  const code = requiredText(payload.code);
  if (!code) {
    return NextResponse.json({ error: "Código de producto es obligatorio" }, { status: 400 });
  }

  try {
    const productUpdate = {
      product: requiredText(payload.product),
      category: optionalText(payload.category),
      vulpesCode: optionalText(payload.vulpesCode),
      availability: optionalText(payload.availability),
      packageType: optionalText(payload.packageType),
      presentation: optionalText(payload.presentation),
      salesUnit: requiredText(payload.salesUnit, "CAJA") || "CAJA",
      kgBox: safeNumber(payload.kgBox, "Kg por caja"),
      costBox: safeNumber(payload.costBox, "Costo por caja"),
      active: payload.active !== false,
    };

    if (!productUpdate.product) {
      return NextResponse.json({ error: "Nombre de producto es obligatorio" }, { status: 400 });
    }

    const prices = Array.isArray(payload.prices) ? payload.prices : [];
    const priceUpdates = [];
    for (const rawPrice of prices) {
      const price = rawPrice as Record<string, unknown>;
      const id = Number(price.id);
      if (!Number.isInteger(id) || id <= 0) {
        return NextResponse.json({ error: "Identificador de precio no válido" }, { status: 400 });
      }
      priceUpdates.push({ id, price: safeNumber(price.price, "Precio") });
    }

    const rawCostModel = (payload.costModel ?? {}) as Record<string, unknown>;
    const costModel = {
      zone: requiredText(rawCostModel.zone),
      delivery: requiredText(rawCostModel.delivery),
      conditions: requiredText(rawCostModel.conditions),
      currency: requiredText(rawCostModel.currency, "EUR/USD") || "EUR/USD",
      boxesPerPallet: positiveNumber(rawCostModel.boxesPerPallet, "Cajas por tarima"),
      palletsPerContainer: positiveNumber(rawCostModel.palletsPerContainer, "Tarimas por contenedor"),
      originPriceKg: safeNumber(rawCostModel.originPriceKg, "Precio de origen por kg"),
      seaFreight: safeNumber(rawCostModel.seaFreight, "Flete marítimo"),
      exchangeRateBase: safeNumber(rawCostModel.exchangeRateBase, "Tipo de cambio base"),
      exchangeRateFactor: safeNumber(rawCostModel.exchangeRateFactor, "Factor del tipo de cambio"),
      interestTaxRate: rate(rawCostModel.interestTaxRate, "Tasa de interés e impuestos"),
      customsExpenses: safeNumber(rawCostModel.customsExpenses, "Gastos aduanales"),
      inlandFreight: safeNumber(rawCostModel.inlandFreight, "Flete de aduana a entrega"),
      storagePerBox: safeNumber(rawCostModel.storagePerBox, "Almacenaje por caja"),
      targetMargin: rate(rawCostModel.targetMargin, "Margen objetivo"),
    };

    const { data, error } = await adminClient().rpc("guardar_producto_catalogo_costeo", {
      p_sku: code,
      p_producto: productUpdate,
      p_precios: priceUpdates,
      p_costeo: costModel,
    });
    if (error) return supabaseError(error);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No fue posible actualizar el producto" },
      { status: 400 },
    );
  }
}
