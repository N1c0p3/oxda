"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, CheckCircle2, CircleDollarSign, Search } from "lucide-react";
import { BarChartComponent, ChartCard, StatCard } from "@/components/charts";
import { useZone } from "@/components/zone-filter";

const REPORT_DATE = new Date("2026-06-03T12:00:00");

const documents = [
  { document: "FAC-16021", customer: "CREMERIA LOS ALTOS", zone: "GDL", seller: "MARIO", balance: 87400, dueDate: "2026-06-09" },
  { document: "FAC-16034", customer: "CRISTIAN IVAN ESTRADA", zone: "QR", seller: "MARIO", balance: 53200, dueDate: "2026-06-08" },
  { document: "FAC-15988", customer: "EL SAZON 86", zone: "CS", seller: "DIEGO", balance: 25257, dueDate: "2026-04-29" },
  { document: "FAC-16002", customer: "TREFOODS", zone: "MEN VLP", seller: "GABRIELA", balance: 12143, dueDate: "2026-05-16" },
  { document: "FAC-15894", customer: "EVENTUAL", zone: "MAY VLP", seller: "MARIO", balance: 19147, dueDate: "2026-04-04" },
  { document: "FAC-16055", customer: "COMERCIAL PDC", zone: "GDL", seller: "GAMALIEL", balance: 13650, dueDate: "2026-06-20" },
  { document: "FAC-16062", customer: "SLOVENSKO", zone: "QR", seller: "ADOLFO", balance: 12240, dueDate: "2026-06-25" },
  { document: "FAC-15721", customer: "DISTRIBUIDORA BAHIA KINO", zone: "CS", seller: "MARIO", balance: 11250, dueDate: "2026-04-12" },
  { document: "FAC-15601", customer: "OPERADORA VALIENTE", zone: "CC CASTEL", seller: "MARIO", balance: 55500, dueDate: "2026-02-28" },
];

const dayDiff = (from: Date, to: string) =>
  Math.floor((from.getTime() - new Date(`${to}T12:00:00`).getTime()) / 86400000);

function agingBucket(days: number) {
  if (days <= 0) return "Por vencer";
  if (days <= 15) return "1–15 días";
  if (days <= 30) return "16–30 días";
  if (days <= 45) return "31–45 días";
  return "46 días o más";
}

const money = (value: number) =>
  value.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });

export default function ReceivablesPage() {
  const { zone } = useZone();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => documents
    .map((item) => {
      const daysOverdue = dayDiff(REPORT_DATE, item.dueDate);
      const daysToDue = -daysOverdue;
      return {
        ...item,
        daysOverdue,
        daysToDue,
        overdue: daysOverdue >= 1,
        dueSoon: daysToDue >= 5 && daysToDue <= 7,
        bucket: agingBucket(daysOverdue),
      };
    })
    .filter((item) => zone === "TODAS" || item.zone === zone)
    .filter((item) => !query || `${item.customer} ${item.document} ${item.seller}`.toLowerCase().includes(query.toLowerCase())), [zone, query]);

  const total = filtered.reduce((sum, item) => sum + item.balance, 0);
  const overdue = filtered.filter((item) => item.overdue);
  const overdueTotal = overdue.reduce((sum, item) => sum + item.balance, 0);
  const dueSoon = filtered.filter((item) => item.dueSoon);
  const dueSoonTotal = dueSoon.reduce((sum, item) => sum + item.balance, 0);
  const aging = ["1–15 días", "16–30 días", "31–45 días", "46 días o más"].map((bucket) => ({
    bucket,
    balance: overdue.filter((item) => item.bucket === bucket).reduce((sum, item) => sum + item.balance, 0),
  }));

  return (
    <div className="page" style={{ padding: "4px 4px 30px" }}>
      <header className="page-header" style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center" }}>
        <div>
          <h1 className="page-title">Cartera de clientes</h1>
          <p className="page-subtitle">Vencimiento por documento · vencido desde el primer día posterior a la fecha límite</p>
        </div>
        <div className="form-input" style={{ display: "flex", alignItems: "center", gap: 8, width: 300 }}>
          <Search size={15} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cliente, documento o vendedor…" style={{ border: 0, outline: 0, background: "transparent", color: "inherit", width: "100%" }} />
        </div>
      </header>

      {dueSoon.length > 0 && (
        <div className="alert" style={{ marginBottom: 16, background: "rgba(245,158,11,.12)", border: "1px solid rgba(245,158,11,.28)" }}>
          <CalendarClock size={17} color="#f59e0b" />
          <strong>{dueSoon.length} documentos vencen en 5 a 7 días:</strong> {money(dueSoonTotal)}
        </div>
      )}

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 14, marginBottom: 20 }}>
        <StatCard title="Cartera total" value={money(total)} subtitle={`${filtered.length} documentos · ${zone}`} trend="Saldo abierto" trendUp icon={<CircleDollarSign size={19} color="#60a5fa" />} color="blue" />
        <StatCard title="Saldo vencido" value={money(overdueTotal)} subtitle={`${overdue.length} documentos`} trend={`${total ? (overdueTotal / total * 100).toFixed(1) : 0}% de la cartera`} trendUp={false} icon={<AlertTriangle size={19} color="#ef4444" />} color="red" />
        <StatCard title="Próximo a vencer" value={money(dueSoonTotal)} subtitle="Ventana de 5 a 7 días" trend={`${dueSoon.length} alertas`} trendUp={false} icon={<CalendarClock size={19} color="#f59e0b" />} color="orange" />
        <StatCard title="Cartera vigente" value={money(total - overdueTotal)} subtitle="Sin días de atraso" trend="Al corriente" trendUp icon={<CheckCircle2 size={19} color="#22c55e" />} color="green" />
      </section>

      <ChartCard title="Antigüedad de cartera vencida" subtitle="Rangos solicitados; se excluyen documentos aún vigentes">
        <BarChartComponent data={aging} dataKeys={[{ key: "balance", name: "Saldo vencido", color: "#ef4444" }]} xAxisKey="bucket" height={285} />
      </ChartCard>

      <div className="card" style={{ marginTop: 18 }}>
        <h2 className="card-title">Detalle por documento · {zone}</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Documento</th><th>Cliente</th><th>Zona</th><th>Vencimiento</th><th>Días</th><th>Antigüedad</th><th>Saldo</th><th>Estado</th></tr></thead>
            <tbody>
              {filtered.sort((a, b) => b.daysOverdue - a.daysOverdue).map((item) => (
                <tr key={item.document}>
                  <td><strong>{item.document}</strong></td>
                  <td>{item.customer}<small style={{ display: "block", color: "var(--text-muted)" }}>{item.seller}</small></td>
                  <td><span className="badge badge-blue">{item.zone}</span></td>
                  <td>{new Date(`${item.dueDate}T12:00:00`).toLocaleDateString("es-MX")}</td>
                  <td style={{ color: item.overdue ? "#ef4444" : item.dueSoon ? "#f59e0b" : "inherit", fontWeight: 700 }}>
                    {item.overdue ? `${item.daysOverdue} vencido` : `${item.daysToDue} por vencer`}
                  </td>
                  <td>{item.overdue ? item.bucket : "Vigente"}</td>
                  <td><strong>{money(item.balance)}</strong></td>
                  <td><span className={`badge ${item.overdue ? "badge-red" : item.dueSoon ? "badge-orange" : "badge-green"}`}>{item.overdue ? "Vencido" : item.dueSoon ? "Alerta" : "Al corriente"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
