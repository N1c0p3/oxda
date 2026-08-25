#!/usr/bin/env python3
"""
Extractor robusto de INVENTARIOS OXDA AGOSTO 2026..xlsx.

- Hoja "Resumen Inventario": lee cada sección mensual y toma la columna de
  cobertura/último número por posición fija (última columna del encabezado).
- Hojas de almacén: toma la última columna explícita de inventario no posterior
  al corte configurado. Si una bodega todavía no trae agosto, conserva el
  último cierre anterior y deja documentado el periodo realmente utilizado.
"""
import json
import re
import unicodedata
from pathlib import Path
from typing import List, Dict, Any, Optional

try:
    from openpyxl import load_workbook
except ImportError as exc:  # pragma: no cover
    raise SystemExit("openpyxl no está instalado. Ejecuta: pip3 install openpyxl") from exc

XLSX_PATH = Path("INVENTARIOS OXDA AGOSTO 2026..xlsx")
OUTPUT_JSON = Path("inventario_xlsx_extraido.json")
OUTPUT_TS = Path("inventario_xlsx_extraido.ts")
CUT_OFF_MONTH = 8
CUT_OFF_YEAR = 2026

MONTH_NUMBER = {
    "enero": 1, "febrero": 2, "marzo": 3, "abril": 4,
    "mayo": 5, "junio": 6, "julio": 7, "agosto": 8,
    "septiembre": 9, "octubre": 10, "noviembre": 11, "diciembre": 12,
}


def normalize_text(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip().lower()


def ascii_text(value: Any) -> str:
    return "".join(
        char for char in unicodedata.normalize("NFD", normalize_text(value))
        if unicodedata.category(char) != "Mn"
    )


def parse_number(value: Any) -> Optional[float]:
    if value is None:
        return None
    text = str(value).strip()
    if text == "":
        return None
    text = text.replace("$", "").replace("%", "").replace(",", "")
    text = re.sub(r"[\s\u00a0]+", "", text)
    text = text.replace("- ", "-")
    if text in ("", "-", "#div/0!", "#n/a", "#ref!", "#value!", "#name?", "#null!", "#num!", "#ref"):
        return None
    try:
        return float(text)
    except ValueError:
        return None


def find_column_by_header(ws, candidates: List[str], threshold: int = 4) -> Optional[int]:
    """Busca una columna cuyo encabezado (fila 1 o 2) coincida con algún candidato."""
    for row in (1, 2):
        for col in range(1, ws.max_column + 1):
            cell = normalize_text(ws.cell(row=row, column=col).value)
            for cand in candidates:
                if cand in cell or cell in cand:
                    return col
                # distancia Levenshtein simple para tolerar typos
                if levenshtein(cell, cand) <= threshold:
                    return col
    return None


def levenshtein(a: str, b: str) -> int:
    if a == b:
        return 0
    if len(a) < len(b):
        a, b = b, a
    if not b:
        return len(a)
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        curr = [i]
        for j, cb in enumerate(b, 1):
            curr.append(min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + (ca != cb)))
        prev = curr
    return prev[-1]


# ═══════════════════════════════════════════════════════════════════════════
# 1. RESUMEN INVENTARIO (secciones mensuales por cliente)
# ═══════════════════════════════════════════════════════════════════════════

def is_month_title_row(row: List[Any]) -> bool:
    for cell in row:
        if re.search(r"(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s*\.\s*\d{4}", normalize_text(cell)):
            return True
    return False


def extract_month_label(row: List[Any]) -> str:
    for cell in row:
        match = re.search(r"(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s*\.\s*(\d{4})", normalize_text(cell))
        if match:
            month = match.group(1).capitalize()
            year = match.group(2)
            return f"{month} {year}"
    return "Sin mes"


def is_header_row(row: List[Any]) -> bool:
    return any("cliente" in normalize_text(cell) and "bodega" in normalize_text(cell) for cell in row)


def is_total_row(row: List[Any]) -> bool:
    return any("importe total" in normalize_text(cell) for cell in row)


