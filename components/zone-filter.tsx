"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import { COMMERCIAL_ZONES, commercialZoneFromSource, commercialZoneLabel, type CommercialZone } from "@/lib/commercial-catalog";

export const OXDA_ZONES = COMMERCIAL_ZONES;

export type OxdaZone = CommercialZone;

type ZoneContextValue = {
  zone: OxdaZone;
  setZone: (zone: OxdaZone) => void;
};

const ZoneContext = createContext<ZoneContextValue | null>(null);
const STORAGE_KEY = "oxda-zona-global";

export function ZoneProvider({ children }: { children: React.ReactNode }) {
  const [zone, setZoneState] = useState<OxdaZone>("TODAS");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    const normalized = commercialZoneFromSource(saved);
    if (normalized && normalized !== "MUESTRAS") setZoneState(normalized);
  }, []);

  const setZone = (nextZone: OxdaZone) => {
    setZoneState(nextZone);
    localStorage.setItem(STORAGE_KEY, nextZone);
  };

  const value = useMemo(() => ({ zone, setZone }), [zone]);
  return <ZoneContext.Provider value={value}>{children}</ZoneContext.Provider>;
}

export function useZone() {
  const context = useContext(ZoneContext);
  if (!context) throw new Error("useZone debe utilizarse dentro de ZoneProvider");
  return context;
}

const QUICK_ZONES: OxdaZone[] = [...OXDA_ZONES];

export function GlobalZoneFilter() {
  const { zone, setZone } = useZone();

  return (
    <section className="zone-filter" aria-label="Filtro general por zona">
      <div className="zone-filter-label">
        <MapPin size={15} aria-hidden="true" />
        <span>Zona</span>
        <strong>{commercialZoneLabel(zone)}</strong>
      </div>
      <div className="zone-quick-actions" aria-label="Selección rápida de zona">
        {QUICK_ZONES.map((item) => (
          <button
            key={item}
            type="button"
            className={zone === item ? "active" : ""}
            onClick={() => setZone(item)}
            aria-pressed={zone === item}
          >
            {item === "TODAS" ? "Todas" : item}
          </button>
        ))}
      </div>
      <select
        className="zone-select"
        value={zone}
        onChange={(event) => setZone(event.target.value as OxdaZone)}
        aria-label="Seleccionar otra zona"
      >
        {OXDA_ZONES.map((item) => (
          <option key={item} value={item}>
            {commercialZoneLabel(item)}
          </option>
        ))}
      </select>
    </section>
  );
}
