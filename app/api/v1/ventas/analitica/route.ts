import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { FORMULA_CATALOG, MONTH_BUDGETS } from "@/lib/oxda-business-rules";

export const runtime = "nodejs";

type SaleRow = {
  month: string;
  date: string;
  warehouse: string;
  category: string;
  productCode: string;
  product: string;
  document: string;
  units: number;
  net: number;
  cost: number;
  margin: number;
  zone: string;
  seller: string;
  customerCode: string;
  customer: string;
};

const MONTHS: Record<string, { short: string; number: number }> = {
  enero: { short: "Ene", number: 1 },
  febrero: { short: "Feb", number: 2 },
  marzo: { short: "Mar", number: 3 },
  abril: { short: "Abr", number: 4 },
  mayo: { short: "May", number: 5 },
  junio: { short: "Jun", number: 6 },
  julio: { short: "Jul", number: 7 },
  agosto: { short: "Ago", number: 8 },
  septiembre: { short: "Sep", number: 9 },
  octubre: { short: "Oct", number: 10 },
  noviembre: { short: "Nov", number: 11 },
  diciembre: { short: "Dic", number: 12 },
};

const DATE_MONTHS: Record<string, number> = {
  ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5,
  jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11,
};

function parseCsv(input: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (quoted) {
      if (char === '"' && input[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        value += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(value);
      value = "";
    } else if (char === "\n") {
      row.push(value.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }
  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }
  return rows;
}

function numberValue(value = "") {
  const parsed = Number(value.replace(/[$,\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalize(value = "") {
  return value.trim().replace(/\s+/g, " ").toUpperCase();
}

function isoDate(value: string) {
  const iso = value.trim().match(/^(\d{4}-\d{2}-\d{2})/);
  if (iso) return iso[1];
  const match = value.trim().toLowerCase().match(/^(\d{1,2})-([a-záéíóú]{3})-(\d{2,4})$/i);
  if (!match) return "";
  const month = DATE_MONTHS[match[2].normalize("NFD").replace(/\p{Diacritic}/gu, "")];
  if (month === undefined) return "";
  const year = match[3].length === 2 ? 2000 + Number(match[3]) : Number(match[3]);
  return new Date(Date.UTC(year, month, Number(match[1]))).toISOString().slice(0, 10);
}

let rowsPromise: Promise<SaleRow[]> | null = null;

async function loadRows() {
  if (rowsPromise) return rowsPromise;
  rowsPromise = (async () => {
    const filePath = path.join(process.cwd(), "data", "ventas-reporte-2026.csv");
    const parsed = parseCsv(await readFile(filePath, "utf8"));
    const headerIndex = parsed.findIndex((row) => row[0] === "Item");
    if (headerIndex < 0) throw new Error("No se encontró el encabezado del reporte de ventas.");
    const header = parsed[headerIndex];
    const column = (name: string) => header.indexOf(name);

    return parsed.slice(headerIndex + 1)
      .filter((row) => row[column("Código Producto")] && row[column("Nombre (Cliente)")])
      .map((row): SaleRow => {
        const monthName = row[column("Mes")]?.trim().toLowerCase();
        const net = numberValue(row[column("Neto")]);
        const cost = numberValue(row[column("Costo total")]);
        return {
          month: MONTHS[monthName]?.short ?? row[column("Mes")],
          date: isoDate(row[column("Fecha")]),
          warehouse: normalize(row[column("Nombre (Almacén)")]),
          category: normalize(row[column("Categoria")]),
          productCode: normalize(row[column("Código Producto")]),
          product: normalize(row[column("Nombre (Producto)")]),
          document: `${row[column("Serie")]}-${row[column("Folio")]}`,
          units: numberValue(row[column("Unidades")]),
          net,
          cost,
          // La base oficial de rentabilidad es venta neta menos costo. El
          // libro tiene algunos renglones donde "Margen" se calculó con Total;
          // se conserva el Excel sin alterarlo y se normaliza aquí para todos
          // los KPIs, productos y clientes.
          margin: net - cost,
          zone: normalize(row[column("RUBRO")]),
          seller: normalize(row[column("Vendedor")]),
          customerCode: normalize(row[column("Código Cliente")]),
          customer: normalize(row[column("Nombre (Cliente)")]),
        };
      });
  })();
  return rowsPromise;
}

function groupRows<T extends { units: number; sale: number; cost: number; margin: number; documents: Set<string> }>(
  rows: SaleRow[],
  keyOf: (row: SaleRow) => string,
  create: (row: SaleRow) => T,
) {
  const map = new Map<string, T>();
  for (const row of rows) {
    const key = keyOf(row);
    const current = map.get(key) ?? create(row);
    current.units += row.units;
    current.sale += row.net;
    current.cost += row.cost;
    current.margin += row.margin;
    current.documents.add(row.document);
    map.set(key, current);
  }
  return map;
}

export async function GET(request: NextRequest) {
  try {
    const allRows = await loadRows();
    const zone = normalize(request.nextUrl.searchParams.get("zone") || "TODAS");
    const month = request.nextUrl.searchParams.get("month") || "Acumulado";
    const from = request.nextUrl.searchParams.get("from") || "";
    const to = request.nextUrl.searchParams.get("to") || "";
    const trendDimension = request.nextUrl.searchParams.get("trendDimension") || "total";
    const trendKey = normalize(request.nextUrl.searchParams.get("trendKey") || "");

    const rows = allRows.filter((row) => {
      if (zone !== "TODAS" && row.zone !== zone) return false;
      if (month !== "Acumulado" && row.month !== month) return false;
      if (from && row.date < from) return false;
      if (to && row.date > to) return false;
      return true;
    });

    const periodDates = rows.map((row) => row.date).filter(Boolean).sort();
    const firstDate = periodDates[0] || "";
    const lastDate = periodDates.at(-1) || "";
    const periodDays = firstDate && lastDate
      ? Math.max(1, Math.round((Date.parse(lastDate) - Date.parse(firstDate)) / 86400000) + 1)
      : 1;

    const totalSale = rows.reduce((sum, row) => sum + row.net, 0);
    const totalCost = rows.reduce((sum, row) => sum + row.cost, 0);
    const totalMargin = totalSale - totalCost;
    const uniqueCustomers = new Set(rows.map((row) => row.customerCode)).size;
    const uniqueDocuments = new Set(rows.map((row) => row.document)).size;

    const productsByCustomer = new Map<string, SaleRow[]>();
    for (const row of rows) {
      const key = row.customerCode || row.customer;
      productsByCustomer.set(key, [...(productsByCustomer.get(key) ?? []), row]);
    }

    const customerMap = groupRows(
      rows,
      (row) => row.customerCode || row.customer,
      (row) => ({
        code: row.customerCode,
        customer: row.customer,
        zone: row.zone,
        seller: row.seller,
        units: 0,
        sale: 0,
        cost: 0,
        margin: 0,
        documents: new Set<string>(),
      }),
    );

    const customers = [...customerMap.entries()].map(([key, item]) => {
      const detailRows = productsByCustomer.get(key) ?? [];
      const detailMap = groupRows(
        detailRows,
        (row) => row.productCode,
        (row) => ({
          code: row.productCode,
          product: row.product,
          units: 0,
          sale: 0,
          cost: 0,
          margin: 0,
          documents: new Set<string>(),
        }),
      );
      const products = [...detailMap.values()]
        .map((product) => ({
          code: product.code,
          product: product.product,
          units: product.units,
          sale: product.sale,
          cost: product.cost,
          margin: product.margin,
          marginPct: product.sale ? (product.margin / product.sale) * 100 : 0,
          frequency: product.documents.size,
          rotation: (product.units / periodDays) * 30,
        }))
        .sort((a, b) => b.sale - a.sale);
      return {
        code: item.code,
        customer: item.customer,
        zone: item.zone,
        seller: item.seller,
        units: item.units,
        sale: item.sale,
        cost: item.cost,
        margin: item.margin,
        marginPct: item.sale ? (item.margin / item.sale) * 100 : 0,
        frequency: item.documents.size,
        rotation: (item.units / periodDays) * 30,
        products,
      };
    }).sort((a, b) => b.sale - a.sale);

    const productMap = groupRows(
      rows,
      (row) => row.productCode,
      (row) => ({
        code: row.productCode,
        product: row.product,
        category: row.category,
        zone: row.zone,
        units: 0,
        sale: 0,
        cost: 0,
        margin: 0,
        documents: new Set<string>(),
      }),
    );

    const products = [...productMap.values()]
      .map((item) => ({
        code: item.code,
        product: item.product,
        category: item.category,
        zone: item.zone,
        units: item.units,
        sale: item.sale,
        cost: item.cost,
        margin: item.margin,
        marginPct: item.sale ? (item.margin / item.sale) * 100 : 0,
        frequency: item.documents.size,
        rotation: (item.units / periodDays) * 30,
      }))
      .sort((a, b) => b.units - a.units);

    const trend = Object.keys(MONTH_BUDGETS).map((monthKey) => {
      const monthRows = allRows.filter((row) =>
        row.month === monthKey &&
        (zone === "TODAS" || row.zone === zone) &&
        (!trendKey ||
          (trendDimension === "product" && row.productCode === trendKey) ||
          (trendDimension === "customer" && row.customerCode === trendKey) ||
          (trendDimension === "zone" && row.zone === trendKey))
      );
      return {
        month: monthKey,
        sale: monthRows.reduce((sum, row) => sum + row.net, 0),
        units: monthRows.reduce((sum, row) => sum + row.units, 0),
      };
    }).map((item, index, values) => ({
      ...item,
      factor: index > 0 && values[index - 1].sale
        ? item.sale / values[index - 1].sale
        : null,
    }));

    const monthlyBudget = (monthKey: string) => {
      const table = MONTH_BUDGETS[monthKey] ?? {};
      return zone === "TODAS"
        ? Object.values(table).reduce((sum, value) => sum + value, 0)
        : table[zone] ?? 0;
    };
    let budget = 0;
    if (from && to) {
      const cursor = new Date(`${from}T12:00:00Z`);
      const end = new Date(`${to}T12:00:00Z`);
      while (cursor <= end) {
        const monthKey = Object.values(MONTHS).find((item) => item.number === cursor.getUTCMonth() + 1)?.short;
        const daysInMonth = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 0)).getUTCDate();
        if (monthKey) budget += monthlyBudget(monthKey) / daysInMonth;
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
    } else if (month !== "Acumulado") {
      budget = monthlyBudget(month);
    } else {
      budget = Object.keys(MONTH_BUDGETS).reduce((sum, monthKey) => sum + monthlyBudget(monthKey), 0);
    }
    const budgetComparableSale = zone === "TODAS"
      ? rows.filter((row) => row.zone in (MONTH_BUDGETS[row.month] ?? {})).reduce((sum, row) => sum + row.net, 0)
      : totalSale;

    return NextResponse.json({
      source: { file: "ventas-reporte-2026.csv", cutOff: lastDate || "2026-06-24", metricBase: "neto" },
      filters: { zone, month, from, to, firstDate, lastDate, periodDays, trendDimension, trendKey },
      kpis: {
        sale: totalSale,
        budget,
        budgetComparableSale,
        achievementPct: budget ? (budgetComparableSale / budget) * 100 : null,
        units: rows.reduce((sum, row) => sum + row.units, 0),
        cost: totalCost,
        margin: totalMargin,
        marginPct: totalSale ? (totalMargin / totalSale) * 100 : 0,
        mcp: null,
        customers: uniqueCustomers,
        orders: uniqueDocuments,
        averageTicket: uniqueDocuments ? totalSale / uniqueDocuments : 0,
      },
      customers,
      products,
      trend,
      formulas: FORMULA_CATALOG,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No fue posible procesar la facturación." },
      { status: 500 },
    );
  }
}