def is_client_row(row: List[Any]) -> bool:
    first = row[0] if row else None
    if first is None or str(first).strip() == "":
        return False
    text = normalize_text(first)
    if "cliente" in text or "importe total" in text:
        return False
    return True


def read_resumen_inventario(ws) -> List[Dict[str, Any]]:
    rows = []
    for r in range(1, ws.max_row + 1):
        rows.append([ws.cell(row=r, column=c).value for c in range(1, ws.max_column + 1)])

    sections: List[Dict[str, Any]] = []
    current: Optional[Dict[str, Any]] = None
    header_indices: Dict[str, Optional[int]] = {}

    i = 0
    while i < len(rows):
        row = rows[i]
        if is_month_title_row(row):
            if current:
                sections.append(current)
            current = {"mes": extract_month_label(row), "clientes": [], "total": {}, "header_len": 0}
            header_indices = {}
            i += 1
            continue

        if current is None:
            i += 1
            continue

        if is_header_row(row):
            header_indices = {
                "cliente": 0,
                "valor_inventario": find_header_index(row, ["valo invent", "valo inventario", "valor inventario"]),
                "cajas_inventario": find_header_index(row, ["cajas invent", "cajas en inventario"]),
                "costo_promedio": find_header_index(row, ["costo prom", "costo promedio"]),
                "ventas_cajas_mes": find_header_index(row, ["vta cajas mes", "venta de cajas del mes"]),
                "llegadas": find_header_index(row, ["llegadas"]),
                "ventas_estimadas": find_header_index(row, ["ventas estimadas"]),
                "inv_mas_llegadas": find_header_index(row, ["inv actual + llegadas"]),
                "inv_menos_ventas": find_header_index(row, ["inv - ventas estimadas"]),
                "cobertura": find_header_index(row, ["cobertura"]),
            }
            if header_indices["cobertura"] is None and len(row) > 1:
                # En este libro Cobertura no tiene rótulo; está inmediatamente
                # después de "Inv - ventas estimadas".
                prior = header_indices["inv_menos_ventas"]
                header_indices["cobertura"] = prior + 1 if prior is not None else len(row) - 1
            current["header_len"] = len(row)
            i += 1
            continue

        if is_total_row(row):
            current["total"] = read_record(row, header_indices, current["header_len"])
            i += 1
            continue

        if is_client_row(row):
            rec = read_record(row, header_indices, current["header_len"])
            rec["cliente"] = str(row[0]).strip()
            current["clientes"].append(rec)
            i += 1
            continue

        i += 1

    if current:
        sections.append(current)
    return sections


def find_header_index(row: List[Any], candidates: List[str]) -> Optional[int]:
    """Busca el índice de columna cuyo encabezado contenga el candidato."""
    for idx, cell in enumerate(row):
        text = normalize_text(cell)
        if not text:
            continue
        for cand in candidates:
            if not cand:
                continue
            if cand in text or levenshtein(text, cand) <= 3:
                return idx
    return None


def read_record(row: List[Any], indices: Dict[str, Optional[int]], header_len: int) -> Dict[str, Any]:
    def get(key: str, default_idx: int):
        idx = indices.get(key)
        if idx is None and header_len > 0:
            idx = default_idx
        if idx is not None and idx < len(row):
            return parse_number(row[idx])
        return None

    return {
        "valor_inventario": get("valor_inventario", 1),
        "cajas_inventario": get("cajas_inventario", 2),
        "costo_promedio": get("costo_promedio", 3),
        "ventas_cajas_mes": get("ventas_cajas_mes", 4),
        "llegadas": get("llegadas", 6),
        "ventas_estimadas": get("ventas_estimadas", 7),
        "inv_mas_llegadas": get("inv_mas_llegadas", 8),
        "inv_menos_ventas": get("inv_menos_ventas", 9),
        "cobertura": get("cobertura", header_len - 1) if header_len > 0 else None,
        "ultimo_numero": get("cobertura", header_len - 1) if header_len > 0 else None,
    }


