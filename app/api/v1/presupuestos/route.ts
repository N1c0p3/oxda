import { NextResponse } from "next/server";

import { adminClient, numberValue, supabaseError } from "@/lib/supabase/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const [zonasRes, productosRes] = await Promise.all([
    adminClient().from("presupuestos_zona").select("*").order("id", { ascending: true }),
    adminClient().from("presupuestos_producto").select("*").order("id", { ascending: true }),
  ]);

  if (zonasRes.error) return supabaseError(zonasRes.error);
  if (productosRes.error) return supabaseError(productosRes.error);

  const zonas = zonasRes.data.map((z) => ({
    zona: z.zona,
    producto: z.producto,
    enero: numberValue(z.enero),
    febrero: numberValue(z.febrero),
    marzo: numberValue(z.marzo),
    abril: numberValue(z.abril),
    mayo: numberValue(z.mayo),
  }));

  const productos = productosRes.data.map((p) => ({
    producto: p.producto,
    presupuesto: numberValue(p.presupuesto),
    real: numberValue(p.real),
    avance: numberValue(p.avance),
  }));

  return NextResponse.json({ zonas, productos });
}
