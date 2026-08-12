export const COMMERCIAL_ZONES = [
  "TODAS",
  "BAJÍO - MAYOREO",
  "GDL",
  "QR",
  "CS",
  "CONTENEDOR COMPLETO",
] as const;

export type CommercialZone = (typeof COMMERCIAL_ZONES)[number];

const BAJIO_ZONES = new Set([
  "MEN VLP",
  "MAY VLP",
  "MAY GAMA",
  "FARAON",
  "VERACRUZ",
]);

export function normalizeCatalogText(value = "") {
  return value.trim().replace(/\s+/g, " ").toUpperCase();
}

export function commercialZoneFromSource(value = ""): CommercialZone | "MUESTRAS" | "" {
  const zone = normalizeCatalogText(value);
  if (!zone) return "";
  if (zone === "TODAS") return "TODAS";
  if (zone === "GDL" || zone === "QR" || zone === "CS") return zone;
  if (BAJIO_ZONES.has(zone)) return "BAJÍO - MAYOREO";
  if (zone === "MUESTRA" || zone === "MUESTRAS") return "MUESTRAS";
  if (zone.startsWith("CC ")) return "CONTENEDOR COMPLETO";
  return "BAJÍO - MAYOREO";
}

export function commercialZoneLabel(zone: CommercialZone) {
  return zone === "TODAS" ? "Todas las zonas" : zone;
}
