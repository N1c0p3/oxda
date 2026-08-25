"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./theme-toggle";

const sections = [
  {
    label: "Principal",
    links: [
      { href: "/dashboard", label: "Dashboard", icon: "📊" },
    ],
  },
  {
    label: "Inventarios",
    links: [
      { href: "/inventarios/reporte", label: "Centro de Inventarios", icon: "📦" },
    ],
  },
  {
    label: "Ventas",
    links: [
      { href: "/ventas/reporte", label: "Salón de Ventas", icon: "🏆" },
      { href: "/ventas", label: "Pedidos", icon: "🛒" },
      { href: "/cobranza", label: "Cartera de clientes", icon: "💰" },
      { href: "/crm", label: "Prospectos & CRM", icon: "🤝" },
    ],
  },
  {
    label: "Presupuestos",
    links: [
      { href: "/presupuestos/zona-producto", label: "Presupuestos", icon: "🎯" },
    ],
  },
  {
    label: "Operaciones",
    links: [
      { href: "/logistica", label: "Envíos y seguimiento", icon: "🚛" },
      { href: "/costeo", label: "Costeo", icon: "🧮" },
      { href: "/logistica/prediccion", label: "Logística & Predicción", icon: "🚢" },
      { href: "/cuentas-por-pagar", label: "Cuentas por pagar", icon: "💳" },
    ],
  },
];

export default function Nav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/ventas") return pathname === "/ventas";
    return pathname.startsWith(href);
  };

  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-logo">🔵 OXDA</span>
        <span className="sidebar-brand-sub">Sistema de Gestión</span>
      </div>

      {sections.map((section) => (
        <div key={section.label} className="sidebar-section">
          <p className="sidebar-section-label">{section.label}</p>
          {section.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`sidebar-link${isActive(link.href) ? " active" : ""}`}
            >
              <span className="sidebar-icon">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </div>
      ))}

      <div style={{ flex: 1 }} />

      <div style={{ padding: ".5rem 0", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <p className="sidebar-section-label">Apariencia</p>
        <ThemeToggle />
      </div>
    </nav>
  );
}
