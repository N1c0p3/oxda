export type ProfileId = "contador" | "logistica" | "ventas" | "direccion";

export type AppProfile = {
  id: ProfileId;
  name: string;
  department: string;
  initials: string;
  description: string;
  allowedRoutes: string[];
};

export type NavIcon =
  | "dashboard"
  | "inventory"
  | "transit"
  | "production"
  | "sales"
  | "orders"
  | "crm"
  | "receivables"
  | "budget"
  | "shipping"
  | "prediction"
  | "costing"
  | "payables"
  | "finance"
  | "analytics"
  | "maggie";

export type NavSection = {
  label: string;
  links: Array<{ href: string; label: string; icon: NavIcon }>;
};

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Principal",
    links: [
      { href: "/dashboard", label: "Mi dashboard", icon: "dashboard" },
      { href: "/maggie", label: "Maggie", icon: "maggie" },
    ],
  },
  {
    label: "Operación",
    links: [
      { href: "/inventarios/reporte", label: "Centro de Inventarios", icon: "inventory" },
      { href: "/inventarios/transito", label: "Inventario en tránsito", icon: "transit" },
      { href: "/produccion", label: "Producción", icon: "production" },
      { href: "/logistica", label: "Envíos y seguimiento", icon: "shipping" },
      { href: "/logistica/prediccion", label: "Logística y predicción", icon: "prediction" },
    ],
  },
  {
    label: "Comercial",
    links: [
      { href: "/ventas/reporte", label: "Salón de Ventas", icon: "sales" },
      { href: "/ventas", label: "Pedidos y picking", icon: "orders" },
      { href: "/crm", label: "Prospectos y CRM", icon: "crm" },
      { href: "/cobranza", label: "Cartera de clientes", icon: "receivables" },
      { href: "/presupuestos/zona-producto", label: "Presupuestos", icon: "budget" },
    ],
  },
  {
    label: "Finanzas",
    links: [
      { href: "/costeo", label: "Costeo y precios", icon: "costing" },
      { href: "/cuentas-por-pagar", label: "Cuentas por pagar", icon: "payables" },
      { href: "/ia", label: "Análisis financiero", icon: "finance" },
    ],
  },
  {
    label: "Inteligencia",
    links: [
      { href: "/analisis", label: "Análisis avanzado", icon: "analytics" },
      { href: "/estadisticas", label: "Estadísticas", icon: "analytics" },
    ],
  },
  {
    label: "Administración",
    links: [{ href: "/telegram", label: "Vinculación de Maggie", icon: "maggie" }],
  },
];

const ACCOUNTING_ROUTES = [
  "/dashboard",
  "/maggie",
  "/ventas/reporte",
  "/cobranza",
  "/presupuestos/zona-producto",
  "/costeo",
  "/cuentas-por-pagar",
  "/ia",
];

const LOGISTICS_ROUTES = [
  "/dashboard",
  "/maggie",
  "/inventarios/reporte",
  "/inventarios/transito",
  "/ventas",
  "/logistica",
  "/logistica/prediccion",
];

const SALES_ROUTES = [
  "/dashboard",
  "/maggie",
  "/ventas/reporte",
  "/ventas",
  "/crm",
  "/cobranza",
  "/presupuestos/zona-producto",
  "/logistica",
];

const ALL_ROUTES = NAV_SECTIONS.flatMap((section) => section.links.map((link) => link.href));
const DIRECTION_OPERATIONAL_ROUTES = [
  "/inventarios",
  "/inventarios/almacenes",
  "/ventas/vs-presupuesto",
  "/pipeline",
  "/resumen",
];
const KNOWN_ROUTES = [...ALL_ROUTES, ...DIRECTION_OPERATIONAL_ROUTES];

export const PROFILES: AppProfile[] = [
  {
    id: "contador",
    name: "Juan",
    department: "Contabilidad",
    initials: "JU",
    description: "Cartera, facturación, costos, comisiones y análisis financiero.",
    allowedRoutes: ACCOUNTING_ROUTES,
  },
  {
    id: "logistica",
    name: "Ángeles",
    department: "Logística y distribución",
    initials: "AN",
    description: "Inventarios, pedidos por preparar, embarques, rutas y reabasto.",
    allowedRoutes: LOGISTICS_ROUTES,
  },
  {
    id: "ventas",
    name: "Gama",
    department: "Ventas",
    initials: "GA",
    description: "Resultados comerciales, pedidos, prospectos, cartera y metas.",
    allowedRoutes: SALES_ROUTES,
  },
  {
    id: "direccion",
    name: "Dirección",
    department: "Dirección general",
    initials: "DG",
    description: "Resumen ejecutivo inicial y acceso completo a la operación.",
    allowedRoutes: KNOWN_ROUTES,
  },
];

export function getProfile(profileId: ProfileId | null) {
  return PROFILES.find((profile) => profile.id === profileId) ?? null;
}

export function canAccessPath(profile: AppProfile, pathname: string) {
  if (pathname === "/") return true;
  const knownRoute = KNOWN_ROUTES
    .slice()
    .sort((a, b) => b.length - a.length)
    .find((route) => pathname === route || pathname.startsWith(`${route}/`));
  return knownRoute ? profile.allowedRoutes.includes(knownRoute) : false;
}