# ═══════════════════════════════════════════════════════════════════════════
# 2. HOJAS DE ALMACÉN — inventario al corte configurado
# ═══════════════════════════════════════════════════════════════════════════

def inventory_period(value: Any) -> Optional[tuple[int, int]]:
    text = ascii_text(value)
    if "inv" not in text:
        return None
    month = next((number for name, number in MONTH_NUMBER.items() if name in text), None)
    year_match = re.search(r"20\d{2}", text)
    if month is None or year_match is None:
        return None
    return int(year_match.group()), month


def find_inventory_column(ws) -> tuple[Optional[int], Optional[str]]:
    candidates: List[tuple[int, int, int, str]] = []
    for row in range(1, min(6, ws.max_row + 1)):
        for col in range(1, ws.max_column + 1):
            value = ws.cell(row=row, column=col).value
            period = inventory_period(value)
            if period is None:
                continue
            year, month = period
            if (year, month) <= (CUT_OFF_YEAR, CUT_OFF_MONTH):
                candidates.append((year, month, col, str(value).strip()))
    if not candidates:
        return None, None
    # El libro contiene bloques duplicados; la aparición más a la derecha es
    # la revisión más reciente del mismo periodo.
    year, month, col, label = max(candidates, key=lambda item: (item[0], item[1], item[2]))
    return col, f"{year}-{month:02d} ({label})"

def read_almacen_sheet(ws, sheet_name: str) -> Dict[str, Any]:
    """
    Busca CÓDIGO, DESCRIPCIÓN y el cierre más reciente no posterior al corte.
    """
    col_codigo: Optional[int] = None
    col_descripcion: Optional[int] = None
    header_row: int = 1

    for r in range(1, min(6, ws.max_row + 1)):
        for c in range(1, ws.max_column + 1):
            cell = ws.cell(row=r, column=c).value
            text = normalize_text(cell)
            if not text:
                continue
            if col_codigo is None and ("código" in text or "codigo" in text or text == "code"):
                col_codigo = c
                header_row = r
            if col_descripcion is None and ("descripción" in text or "descripcion" in text or "descrip" in text):
                col_descripcion = c
                header_row = r
    col_inventario, periodo_inventario = find_inventory_column(ws)

    productos = []
    if col_codigo is None:
        return {
            "hoja": sheet_name,
            "columna_codigo": col_codigo,
            "columna_descripcion": col_descripcion,
            "columna_inventario": col_inventario,
            "periodo_inventario": periodo_inventario,
            "productos": productos,
        }

    for r in range(header_row + 1, ws.max_row + 1):
        codigo = ws.cell(row=r, column=col_codigo).value
        if codigo is None or str(codigo).strip() == "":
            continue
        descripcion = ws.cell(row=r, column=col_descripcion).value if col_descripcion else None
        inventario = parse_number(ws.cell(row=r, column=col_inventario).value) if col_inventario else None
        productos.append({
            "codigo": str(codigo).strip(),
            "descripcion": str(descripcion).strip() if descripcion else "",
            "inventario": inventario,
            "periodo_inventario": periodo_inventario,
            "columna_inventario": col_inventario,
        })

    return {
        "hoja": sheet_name,
        "columna_codigo": col_codigo,
        "columna_descripcion": col_descripcion,
        "columna_inventario": col_inventario,
        "periodo_inventario": periodo_inventario,
        "productos": productos,
    }


