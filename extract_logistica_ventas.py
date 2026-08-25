#!/usr/bin/env python3
"""
Extrae métricas de logística (2022 Ventas Proyeccion..xlsx), el histórico
completo de ventas 2025, el corte 2026 y el inventario físico de julio.
Genera archivos JSON en public/data/ para consumo del frontend.
"""
import json
import math
from collections import defaultdict
from datetime import datetime, timedelta
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).parent
OUT_DIR = ROOT / "public" / "data"
OUT_DIR.mkdir(parents=True, exist_ok=True)

FILE_2022 = ROOT / "2022 Ventas Proyeccion..xlsx"
FILE_2025 = ROOT / "2025 Reporte de Ventas Oxda-Vulpes al 31.12.2025..xlsx"
FILE_2026 = ROOT / "2026 Reporte de Ventas Oxda al 24.06.2026.xlsx"
FILE_INVENTORY = ROOT / "inventario_xlsx_extraido.json"

MESES_ORD = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
]
MONTH_BY_NUMBER = {index: month for index, month in enumerate(MESES_ORD, start=1)}

INVENTORY_SHEET_BY_SALES_WAREHOUSE = {
    "CANCUN": "CANCÚN",
    "FRIGARSA-COVENTINA": "FRIGARSA",
    "MEXIDELI - CDMX": "MEXIDELI",
    "ESTADO DE MÉXICO": "FRESCO",
    "CANBELT": "CANBELT",
    "FRIJALISCO - GDL": "FRIJALISCO",
    "VLPLEÓN VULPES": "VULPES PAPAS",
    "BAJO CERO - LEÓN.": "BAJO CERO",
    "KAIDA": "BAJIO",
    "GUARDAMEX": "BAJIO",
    "FRISACEL": "BAJIO",
}


def to_date(v):
    if pd.isna(v):
        return None
    if isinstance(v, datetime):
        return v.date().isoformat()
    if isinstance(v, str):
        try:
            return pd.to_datetime(v, dayfirst=True).date().isoformat()
        except Exception:
            return None
    return None


def days_between(a, b):
    if a is None or b is None:
        return None
    try:
        da = datetime.fromisoformat(a).date()
        db = datetime.fromisoformat(b).date()
        return (db - da).days
    except Exception:
        return None


def mean(values):
    vals = [v for v in values if v is not None and not math.isnan(v)]
    return round(sum(vals) / len(vals), 2) if vals else 0


