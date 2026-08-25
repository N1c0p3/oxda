import { readFile } from "node:fs/promises";
import path from "node:path";

import { commercialZoneFromSource, normalizeCatalogText } from "@/lib/commercial-catalog";

export type SaleRow = {
  month: string;
  date: string;
  warehouse: string;
  category: string;
  sourceProductCode: string;
  productCode: string;
  product: string;
  document: string;
  units: number;
  unitPrice: number;
  net: number;
  cost: number;
  margin: number;
  sourceZone: string;
  zone: string;
  seller: string;
  customerCode: string;
  customer: string;
};

const MONTHS: Record<string, { short: string }> = {
  enero: { short: "Ene" },
  febrero: { short: "Feb" },
  marzo: { short: "Mar" },
  abril: { short: "Abr" },
  mayo: { short: "May" },
  junio: { short: "Jun" },
  julio: { short: "Jul" },
  agosto: { short: "Ago" },
  septiembre: { short: "Sep" },
  octubre: { short: "Oct" },
  noviembre: { short: "Nov" },
  diciembre: { short: "Dic" },
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
      } else if (char === '"') quoted = false;
      else value += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(value);
      value = "";
    } else if (char === "\n") {
      row.push(value.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      value = "";
    } else value += char;
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

type RawRow = Omit<SaleRow, "productCode" | "product" | "unitPrice"> & {
  reportCode: string;
  rawProduct: string;
};

let rowsPromise: Promise<SaleRow[]> | null = null;

export async function loadSalesRows() {
  if (rowsPromise) return rowsPromise;
  rowsPromise = (async () => {
    const filePath = path.join(process.cwd(), "data", "ventas-reporte-2026.csv");
    const parsed = parseCsv(await readFile(filePath, "utf8"));
    const headerIndex = parsed.findIndex((row) => row[0] === "Item");
    if (headerIndex < 0) throw new Error("No se encontró el encabezado del reporte de ventas.");
    const header = parsed[headerIndex];
    const column = (name: string) => header.indexOf(name);

    const rawRows = parsed.slice(headerIndex + 1)
      .filter((row) => row[column("Código Producto")] && row[column("Nombre (Cliente)")])
      .map((row): RawRow => {
        const net = numberValue(row[column("Neto")]);
        const cost = numberValue(row[column("Costo total")]);
        const sourceZone = normalizeCatalogText(row[column("RUBRO")]);
        return {
          month: MONTHS[row[column("Mes")]?.trim().toLowerCase()]?.short ?? row[column("Mes")],
          date: isoDate(row[column("Fecha")]),
          warehouse: normalizeCatalogText(row[column("Nombre (Almacén)")]),
          category: normalizeCatalogText(row[column("Categoria")]),
          sourceProductCode: normalizeCatalogText(row[column("Código Producto")]),
          reportCode: normalizeCatalogText(row[column("Cod Reporte")]),
          rawProduct: normalizeCatalogText(row[column("Nombre (Producto)")]),
          document: `${row[column("Serie")]}-${row[column("Folio")]}`,
          units: numberValue(row[column("Unidades")]),
          net,
          cost,
          margin: net - cost,
          sourceZone,
          zone: commercialZoneFromSource(sourceZone),
          seller: normalizeCatalogText(row[column("Vendedor")]),
          customerCode: normalizeCatalogText(row[column("Código Cliente")]),
          customer: normalizeCatalogText(row[column("Nombre (Cliente)")]),
        };
      })
      .filter((row) => row.zone !== "MUESTRAS");

    // Un mismo producto aparece con código Vulpes o código de fabricante según
    // el almacén. Se homologa cada clave fuente al Cod Reporte más frecuente.
    const mappings = new Map<string, Map<string, number>>();
    for (const row of rawRows) {
      const canonical = row.reportCode || row.sourceProductCode;
      const counts = mappings.get(row.sourceProductCode) ?? new Map<string, number>();
      counts.set(canonical, (counts.get(canonical) ?? 0) + 1);
      mappings.set(row.sourceProductCode, counts);
    }
    const canonicalBySource = new Map<string, string>();
    for (const [source, counts] of mappings) {
      const canonical = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] || source;
      canonicalBySource.set(source, canonical);
    }

    return rawRows.map((row): SaleRow => {
      const productCode = canonicalBySource.get(row.sourceProductCode) || row.reportCode || row.sourceProductCode;
      const product = row.rawProduct.replace(new RegExp(`^${productCode.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*-?\\s*`), "") || row.rawProduct;
      return {
        month: row.month,
        date: row.date,
        warehouse: row.warehouse,
        category: row.category,
        sourceProductCode: row.sourceProductCode,
        productCode,
        product,
        document: row.document,
        units: row.units,
        unitPrice: row.units ? row.net / row.units : 0,
        net: row.net,
        cost: row.cost,
        margin: row.margin,
        sourceZone: row.sourceZone,
        zone: row.zone,
        seller: row.seller,
        customerCode: row.customerCode,
        customer: row.customer,
      };
    });
  })();
  return rowsPromise;
}