def read_leon_summary(ws) -> Dict[str, Dict[str, Any]]:
    header_columns: Dict[str, int] = {}
    header_row = 0
    for row in range(1, ws.max_row + 1):
        values = {ascii_text(ws.cell(row=row, column=col).value): col for col in range(1, ws.max_column + 1)}
        if "codigo" in values and "descripcion" in values and "bajo cero" in values and "vulpes" in values and "frisacel guardamex" in values:
            header_columns = values
            header_row = row
            break

    targets = {
        "BAJO CERO": "bajo cero",
        "VULPES PAPAS": "vulpes",
        "BAJIO": "frisacel guardamex",
    }
    result = {
        sheet: {
            "hoja": sheet,
            "columna_codigo": header_columns.get("codigo"),
            "columna_descripcion": header_columns.get("descripcion"),
            "columna_inventario": header_columns.get(source),
            "periodo_inventario": f"{CUT_OFF_YEAR}-{CUT_OFF_MONTH:02d} (RESUMEN LEÓN)",
            "productos": [],
        }
        for sheet, source in targets.items()
    }
    if not header_columns:
        return result

    for row in range(header_row + 1, ws.max_row + 1):
        code = ws.cell(row=row, column=header_columns["codigo"]).value
        if code is None or ascii_text(code) == "codigo":
            continue
        description = ws.cell(row=row, column=header_columns["descripcion"]).value
        for sheet, source in targets.items():
            column = header_columns[source]
            result[sheet]["productos"].append({
                "codigo": str(code).strip(),
                "descripcion": str(description).strip() if description else "",
                "inventario": parse_number(ws.cell(row=row, column=column).value),
                "periodo_inventario": result[sheet]["periodo_inventario"],
                "columna_inventario": column,
            })
    return result


# ═══════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════

def determine_status(cobertura: Optional[float], ventas_estimadas: Optional[float]) -> str:
    if ventas_estimadas is not None and ventas_estimadas == 0:
        return "sin movimiento"
    if cobertura is None:
        return "sin movimiento"
    if cobertura < 1.5:
        return "alerta"
    if cobertura > 3:
        return "exceso"
    return "optimo"


def build_cliente_ts(c: Dict[str, Any]) -> str:
    cobertura = c.get("cobertura")
    ventas_est = c.get("ventas_estimadas")
    status = determine_status(cobertura, ventas_est)
    return (
        "    { "
        f"cliente: {json.dumps(c['cliente'], ensure_ascii=False)}, "
        f"valorInventario: {round(c.get('valor_inventario') or 0)}, "
        f"cajasInventario: {round(c.get('cajas_inventario') or 0)}, "
        f"costoPromedio: {round(c.get('costo_promedio') or 0)}, "
        f"ventasCajasMes: {round(c.get('ventas_cajas_mes') or 0)}, "
        f"llegadas: {round(c.get('llegadas') or 0)}, "
        f"ventasEstimadas: {round(c.get('ventas_estimadas') or 0)}, "
        f"invMasLlegadas: {round((c.get('inv_mas_llegadas') or 0) * 100) / 100}, "
        f"invMenosVentas: {round((c.get('inv_menos_ventas') or 0) * 100) / 100}, "
        f"cobertura: {cobertura if cobertura is not None else 0}, "
        f"status: {json.dumps(status)} "
        "},"
    )


def build_report_typescript(data: Dict[str, Any], meses_filtro: Optional[List[str]] = None) -> str:
    """
    Genera el módulo TS con los arreglos para el reporte.
    Si se pasan meses_filtro (en español, ej. ['enero', 'mayo']), solo incluye esos meses.
    """
    resumen = data.get("resumen_mensual", [])

    if meses_filtro:
        meses_norm = [m.lower()[:3] for m in meses_filtro]
        resumen = [s for s in resumen if s["mes"].split()[0].lower()[:3] in meses_norm]

    # Arreglo con todos los meses disponibles
    por_mes_lines = []
    for sec in resumen:
        clientes = "\n".join(build_cliente_ts(c) for c in sec["clientes"])
        por_mes_lines.append(
            f"  {{\n"
            f"    mes: {json.dumps(sec['mes'], ensure_ascii=False)},\n"
            f"    clientes: [\n{clientes}\n    ]\n"
            f"  }},"
        )

    # Alias del último resumen disponible para compatibilidad.
    latest = resumen[-1] if resumen else None
    latest_block = ""
    if latest:
        clientes = "\n".join(build_cliente_ts(c) for c in latest["clientes"])
        latest_block = (
            "export const inventarioUltimoCorte = [\n"
            + clientes
            + "\n];\n\n"
        )

    # Histórico mensual
    historico_lines = []
    meses_cortos = {
        "Diciembre": "Dic", "Enero": "Ene", "Febrero": "Feb", "Marzo": "Mar",
        "Abril": "Abr", "Mayo": "May", "Junio": "Jun", "Julio": "Jul",
        "Agosto": "Ago", "Septiembre": "Sep", "Octubre": "Oct", "Noviembre": "Nov",
    }
    for sec in resumen:
        total = sec.get("total", {})
        mes = sec["mes"].split()[0]
        corto = meses_cortos.get(mes, mes)
        anio = sec["mes"].split()[1]
        historico_lines.append(
            f"  {{ mes: \"{corto} {anio[-2:]}\", valor: {round(total.get('valor_inventario') or 0)}, cajas: {round(total.get('cajas_inventario') or 0)} }},"
        )

    return (
        latest_block
        + "export const inventarioPorMes = [\n"
        + "\n".join(por_mes_lines)
        + "\n];\n\n"
        + "export const historicoMensual = [\n"
        + "\n".join(historico_lines)
        + "\n];\n"
    )


