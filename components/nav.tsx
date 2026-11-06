"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import {
  BarChart3,
  Boxes,
  BrainCircuit,
  Calculator,
  ChartNoAxesCombined,
  CircleDollarSign,
  CreditCard,
  Factory,
  Handshake,
  LayoutDashboard,
  LogOut,
  PackageOpen,
  Ship,
  ShoppingCart,
  Target,
  Truck,
} from "lucide-react";
import MaggieLogo from "./maggie-logo";
import { useProfile } from "./profile-session";
import ThemeToggle from "./theme-toggle";
import { NAV_SECTIONS, type NavIcon } from "@/lib/profiles";

const ICONS: Record<NavIcon, ComponentType<{ className?: string; size?: number; "aria-hidden"?: "true" }>> = {
  dashboard: LayoutDashboard,
  inventory: Boxes,
  transit: PackageOpen,
  production: Factory,
  sales: BarChart3,
  orders: ShoppingCart,
  crm: Handshake,
  receivables: CircleDollarSign,
  budget: Target,
  shipping: Truck,
  prediction: Ship,
  costing: Calculator,
  payables: CreditCard,
  finance: ChartNoAxesCombined,
  analytics: BrainCircuit,
  maggie: MaggieLogo,
};

export default function Nav() {
  const pathname = usePathname();
  const { profile, cerrarSesion } = useProfile();
  const sections = NAV_SECTIONS.map((section) => ({
    ...section,
    links: section.links.filter((link) => profile.allowedRoutes.includes(link.href)),
  })).filter((section) => section.links.length > 0);
  const activeHref = sections
    .flatMap((section) => section.links)
    .slice()
    .sort((a, b) => b.href.length - a.href.length)
    .find((link) => pathname === link.href || pathname.startsWith(`${link.href}/`))?.href;

  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-logo">OXDA</span>
        <span className="sidebar-brand-sub">Sistema de Gestión</span>
      </div>

      <div className="sidebar-profile">
        <span className="sidebar-profile-avatar">{profile.initials}</span>
        <span>
          <strong>{profile.name}</strong>
          <small>{profile.department}</small>
        </span>
      </div>

      {sections.map((section) => (
        <div key={section.label} className="sidebar-section">
          <p className="sidebar-section-label">{section.label}</p>
          {section.links.map((link) => {
            const Icon = ICONS[link.icon];
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`sidebar-link${activeHref === link.href ? " active" : ""}`}
              >
                <Icon className="sidebar-icon" size={17} aria-hidden="true" />
                {link.label}
              </Link>
            );
          })}
        </div>
      ))}

      <div style={{ flex: 1 }} />

      <div className="sidebar-actions">
        <button type="button" className="sidebar-switch-profile" onClick={() => void cerrarSesion()}>
          <LogOut size={16} aria-hidden="true" />
          Cerrar sesión
        </button>
        <p className="sidebar-section-label">Apariencia</p>
        <ThemeToggle />
      </div>
    </nav>
  );
}
