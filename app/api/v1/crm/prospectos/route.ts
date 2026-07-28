import { NextRequest, NextResponse } from "next/server";

import { adminClient, numberValue, supabaseError } from "@/lib/supabase/api";

export const dynamic = "force-dynamic";

type SeguimientoInput = {
  fecha: string;
  tipo: string;
  comentario: string;
  proximaAccion?: string;
  fechaProxima?: string;
};

type ProspectoInput = {
  fecha?: string;
  asesor: string;
  canal: string;
  nombreProspecto: string;
  cargoProspecto?: string;
  nombreNegocio: string;
  municipio?: string;
  estado?: string;
  contacto1?: string;
  contacto2?: string;
  correo?: string;
  productoInteres?: string;
  zona: string;
  etapa: string;
  notas?: string;
  seguimientos?: SeguimientoInput[];
};

export async function GET() {
  const { data, error } = await adminClient()
    .from("crm_prospectos")
    .select("*, crm_seguimientos(*)")
    .order("created_at", { ascending: false });
  if (error) return supabaseError(error);

  const items = data.map((p) => ({
    id: String(p.id),
    fecha: p.fecha ?? p.created_at.slice(0, 10),
    asesor: p.asesor,
    canal: p.canal,
    nombreProspecto: p.nombre_prospecto,
    cargoProspecto: p.cargo_prospecto ?? "",
    nombreNegocio: p.nombre_negocio,
    municipio: p.municipio ?? "",
    estado: p.estado ?? "",
    contacto1: p.contacto1 ?? "",
    contacto2: p.contacto2 ?? "",
    correo: p.correo ?? "",
    productoInteres: p.producto_interes ?? "",
    zona: p.zona ?? "",
    etapa: p.etapa,
    notas: p.notas ?? "",
    creadoEn: p.created_at,
    seguimientos: (p.crm_seguimientos ?? []).map((s: { id: number; fecha: string; tipo: string; comentario: string; proxima_accion?: string; fecha_proxima?: string }) => ({
      id: String(s.id),
      fecha: s.fecha,
      tipo: s.tipo,
      comentario: s.comentario,
      proximaAccion: s.proxima_accion ?? "",
      fechaProxima: s.fecha_proxima ?? "",
    })),
  }));

  return NextResponse.json({ items, total: items.length });
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as ProspectoInput;

  if (!payload.nombreProspecto || !payload.nombreNegocio || !payload.asesor || !payload.canal || !payload.zona) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const client = adminClient();
  const { data: prospecto, error } = await client
    .from("crm_prospectos")
    .insert({
      fecha: payload.fecha ? String(payload.fecha) : new Date().toISOString().slice(0, 10),
      asesor: String(payload.asesor),
      canal: String(payload.canal),
      nombre_prospecto: String(payload.nombreProspecto),
      cargo_prospecto: payload.cargoProspecto ? String(payload.cargoProspecto) : null,
      nombre_negocio: String(payload.nombreNegocio),
      municipio: payload.municipio ? String(payload.municipio) : null,
      estado: payload.estado ? String(payload.estado) : null,
      contacto1: payload.contacto1 ? String(payload.contacto1) : null,
      contacto2: payload.contacto2 ? String(payload.contacto2) : null,
      correo: payload.correo ? String(payload.correo) : null,
      producto_interes: payload.productoInteres ? String(payload.productoInteres) : null,
      zona: String(payload.zona),
      etapa: String(payload.etapa || "nuevo"),
      notas: payload.notas ? String(payload.notas) : null,
    })
    .select()
    .single();
  if (error) return supabaseError(error);

  const seguimientos = payload.seguimientos ?? [];
  if (seguimientos.length > 0) {
    await client.from("crm_seguimientos").insert(
      seguimientos.map((s) => ({
        prospecto_id: prospecto.id,
        fecha: s.fecha ? String(s.fecha) : new Date().toISOString().slice(0, 10),
        tipo: String(s.tipo),
        comentario: String(s.comentario),
        proxima_accion: s.proximaAccion ? String(s.proximaAccion) : null,
        fecha_proxima: s.fechaProxima ? String(s.fechaProxima) : null,
      }))
    );
  }

  return NextResponse.json({ id: String(prospecto.id) }, { status: 201 });
}