def parse_args() -> Any:
    import argparse
    parser = argparse.ArgumentParser(
        description="Extrae datos de INVENTARIOS OXDA AGOSTO 2026..xlsx"
    )
    parser.add_argument(
        "--mes",
        action="append",
        help="Mes a extraer (puede repetirse). Ej: --mes enero --mes mayo. Por defecto extrae todos.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    meses_filtro: Optional[List[str]] = args.mes

    if not XLSX_PATH.exists():
        print(f"No se encontró {XLSX_PATH}")
        return

    wb = load_workbook(XLSX_PATH, data_only=True)

    resumen = []
    if "Resumen Inventario" in wb.sheetnames:
        resumen = read_resumen_inventario(wb["Resumen Inventario"])

    leon_summary = read_leon_summary(wb["RESUMEN LEÓN"]) if "RESUMEN LEÓN" in wb.sheetnames else {}
    almacenes = []
    for name in wb.sheetnames:
        if name in ("Resumen Inventario", "$$$$$", "Resumen Ventas", "Resumen T.C.", "RESUMEN LEÓN"):
            continue
        almacenes.append(leon_summary.get(name) or read_almacen_sheet(wb[name], name))

    data = {
        "archivo": str(XLSX_PATH),
        "fecha_corte": f"{CUT_OFF_YEAR}-{CUT_OFF_MONTH:02d}-31",
        "resumen_mensual": resumen,
        "almacenes": almacenes,
    }

    OUTPUT_JSON.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    OUTPUT_TS.write_text("export const inventarioXlsx = " + json.dumps(data, indent=2, ensure_ascii=False) + ";", encoding="utf-8")

    report_ts = Path("lib/inventario-data.ts")
    report_ts.write_text(build_report_typescript(data, meses_filtro=meses_filtro), encoding="utf-8")

    print(f"Resumen Inventario: {len(resumen)} secciones")
    for sec in resumen:
        print(f"\n{sec['mes']} ({len(sec['clientes'])} clientes)")
        for c in sec["clientes"]:
            print(f"  - {c['cliente']:<45} ultimo={c['ultimo_numero']} cobertura={c['cobertura']}")

    print(f"\nAlmacenes procesados: {len(almacenes)}")
    for alm in almacenes:
        col_label = alm['columna_inventario'] if alm['columna_inventario'] is not None else "N/A"
        print(f"  - {alm['hoja']:<25} col_inventario={col_label:<3} periodo={alm['periodo_inventario']} productos={len(alm['productos'])}")
        if alm["productos"]:
            for p in alm["productos"][:3]:
                print(f"      {p['codigo']:<10} {p['descripcion'][:30]:<33} inventario={p['inventario']}")

    print(f"\nArchivos generados:")
    print(f"  - {OUTPUT_JSON}")
    print(f"  - {OUTPUT_TS}")
    print(f"  - {report_ts}")


if __name__ == "__main__":
    main()