def median(values):
    vals = sorted([v for v in values if v is not None and not math.isnan(v)])
    n = len(vals)
    if n == 0:
        return 0
    if n % 2:
        return round(vals[n // 2], 2)
    return round((vals[n // 2 - 1] + vals[n // 2]) / 2, 2)


def clean_str(v):
    if pd.isna(v):
        return None
    s = str(v).strip()
    return s if s else None


# ------------------------- LOGÍSTICA -------------------------

def extract_logistics():
    print("Leyendo logística...")
    df = pd.read_excel(FILE_2022, sheet_name="Contenedores", header=None)

    # La cabecera real está en la fila 6 (0-based)
    header = df.iloc[6].tolist()
    data = df.iloc[7:].copy()
    data.columns = header

    records = []
    for _, row in data.iterrows():
        puerto = clean_str(row.get("Puerto"))
        pedido = to_date(row.get("Fech  pedido"))
        fact = to_date(row.get("Fech Fact"))
        total = row.get("Total fact ")
        etd = to_date(row.get(" ETD"))
        eta = to_date(row.get("ETA"))
        cont = clean_str(row.get("# Cont"))
        cliente = clean_str(row.get("Clte"))
        status = clean_str(row.get("Estatus"))
        factura = clean_str(row.get("Factura"))
        entrega = to_date(row.get("Entrega"))
        venc = to_date(row.get("Vencim Fact"))
        pago = to_date(row.get("Pago"))

        if not any([pedido, etd, eta, cont]):
            continue

        # Normalizar nombres sucios
        if puerto:
            puerto = puerto.strip().upper()
            if puerto in ("PUERTO", "CLTE") or len(puerto) <= 2:
                puerto = None
            elif puerto.startswith("PROGRESO"):
                puerto = "Progreso"
        if cliente:
            cliente = cliente.strip()
            if cliente.upper() in ("CLTE", "POR DEFINIR") or not cliente:
                cliente = None

        rec = {
            "puerto": puerto,
            "pedido": pedido,
            "facturaFecha": fact,
            "totalFact": float(total) if pd.notna(total) and isinstance(total, (int, float)) else (float(total.replace(",", "")) if pd.notna(total) and str(total).replace(",", "").replace(".", "").isdigit() else None),
            "etd": etd,
            "eta": eta,
            "pedidoNum": clean_str(row.get("Pedido")),
            "contenedor": cont,
            "cliente": cliente,
            "estatus": status,
            "factura": factura,
            "entrega": entrega,
            "vencimiento": venc,
            "pago": pago,
            "leadOrderToEtdDays": days_between(pedido, etd),
            "leadTransitDays": days_between(etd, eta),
            "leadEtaToWarehouseDays": days_between(eta, entrega),
            "leadTotalDays": days_between(pedido, entrega),
        }
        records.append(rec)

    # Métricas agregadas
    puertos = defaultdict(list)
    clientes = defaultdict(list)
    totales = {
        "transitDays": [],
        "orderToEtdDays": [],
        "etaToWarehouseDays": [],
        "totalDays": [],
    }

    for r in records:
        if r["leadTransitDays"] is not None:
            totales["transitDays"].append(r["leadTransitDays"])
        if r["leadOrderToEtdDays"] is not None:
            totales["orderToEtdDays"].append(r["leadOrderToEtdDays"])
        if r["leadEtaToWarehouseDays"] is not None:
            totales["etaToWarehouseDays"].append(r["leadEtaToWarehouseDays"])
        if r["leadTotalDays"] is not None:
            totales["totalDays"].append(r["leadTotalDays"])
        if r["puerto"]:
            puertos[r["puerto"]].append(r["leadTotalDays"])
        if r["cliente"]:
            clientes[r["cliente"]].append(r["leadTotalDays"])

    metrics = {
        "totalContenedores": len(records),
        "leadTimesGlobal": {
            "orderToEtd": {"avg": mean(totales["orderToEtdDays"]), "median": median(totales["orderToEtdDays"])},
            "transit": {"avg": mean(totales["transitDays"]), "median": median(totales["transitDays"])},
            "etaToWarehouse": {"avg": mean(totales["etaToWarehouseDays"]), "median": median(totales["etaToWarehouseDays"])},
            "totalOrderToWarehouse": {"avg": mean(totales["totalDays"]), "median": median(totales["totalDays"])},
        },
        "leadTimesByPort": {
            p: {"avg": mean(v), "median": median(v), "count": len([x for x in v if x is not None])}
            for p, v in puertos.items()
        },
        "leadTimesByClient": {
            c: {"avg": mean(v), "median": median(v), "count": len([x for x in v if x is not None])}
            for c, v in clientes.items()
        },
    }

    # Proveedores: Aviko / Wernisng control
    suppliers = []
    for sheet, supplier in [("Aviko Control", "Aviko"), ("Wernisng Control", "Wernsing")]:
        try:
            sdf = pd.read_excel(FILE_2022, sheet_name=sheet, header=None)
            header_s = sdf.iloc[1].tolist()
            sdata = sdf.iloc[2:].copy()
            sdata.columns = header_s
            for _, row in sdata.iterrows():
                cont = clean_str(row.get("# contenedor") if "# contenedor" in sdata.columns else row.get("# contenedor "))
                if not cont:
                    continue
                suppliers.append({
                    "supplier": supplier,
                    "contenedor": cont,
                    "pedido": to_date(row.get("fecha pedido") if "fecha pedido" in sdata.columns else None),
                    "proforma": to_date(row.get("Fecha Proforma") if "Fecha Proforma" in sdata.columns else None),
                    "factura": to_date(row.get("fecha fact -2") if "fecha fact -2" in sdata.columns else row.get("fecha fact")),
                    "etd": to_date(row.get("ETD")),
                    "eta": to_date(row.get("ETA puerto") if "ETA puerto" in sdata.columns else row.get("ETA")),
                    "valor": float(row.get("valor")) if pd.notna(row.get("valor")) else None,
                })
        except Exception as e:
            print(f"  ⚠️  omitiendo {sheet}: {e}")

    return {"containers": records, "metrics": metrics, "supplierControls": suppliers}


# ------------------------- VENTAS -------------------------

def canonical_code(value):
    if pd.isna(value):
        return ""
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    return str(value).strip().upper()


def normalized_label(value):
    return str(value).strip().upper() if pd.notna(value) else "SIN CLASIFICAR"


def load_sales_file(path):
    df = pd.read_excel(path, sheet_name="Reporte de Venta", header=0)
    df["Fecha"] = pd.to_datetime(df["Fecha"], errors="coerce")
    df = df[df["Fecha"].notna()].copy()
    df["Año"] = df["Fecha"].dt.year.astype(int)
    df["MesNumero"] = df["Fecha"].dt.month.astype(int)
    df["Mes"] = df["MesNumero"].map(MONTH_BY_NUMBER)
    df["Periodo"] = df["Fecha"].dt.strftime("%Y-%m")
    df["Código Fuente"] = df["Código Producto"].map(canonical_code)
    report_code = df["Cod Reporte"].map(canonical_code)
    df["Código Producto"] = report_code.where(report_code != "", df["Código Fuente"])
    df["Nombre (Producto)"] = df["Nombre (Producto)"].fillna("").astype(str).str.strip()
    df["Código Almacén"] = df["Código Almacén"].map(canonical_code)
    df["Nombre (Almacén)"] = df["Nombre (Almacén)"].fillna("").astype(str).str.strip()
    df["DIVISION"] = df["DIVISION"].map(normalized_label)
    df["RUBRO"] = df["RUBRO"].map(normalized_label)
    for column in ("Unidades", "Neto", "Costo total"):
        df[column] = pd.to_numeric(df[column], errors="coerce").fillna(0)
    # El margen corporativo se calcula sobre venta neta en ambos ejercicios.
    df["Margen"] = df["Neto"] - df["Costo total"]
    df["Archivo Fuente"] = path.name
    return df


def extract_sales():
    print("Leyendo ventas históricas 2025 y corte 2026...")
    historical = load_sales_file(FILE_2025)
    current = load_sales_file(FILE_2026)
    all_sales = pd.concat([historical, current], ignore_index=True)
    current_year = int(current["Año"].max())
    current = current[current["Año"] == current_year].copy()
    elapsed_days = max(1, (current["Fecha"].max().date() - datetime(current_year, 1, 1).date()).days + 1)

    current = current.sort_values("Fecha")
    dimensions = ["Año", "Mes", "MesNumero", "Código Producto", "Código Almacén", "Nombre (Almacén)"]
    monthly = current.groupby(dimensions, dropna=False).agg(
        nombreProducto=("Nombre (Producto)", "last"), division=("DIVISION", "last"), rubro=("RUBRO", "last"),
        unidades=("Unidades", "sum"), venta=("Neto", "sum"),
        costo=("Costo total", "sum"), margen=("Margen", "sum"),
    ).reset_index()
    monthly_records = []
    for row in monthly.to_dict(orient="records"):
        monthly_records.append({
            **{key: row[key] for key in dimensions},
            "Nombre (Producto)": row["nombreProducto"],
            "DIVISION": row["division"],
            "RUBRO": row["rubro"],
            "unidades": float(row["unidades"]),
            "venta": float(row["venta"]),
            "costo": float(row["costo"]),
            "margen": float(row["margen"]),
        })

    product_dimensions = ["Código Producto", "Código Almacén", "Nombre (Almacén)"]
    product_warehouse = current.groupby(product_dimensions, dropna=False).agg(
        nombreProducto=("Nombre (Producto)", "last"), division=("DIVISION", "last"), rubro=("RUBRO", "last"),
        unidades=("Unidades", "sum"), venta=("Neto", "sum"),
        costoTotal=("Costo total", "sum"), margen=("Margen", "sum"),
        numTransacciones=("Fecha", "count"),
    ).reset_index()
    pw_records = []
    for _, row in product_warehouse.iterrows():
        pw_records.append({
            "codigoProducto": row["Código Producto"],
            "nombreProducto": row["nombreProducto"],
            "codigoAlmacen": row["Código Almacén"],
            "nombreAlmacen": row["Nombre (Almacén)"],
            "division": row["division"],
            "rubro": row["rubro"],
            "unidades": float(row["unidades"]),
            "venta": float(row["venta"]),
            "costoTotal": float(row["costoTotal"]),
            "margen": float(row["margen"]),
            "promedioDiarioUnidades": round(float(row["unidades"]) / elapsed_days, 2),
            "promedioDiarioVenta": round(float(row["venta"]) / elapsed_days, 2),
            "margenPct": round(float(row["margen"]) / float(row["venta"]) * 100, 2) if row["venta"] else 0,
        })

    monthly_by_product = all_sales.groupby(["Periodo", "Código Producto"], dropna=False).agg(
        unidades=("Unidades", "sum"), venta=("Neto", "sum")
    ).reset_index()
    series = defaultdict(dict)
    for _, row in monthly_by_product.iterrows():
        series[row["Código Producto"]][row["Periodo"]] = {
            "unidades": round(float(row["unidades"]), 4),
            "venta": round(float(row["venta"]), 2),
        }

    product_names = (
        all_sales.sort_values("Fecha").groupby("Código Producto")["Nombre (Producto)"].last().to_dict()
    )
    payload = {
        "monthly": monthly_records,
        "productWarehouse": pw_records,
        "productSeries": dict(series),
        "productNames": product_names,
        "dateRange": {"min": current["Fecha"].min().isoformat(), "max": current["Fecha"].max().isoformat()},
        "historicalDateRange": {"min": all_sales["Fecha"].min().isoformat(), "max": all_sales["Fecha"].max().isoformat()},
        "modelHistory": {
            "sources": [FILE_2025.name, FILE_2026.name],
            "rows2025": int(len(historical)),
            "rows2026": int(len(current)),
            "months": int(all_sales["Periodo"].nunique()),
        },
    }
    return payload, all_sales


# ------------------------- PREDICCIONES -------------------------

def load_inventory_snapshot():
    if not FILE_INVENTORY.exists():
        return {}, {"source": None, "cutOff": None, "warnings": ["No se encontró inventario extraído"]}
    raw = json.loads(FILE_INVENTORY.read_text(encoding="utf-8"))
    stock = {}
    stale = []
    for warehouse in raw.get("almacenes", []):
        sheet = warehouse.get("hoja", "")
        period = warehouse.get("periodo_inventario") or ""
        if not period.startswith("2026-07"):
            stale.append(f"{sheet}: {period or 'sin periodo'}")
        for item in warehouse.get("productos", []):
            code = canonical_code(item.get("codigo"))
            value = item.get("inventario")
            if not code or not isinstance(value, (int, float)) or not math.isfinite(value):
                continue
            key = (sheet, code)
            stock[key] = stock.get(key, 0.0) + max(0.0, float(value))
    return stock, {
        "source": raw.get("archivo"),
        "cutOff": raw.get("fecha_corte"),
        "warnings": stale,
    }


def month_keys(start_year, start_month, count):
    keys = []
    year, month = start_year, start_month
    for _ in range(count):
        keys.append(f"{year}-{month:02d}")
        month += 1
        if month == 13:
            year += 1
            month = 1
    return keys


def seasonal_forecast(series, target_month, recent_keys, growth_factor):
    recent = [float(series.get(key, {}).get("unidades", 0)) for key in recent_keys]
    recent_avg = sum(recent) / len(recent) if recent else 0
    prior_key = f"{int(target_month[:4]) - 1}-{target_month[5:]}"
    prior = float(series.get(prior_key, {}).get("unidades", 0))
    if prior > 0 and recent_avg > 0:
        return 0.65 * prior * growth_factor + 0.35 * recent_avg
    return prior * growth_factor if prior > 0 else recent_avg


def build_predictions(sales, all_sales, logistics):
    print("Construyendo pronóstico estacional y sugerencias contra inventario...")
    shelf_life_days = 60
    safety_days = 7
    lead_total_avg = logistics["metrics"]["leadTimesGlobal"]["totalOrderToWarehouse"]["avg"]
    lead_total_avg = lead_total_avg if lead_total_avg > 0 else 45
    stock, inventory_meta = load_inventory_snapshot()

    cutoff = all_sales["Fecha"].max().date()
    complete_month = cutoff.month - 1 if cutoff.day < 28 else cutoff.month
    recent_keys = month_keys(cutoff.year, max(1, complete_month - 2), 3)
    if complete_month < 3:
        recent_keys = [f"{cutoff.year}-{month:02d}" for month in range(1, complete_month + 1)]
    forecast_keys = [f"{cutoff.year}-{month:02d}" for month in range(cutoff.month + 1, 13)]
    if not forecast_keys:
        forecast_keys = month_keys(cutoff.year + 1, 1, 6)

    group_dimensions = ["Código Producto", "Código Almacén", "Nombre (Almacén)"]
    grouped = all_sales.groupby(group_dimensions, dropna=False)
    candidates = []
    monthly_projection_by_product = defaultdict(lambda: defaultdict(lambda: {"unidades": 0.0, "venta": 0.0}))

    for dimensions, frame in grouped:
        code, warehouse_code, warehouse = dimensions
        latest = frame.sort_values("Fecha").iloc[-1]
        name = latest["Nombre (Producto)"]
        division = latest["DIVISION"]
        rubro = latest["RUBRO"]
        current_units = float(frame.loc[frame["Año"] == cutoff.year, "Unidades"].sum())
        if current_units <= 0:
            continue
        series_frame = frame.groupby("Periodo").agg(unidades=("Unidades", "sum"), venta=("Neto", "sum"))
        series = {period: values.to_dict() for period, values in series_frame.iterrows()}
        ytd_current = sum(float(series.get(f"{cutoff.year}-{month:02d}", {}).get("unidades", 0)) for month in range(1, complete_month + 1))
        ytd_prior = sum(float(series.get(f"{cutoff.year - 1}-{month:02d}", {}).get("unidades", 0)) for month in range(1, complete_month + 1))
        growth = ytd_current / ytd_prior if ytd_prior > 0 else 1.0
        growth = min(1.8, max(0.5, growth))
        unit_price = float(frame["Neto"].sum() / frame["Unidades"].sum()) if frame["Unidades"].sum() else 0
        forecasts = {}
        for key in forecast_keys:
            units_forecast = max(0.0, seasonal_forecast(series, key, recent_keys, growth))
            forecasts[key] = units_forecast
            month_name = MONTH_BY_NUMBER[int(key[5:])]
            monthly_projection_by_product[code][month_name]["unidades"] += units_forecast
            monthly_projection_by_product[code][month_name]["venta"] += units_forecast * unit_price

        next_values = list(forecasts.values())[:2]
        demand_30 = sum(next_values) / len(next_values) if next_values else 0
        if demand_30 <= 0:
            continue
        daily_demand = demand_30 / 30
        inventory_sheet = INVENTORY_SHEET_BY_SALES_WAREHOUSE.get(str(warehouse).upper())
        inventory_found = inventory_sheet is not None and (inventory_sheet, code) in stock
        available = stock.get((inventory_sheet, code), 0.0) if inventory_sheet else 0.0
        coverage_days = min(shelf_life_days, int(round(lead_total_avg + safety_days)))
        reorder_point = daily_demand * coverage_days
        target_stock = daily_demand * shelf_life_days
        purchase = max(0.0, target_stock - available)
        as_of = datetime.fromisoformat(inventory_meta.get("cutOff") or sales["dateRange"]["max"]).date()
        days_to_order = max(0, int(available / daily_demand - coverage_days)) if inventory_found else 0
        order_date = as_of + timedelta(days=days_to_order)
        arrival = order_date + timedelta(days=int(round(lead_total_avg)))
        candidates.append({
            "codigoProducto": code,
            "nombreProducto": name,
            "almacen": warehouse,
            "division": division,
            "rubro": rubro,
            "promedioDiarioUnidades": round(daily_demand, 2),
            "promedioDiarioVenta": round(daily_demand * unit_price, 2),
            "coberturaSugeridaDias": coverage_days,
            "demandaLeadTime": round(reorder_point),
            "demanda30Dias": round(demand_30),
            "demanda60Dias": round(target_stock),
            "puntoReorden": round(reorder_point),
            "inventarioDisponible": round(available, 2),
            "inventarioEncontrado": inventory_found,
            "stockSugerido": round(purchase),
            "fechaSugeridaPedido": order_date.isoformat(),
            "fechaLlegadaEstimada": arrival.isoformat(),
            "fechaCaducidadBatch": (arrival + timedelta(days=shelf_life_days)).isoformat(),
            "shelfLifeDays": shelf_life_days,
            "factorCrecimiento": round(growth, 3),
            "metodo": "65% mismo mes 2025 ajustado por tendencia + 35% promedio reciente",
        })

    predictions = sorted(candidates, key=lambda item: item["stockSugerido"], reverse=True)[:60]
    monthly_projection = []
    for code, months in monthly_projection_by_product.items():
        for month, values in months.items():
            monthly_projection.append({
                "codigoProducto": code,
                "nombreProducto": sales["productNames"].get(code, ""),
                "mes": month,
                "unidadesProyectadas": round(values["unidades"]),
                "ventaProyectada": round(values["venta"]),
            })

    return {
        "leadTimeAvgDays": lead_total_avg,
        "shelfLifeDays": shelf_life_days,
        "demandPredictions": predictions,
        "monthlyProjection": monthly_projection,
        "model": {
            "name": "Pronóstico estacional ponderado",
            "historyStart": sales["historicalDateRange"]["min"],
            "historyEnd": sales["historicalDateRange"]["max"],
            "historyMonths": sales["modelHistory"]["months"],
            "formula": "65% mismo mes del año anterior ajustado por tendencia YTD + 35% promedio de 3 meses completos",
            "inventory": inventory_meta,
        },
    }


def main():
    logistics = extract_logistics()
    sales, all_sales = extract_sales()
    predictions = build_predictions(sales, all_sales, logistics)

    # Guardar
    with open(OUT_DIR / "logistica.json", "w") as f:
        json.dump(logistics, f, indent=2, default=str)
    with open(OUT_DIR / "ventas_mensual.json", "w") as f:
        json.dump(sales, f, indent=2, default=str)
    with open(OUT_DIR / "predicciones.json", "w") as f:
        json.dump(predictions, f, indent=2, default=str)

    print(f"✅ Generados en {OUT_DIR}:")
    print(f"   - logistica.json  ({len(logistics['containers'])} contenedores)")
    print(f"   - ventas_mensual.json  ({len(sales['productWarehouse'])} producto/almacén)")
    print(f"   - predicciones.json  ({len(predictions['demandPredictions'])} sugerencias)")


if __name__ == "__main__":
    main()
