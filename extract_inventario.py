#!/usr/bin/env python3
"""
Extractor robusto de INVENTARIOS-OXDA-MAYO-2026..csv

Objetivo: detectar cada sección mensual (hoja) por su fila de título,
identificar la fila de encabezado por posición y extraer el último valor
numérico de cada fila de cliente (normalmente la columna de cobertura).

También exporta todos los campos numéricos disponibles por cliente/mes.
"""
import csv
import json
import re
from pathlib import Path
from typing import List, Dict, Any, Optional

CSV_PATH = Path("INVENTARIOS-OXDA-MAYO-2026..csv")
OUTPUT_JSON = Path("inventario_extraido.json")
OUTPUT_TS = Path("inventario_extraido.ts")


def normalize_text(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip().lower().replace("  ", " ")


def parse_number(value: Any) -> Optional[float]:
    """Convierte un valor mexicano/CSV a float; devuelve None si no es número."""
    if value is None:
        return None
    text = str(value).strip()
    if text == "":
        return None

    # Casos especiales como "- 828", "#DIV/0!"
    text = text.replace("$", "").replace("%", "")
    text = re.sub(r"[\s\u00a0]+", "", text)  # quitar espacios no separables
    text = text.replace(",", "")  # miles
    text = text.replace("- ", "-")  # signos negativos espaciados

    if text in ("", "-", "#div/0!", "#n/a", "#ref!", "#value!", "#name?", "#null!", "#num!"):
        return None

    try:
        return float(text)
    except ValueError:
        return None


def is_month_title(row: List[str]) -> bool:
    """Detecta filas como: '', 'DICIEMBRE  . 2025', '', ..."""
    for cell in row:
        if re.search(r"(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s*\.\s*\d{4}", normalize_text(cell)):
            return True
    return False


def extract_month_label(row: List[str]) -> str:
    for cell in row:
        match = re.search(r"(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s*\.\s*(\d{4})", normalize_text(cell))
        if match:
            month = match.group(1).capitalize()
            year = match.group(2)
            return f"{month} {year}"
    return "Sin mes"


def is_header_row(row: List[str]) -> bool:
    """La fila de encabezado contiene 'Cliente / Bodega'."""
    return any("cliente" in normalize_text(cell) and "bodega" in normalize_text(cell) for cell in row)


def is_total_row(row: List[str]) -> bool:
    return any("importe total" in normalize_text(cell) for cell in row)


def is_client_row(row: List[str]) -> bool:
    first = row[0] if row else ""
    if not first or not first.strip():
        return False
    text = normalize_text(first)
    if "cliente" in text or "importe total" in text or "bodega" in text and len(text) < 20:
        return False
    return True


def find_last_numeric(row: List[str], header_len: int) -> Optional[float]:
    """
    Lee el valor de la columna fija por posición: la última columna definida
    en el encabezado (índice header_len - 1). Esto evita que columnas vacías
    intermedias desvíen el resultado y asegura que siempre se lea la misma
    columna de cobertura / INV MAYO en todas las hojas.
    """
    if header_len <= 0:
        return None
    idx = header_len - 1
    # Algunas filas pueden tener menos celdas que el encabezado; en ese caso
    # usamos el ancho real de la fila pero nunca nos movemos a la izquierda
    # buscando un número.
    if idx < len(row):
        return parse_number(row[idx])
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


def find_column_index(row: List[str], candidates: List[str], threshold: int = 3) -> Optional[int]:
    """Encuentra la columna más cercana a alguno de los candidatos por distancia de Levenshtein."""
    best_idx = None
    best_score = float("inf")
    for idx, cell in enumerate(row):
        text = normalize_text(cell)
        for cand in candidates:
            score = levenshtein(text, cand)
            if score < best_score and score <= threshold:
                best_score = score
                best_idx = idx
    return best_idx


def parse_csv() -> List[Dict[str, Any]]:
    raw_text = CSV_PATH.read_text(encoding="utf-8-sig")
    reader = csv.reader(raw_text.splitlines())
    rows = list(reader)

    sections: List[Dict[str, Any]] = []
    current_section: Optional[Dict[str, Any]] = None
    header_indices: Dict[str, Optional[int]] = {}

    i = 0
    while i < len(rows):
        row = rows[i]
        if is_month_title(row):
            # Cierra sección anterior
            if current_section:
                sections.append(current_section)
            current_section = {
                "mes": extract_month_label(row),
                "clientes": [],
                "total": {},
                "header_len": 0,
            }
            header_indices = {}
            i += 1
            continue

        if current_section is None:
            i += 1
            continue

        if is_header_row(row):
            # Guardar índices de columnas por posición, tolerando variantes de nombre
            header_indices = {
                "cliente": 0,  # siempre primera columna en estas hojas
                "valor_inventario": find_column_index(row, ["valo invent", "valo inventario", "valor inventario"]),
                "cajas_inventario": find_column_index(row, ["cajas invent", "cajas en inventario"]),
                "costo_promedio": find_column_index(row, ["costo prom", "costo promedio"]),
                "ventas_cajas_mes": find_column_index(row, ["vta cajas mes", "venta de cajas del mes"]),
                "llegadas": find_column_index(row, ["llegadas"]),
                "ventas_estimadas": find_column_index(row, ["ventas estimadas"]),
                "inv_mas_llegadas": find_column_index(row, ["inv actual + llegadas", "inv actual + llegadas"]),
                "inv_menos_ventas": find_column_index(row, ["inv - ventas estimadas", "inv - ventas estimadas"]),
                "cobertura": find_column_index(row, ["cobertura"]),
            }
            # Si no se encontró una columna cobertura, asumir la última columna del encabezado
            # por posición (INV MAYO / cobertura suele estar al final sin nombre de columna).
            if header_indices["cobertura"] is None and len(row) > 1:
                header_indices["cobertura"] = len(row) - 1
            current_section["header_len"] = len(row)
            i += 1
            continue

        if is_total_row(row):
            current_section["total"] = {
                "valor_inventario": parse_number(row[header_indices.get("valor_inventario", 1)]) if header_indices.get("valor_inventario") is not None else None,
                "cajas_inventario": parse_number(row[header_indices.get("cajas_inventario", 2)]) if header_indices.get("cajas_inventario") is not None else None,
                "costo_promedio": parse_number(row[header_indices.get("costo_promedio", 3)]) if header_indices.get("costo_promedio") is not None else None,
                "ventas_cajas_mes": parse_number(row[header_indices.get("ventas_cajas_mes", 4)]) if header_indices.get("ventas_cajas_mes") is not None else None,
                "llegadas": parse_number(row[header_indices.get("llegadas", 6)]) if header_indices.get("llegadas") is not None else None,
                "ventas_estimadas": parse_number(row[header_indices.get("ventas_estimadas", 7)]) if header_indices.get("ventas_estimadas") is not None else None,
                "inv_mas_llegadas": parse_number(row[header_indices.get("inv_mas_llegadas", 8)]) if header_indices.get("inv_mas_llegadas") is not None else None,
                "inv_menos_ventas": parse_number(row[header_indices.get("inv_menos_ventas", 9)]) if header_indices.get("inv_menos_ventas") is not None else None,
                "cobertura": parse_number(row[header_indices.get("cobertura", current_section["header_len"] - 1)]) if header_indices.get("cobertura") is not None and current_section["header_len"] > 0 else None,
                "ultimo_numero": find_last_numeric(row, current_section["header_len"]),
            }
            i += 1
            continue

        if is_client_row(row):
            record = {
                "cliente": row[0].strip(),
                "valor_inventario": parse_number(row[header_indices.get("valor_inventario", 1)]) if header_indices.get("valor_inventario") is not None else None,
                "cajas_inventario": parse_number(row[header_indices.get("cajas_inventario", 2)]) if header_indices.get("cajas_inventario") is not None else None,
                "costo_promedio": parse_number(row[header_indices.get("costo_promedio", 3)]) if header_indices.get("costo_promedio") is not None else None,
                "ventas_cajas_mes": parse_number(row[header_indices.get("ventas_cajas_mes", 4)]) if header_indices.get("ventas_cajas_mes") is not None else None,
                "llegadas": parse_number(row[header_indices.get("llegadas", 6)]) if header_indices.get("llegadas") is not None else None,
                "ventas_estimadas": parse_number(row[header_indices.get("ventas_estimadas", 7)]) if header_indices.get("ventas_estimadas") is not None else None,
                "inv_mas_llegadas": parse_number(row[header_indices.get("inv_mas_llegadas", 8)]) if header_indices.get("inv_mas_llegadas") is not None else None,
                "inv_menos_ventas": parse_number(row[header_indices.get("inv_menos_ventas", 9)]) if header_indices.get("inv_menos_ventas") is not None else None,
                "cobertura": parse_number(row[header_indices.get("cobertura", current_section["header_len"] - 1)]) if header_indices.get("cobertura") is not None and current_section["header_len"] > 0 else None,
                "ultimo_numero": find_last_numeric(row, current_section["header_len"]),
            }
            current_section["clientes"].append(record)
            i += 1
            continue

        i += 1

    if current_section:
        sections.append(current_section)

    return sections


def to_typescript_array(data: List[Dict[str, Any]]) -> str:
    lines = ["export const inventarioPorMes = ", json.dumps(data, indent=2, ensure_ascii=False), ";"]
    return "".join(lines)


def main() -> None:
    if not CSV_PATH.exists():
        print(f"No se encontró {CSV_PATH}")
        return

    data = parse_csv()
    OUTPUT_JSON.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    OUTPUT_TS.write_text(to_typescript_array(data), encoding="utf-8")

    print(f"Secciones detectadas: {len(data)}")
    for section in data:
        print(f"\n{section['mes']}: {len(section['clientes'])} clientes")
        for c in section["clientes"]:
            print(f"  - {c['cliente']:<45} ultimo_numero={c['ultimo_numero']} cobertura={c['cobertura']}")

    print(f"\nArchivos generados:")
    print(f"  - {OUTPUT_JSON}")
    print(f"  - {OUTPUT_TS}")


if __name__ == "__main__":
    main()
