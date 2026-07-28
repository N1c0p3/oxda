"use client";

import { useEffect, useState } from "react";
import { CircleDollarSign, Save } from "lucide-react";
import { useZone } from "@/components/zone-filter";

type Commission = {
  id: string;
  seller: string;
  zone: string;
  sale: number;
  rate: number;
  status: "Por autorizar" | "Programada" | "Pagada";
  paymentDate: string;
};

const SEED: Commission[] = [
  { id: "COM-001", seller: "MARIO", zone: "GDL", sale: 916518, rate: 1.5, status: "Por autorizar", paymentDate: "" },
  { id: "COM-002", seller: "GABRIELA", zone: "MEN VLP", sale: 159504, rate: 2, status: "Programada", paymentDate: "2026-07-31" },
  { id: "COM-003", seller: "DIEGO", zone: "CS", sale: 144616, rate: 2, status: "Pagada", paymentDate: "2026-07-15" },
  { id: "COM-004", seller: "GAMALIEL", zone: "QR", sale: 44661, rate: 2.5, status: "Por autorizar", paymentDate: "" },
  { id: "COM-005", seller: "MKT", zone: "MAY VLP", sale: 40408, rate: 1, status: "Programada", paymentDate: "2026-07-31" },
];

const money = (value: number) =>
  value.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });

export default function AccountsPayablePage() {
  const { zone } = useZone();
  const [rows, setRows] = useState(SEED);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("oxda-accounts-payable-commissions");
    if (stored) setRows(JSON.parse(stored));
  }, []);

  const visible = rows.filter((item) => zone === "TODAS" || item.zone === zone);
  const pending = visible.filter((item) => item.status !== "Pagada").reduce((sum, item) => sum + item.sale * item.rate / 100, 0);
  const paid = visible.filter((item) => item.status === "Pagada").reduce((sum, item) => sum + item.sale * item.rate / 100, 0);

  function update(id: string, change: Partial<Commission>) {
    setRows((current) => current.map((item) => item.id === id ? { ...item, ...change } : item));
    setSaved(false);
  }

  function save() {
    localStorage.setItem("oxda-accounts-payable-commissions", JSON.stringify(rows));
    setSaved(true);
  }

  return (
    <div className="page" style={{ padding: "4px 4px 30px" }}>
      <header className="page-header" style={{ display: "flex", justifyContent: "space-between", gap: 14 }}>
        <div><h1 className="page-title">Cuentas por pagar</h1><p className="page-subtitle">Autorización, programación y pago de comisiones · {zone}</p></div>
        <button className="btn btn-primary" onClick={save}><Save size={15} /> Guardar cambios</button>
      </header>
      {saved && <div className="alert alert-success" style={{ marginBottom: 14 }}>Cambios de comisiones guardados.</div>}
      <div className="kpi-grid">
        <div className="kpi-card orange"><div className="kpi-label">Comisiones por pagar</div><div className="kpi-value">{money(pending)}</div></div>
        <div className="kpi-card green"><div className="kpi-label">Comisiones pagadas</div><div className="kpi-value">{money(paid)}</div></div>
        <div className="kpi-card blue"><div className="kpi-label">Registros</div><div className="kpi-value">{visible.length}</div><div className="kpi-unit">zona seleccionada</div></div>
      </div>
      <div className="card">
        <h2 className="card-title"><CircleDollarSign size={17} /> Pago de comisiones</h2>
        <div className="table-wrap"><table>
          <thead><tr><th>Vendedor</th><th>Zona</th><th>Venta facturada</th><th>Tasa</th><th>Comisión</th><th>Fecha pago</th><th>Estado</th></tr></thead>
          <tbody>{visible.map((item) => <tr key={item.id}>
            <td><strong>{item.seller}</strong></td><td><span className="badge badge-blue">{item.zone}</span></td><td>{money(item.sale)}</td><td><input className="form-input" style={{ width: 90 }} type="number" step={0.1} value={item.rate} onChange={(event) => update(item.id, { rate: Number(event.target.value) })} /></td><td><strong>{money(item.sale * item.rate / 100)}</strong></td><td><input className="form-input" type="date" value={item.paymentDate} onChange={(event) => update(item.id, { paymentDate: event.target.value })} /></td><td><select className="form-input" value={item.status} onChange={(event) => update(item.id, { status: event.target.value as Commission["status"] })}><option>Por autorizar</option><option>Programada</option><option>Pagada</option></select></td>
          </tr>)}</tbody>
        </table></div>
      </div>
    </div>
  );
}
