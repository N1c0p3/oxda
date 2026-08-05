#!/usr/bin/env python3
"""
Extrae métricas de logística (2022 Ventas Proyeccion..xlsx)
y ventas/predicción (2026 Reporte de Ventas Oxda al 24.06.2026.xlsx)
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
FILE_2026 = ROOT / "2026 Reporte de Ventas Oxda al 24.06.2026.xlsx"

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

def extract_sales():
    print("Leyendo ventas 2026...")
    df = pd.read_excel(FILE_2026, sheet_name="Reporte de Venta", header=0)
    df["Fecha"] = pd.to_datetime(df["Fecha"], errors="coerce")

    # Limpieza básica
    df = df[df["Fecha"].notna()].copy()
    df["Año"] = df["Año"].fillna(2026).astype(int)
    # La utilidad corporativa siempre se construye con venta neta. En algunos
    # renglones del libro el Margen heredado usa Total; se normaliza aquí sin
    # modificar el archivo de origen.
    df["Neto"] = pd.to_numeric(df["Neto"], errors="coerce").fillna(0)
    df["Costo total"] = pd.to_numeric(df["Costo total"], errors="coerce").fillna(0)
    df["Margen"] = df["Neto"] - df["Costo total"]

    monthly = (
        df.groupby(["Año", "Mes", "Código Producto", "Nombre (Producto)", "Código Almacén", "Nombre (Almacén)", "DIVISION", "RUBRO"])
        .agg({"Unidades": "sum", "Neto": "sum", "Costo total": "sum", "Margen": "sum"})
        .reset_index()
    )

    # Agregar por producto/almacén
    product_warehouse = (
        df.groupby(["Código Producto", "Nombre (Producto)", "Código Almacén", "Nombre (Almacén)", "DIVISION", "RUBRO"])
        .agg({"Unidades": "sum", "Neto": "sum", "Costo total": "sum", "Margen": "sum", "Fecha": ["min", "max", "count"]})
        .reset_index()
    )
    product_warehouse.columns = [
        "codigoProducto", "nombreProducto", "codigoAlmacen", "nombreAlmacen",
        "division", "rubro", "unidades", "venta", "costoTotal", "margen",
        "fechaPrimera", "fechaUltima", "numTransacciones"
    ]

    # Agregar mensual por producto (para serie de tiempo y proyección)
    monthly_by_product = (
        df.groupby(["Mes", "Código Producto", "Nombre (Producto)"])
        .agg({"Unidades": "sum", "Neto": "sum"})
        .reset_index()
    )

    monthly_records = monthly.to_dict(orient="records")
    for r in monthly_records:
        r["unidades"] = float(r["Unidades"]) if pd.notna(r["Unidades"]) else 0
        r["venta"] = float(r["Neto"]) if pd.notna(r["Neto"]) else 0
        r["costo"] = float(r["Costo total"]) if pd.notna(r["Costo total"]) else 0
        r["margen"] = float(r["Margen"]) if pd.notna(r["Margen"]) else 0
        del r["Unidades"], r["Neto"], r["Costo total"], r["Margen"]

    pw_records = []
    for _, r in product_warehouse.iterrows():
        dias = max(1, (r["fechaUltima"] - r["fechaPrimera"]).days + 1)
        pw_records.append({
            "codigoProducto": r["codigoProducto"],
            "nombreProducto": r["nombreProducto"],
            "codigoAlmacen": r["codigoAlmacen"],
            "nombreAlmacen": r["nombreAlmacen"],
            "division": r["division"],
            "rubro": r["rubro"],
            "unidades": float(r["unidades"]),
            "venta": float(r["venta"]),
            "costoTotal": float(r["costoTotal"]),
            "margen": float(r["margen"]),
            "promedioDiarioUnidades": round(float(r["unidades"]) / dias, 2),
            "promedioDiarioVenta": round(float(r["venta"]) / dias, 2),
            "margenPct": round(float(r["margen"]) / float(r["venta"]) * 100, 2) if r["venta"] else 0,
        })

    # Serie mensual por producto para proyección
    series = defaultdict(lambda: defaultdict(lambda: {"unidades": 0.0, "venta": 0.0}))
    for _, r in monthly_by_product.iterrows():
        series[r["Código Producto"]][r["Mes"]] = {
            "unidades": float(r["Unidades"]) if pd.notna(r["Unidades"]) else 0,
            "venta": float(r["Neto"]) if pd.notna(r["Neto"]) else 0,
        }

    product_names = dict(zip(df["Código Producto"], df["Nombre (Producto)"]))

    return {
        "monthly": monthly_records,
        "productWarehouse": pw_records,
        "productSeries": {
            prod: {m: series[prod].get(m, {"unidades": 0, "venta": 0}) for m in MESES_ORD[:6]}
            for prod in series
        },
        "productNames": product_names,
        "dateRange": {"min": df["Fecha"].min().isoformat(), "max": df["Fecha"].max().isoformat()},
    }


# ------------------------- PREDICCIONES -------------------------

def build_predictions(sales, logistics):
    print("Construyendo predicciones...")
    shelf_life_days = 60  # 2 meses
    lead_total_avg = logistics["metrics"]["leadTimesGlobal"]["totalOrderToWarehouse"]["avg"]
    lead_total_avg = lead_total_avg if lead_total_avg > 0 else 45

    # Tomar top productos por unidades vendidas para sugerencias de compra
    top = sorted(sales["productWarehouse"], key=lambda x: x["unidades"], reverse=True)[:40]

    predictions = []
    today = datetime.fromisoformat(sales["dateRange"]["max"]).date()
    for item in top:
        adu = item["promedioDiarioUnidades"]
        adv = item["promedioDiarioVenta"]
        if adu <= 0:
            continue

        # Demanda esperada durante lead time + buffer de 1 semana
        cobertura_dias = int(lead_total_avg + 7)
        demanda_lead = round(adu * cobertura_dias, 0)
        demanda_30d = round(adu * 30, 0)
        demanda_60d = round(adu * 60, 0)  # vida útil

        # Cuándo se recomienda hacer el pedido para no quedar en ceros
        stock_sugerido = demanda_60d  # pedir para cubrir vida útil
        punto_reorden = demanda_lead
        fecha_sugerida_pedido = (today + timedelta(days=max(0, int((punto_reorden / adu) - lead_total_avg)))).isoformat()
        fecha_llegada_estimada = (datetime.fromisoformat(fecha_sugerida_pedido).date() + timedelta(days=int(lead_total_avg))).isoformat()
        fecha_caducidad = (datetime.fromisoformat(fecha_llegada_estimada).date() + timedelta(days=shelf_life_days)).isoformat()

        predictions.append({
            "codigoProducto": item["codigoProducto"],
            "nombreProducto": item["nombreProducto"],
            "almacen": item["nombreAlmacen"],
            "division": item["division"],
            "rubro": item["rubro"],
            "promedioDiarioUnidades": adu,
            "promedioDiarioVenta": adv,
            "coberturaSugeridaDias": cobertura_dias,
            "demandaLeadTime": demanda_lead,
            "demanda30Dias": demanda_30d,
            "demanda60Dias": demanda_60d,
            "puntoReorden": punto_reorden,
            "stockSugerido": stock_sugerido,
            "fechaSugeridaPedido": fecha_sugerida_pedido,
            "fechaLlegadaEstimada": fecha_llegada_estimada,
            "fechaCaducidadBatch": fecha_caducidad,
            "shelfLifeDays": shelf_life_days,
        })

    # Proyección mensual simple: extrapolar promedio de los últimos meses conocidos
    monthly_projection = []
    meses_conocidos = MESES_ORD[:6]
    for prod, vals in sales["productSeries"].items():
        known = [vals[m]["unidades"] for m in meses_conocidos if vals[m]["unidades"] > 0]
        if not known:
            continue
        avg_month = sum(known) / len(known)
        nombre = sales["productNames"].get(prod, "")
        for i, m in enumerate(MESES_ORD[6:], start=1):
            monthly_projection.append({
                "codigoProducto": prod,
                "nombreProducto": nombre,
                "mes": m,
                "unidadesProyectadas": round(avg_month, 0),
                "ventaProyectada": round(avg_month * (vals[meses_conocidos[0]]["venta"] / vals[meses_conocidos[0]]["unidades"]), 0) if vals[meses_conocidos[0]]["unidades"] else 0,
            })

    return {
        "leadTimeAvgDays": lead_total_avg,
        "shelfLifeDays": shelf_life_days,
        "demandPredictions": predictions,
        "monthlyProjection": monthly_projection,
    }


def main():
    logistics = extract_logistics()
    sales = extract_sales()
    predictions = build_predictions(sales, logistics)

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
