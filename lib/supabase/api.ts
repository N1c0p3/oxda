import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export function numberValue(value: unknown) {
  return Number(value ?? 0);
}

export function dateValue(value: unknown) {
  return value ? String(value) : undefined;
}

export function supabaseError(error: { message: string; code?: string } | null) {
  return NextResponse.json(
    { error: error?.message ?? "Error de base de datos" },
    { status: error?.code === "PGRST116" ? 404 : 500 },
  );
}

export function adminClient() {
  return getSupabaseAdmin();
}
