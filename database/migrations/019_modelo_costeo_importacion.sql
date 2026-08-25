-- Modelo de costeo por producto basado en "Modulo de Costeos de Productos (1).xlsx".
-- Conserva los supuestos editables; los resultados se calculan con la misma
-- cadena de fórmulas del archivo y no sustituyen el precio publicado por sí solos.

BEGIN;

CREATE TABLE IF NOT EXISTS public.producto_costeos (
  producto_id BIGINT PRIMARY KEY REFERENCES public.productos(id) ON DELETE CASCADE,
  zona VARCHAR(120),
  entrega VARCHAR(160),
  condiciones TEXT,
  moneda VARCHAR(30) NOT NULL DEFAULT 'EUR/USD',
  cajas_por_tarima NUMERIC(14,4) NOT NULL DEFAULT 108 CHECK (cajas_por_tarima > 0),
  tarimas_por_contenedor NUMERIC(14,4) NOT NULL DEFAULT 22 CHECK (tarimas_por_contenedor > 0),
  precio_origen_kg NUMERIC(14,6) NOT NULL DEFAULT 0 CHECK (precio_origen_kg >= 0),
  flete_maritimo NUMERIC(14,4) NOT NULL DEFAULT 0 CHECK (flete_maritimo >= 0),
  tipo_cambio_base NUMERIC(14,6) NOT NULL DEFAULT 20.4 CHECK (tipo_cambio_base >= 0),
  factor_tipo_cambio NUMERIC(14,6) NOT NULL DEFAULT 1.025 CHECK (factor_tipo_cambio >= 0),
  tasa_interes_impuestos NUMERIC(9,6) NOT NULL DEFAULT 0.027 CHECK (tasa_interes_impuestos >= 0 AND tasa_interes_impuestos < 1),
  gastos_aduanales NUMERIC(14,4) NOT NULL DEFAULT 0 CHECK (gastos_aduanales >= 0),
  flete_aduana_cliente NUMERIC(14,4) NOT NULL DEFAULT 0 CHECK (flete_aduana_cliente >= 0),
  almacenaje_caja NUMERIC(14,4) NOT NULL DEFAULT 0 CHECK (almacenaje_caja >= 0),
  margen_objetivo NUMERIC(9,6) NOT NULL DEFAULT 0.13 CHECK (margen_objetivo >= 0 AND margen_objetivo < 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Renglón modelo del Excel. Q4 contiene 0.87: es el factor de recuperación,
-- equivalente a un margen objetivo de 13% porque Precio = Costo / (1 - margen).
INSERT INTO public.producto_costeos (
  producto_id, moneda, cajas_por_tarima, tarimas_por_contenedor,
  precio_origen_kg, flete_maritimo, tipo_cambio_base, factor_tipo_cambio,
  tasa_interes_impuestos, gastos_aduanales, flete_aduana_cliente,
  almacenaje_caja, margen_objetivo
)
SELECT
  id, 'EUR/USD', 108, 22, 0.88, 2710, 20.4, 1.025,
  0.027, 63000, 99500, 0, 0.13
FROM public.productos
WHERE sku = '102013'
  AND en_catalogo_precios = TRUE
ON CONFLICT (producto_id) DO NOTHING;

INSERT INTO public.producto_costeos (producto_id)
SELECT id
FROM public.productos
WHERE en_catalogo_precios = TRUE
ON CONFLICT (producto_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.guardar_producto_catalogo_costeo(
  p_sku TEXT,
  p_producto JSONB,
  p_precios JSONB,
  p_costeo JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_resultado JSONB;
  v_producto_id BIGINT;
BEGIN
  v_resultado := public.guardar_producto_catalogo(p_sku, p_producto, p_precios);

  IF jsonb_typeof(COALESCE(p_costeo, '{}'::jsonb)) <> 'object' THEN
    RAISE EXCEPTION 'p_costeo debe ser un objeto JSON';
  END IF;

  SELECT id INTO v_producto_id
  FROM public.productos
  WHERE sku = p_sku
    AND en_catalogo_precios = TRUE;

  INSERT INTO public.producto_costeos (
    producto_id, zona, entrega, condiciones, moneda,
    cajas_por_tarima, tarimas_por_contenedor, precio_origen_kg,
    flete_maritimo, tipo_cambio_base, factor_tipo_cambio,
    tasa_interes_impuestos, gastos_aduanales, flete_aduana_cliente,
    almacenaje_caja, margen_objetivo, updated_at
  )
  VALUES (
    v_producto_id,
    NULLIF(BTRIM(p_costeo ->> 'zone'), ''),
    NULLIF(BTRIM(p_costeo ->> 'delivery'), ''),
    NULLIF(BTRIM(p_costeo ->> 'conditions'), ''),
    COALESCE(NULLIF(BTRIM(p_costeo ->> 'currency'), ''), 'EUR/USD'),
    (p_costeo ->> 'boxesPerPallet')::NUMERIC,
    (p_costeo ->> 'palletsPerContainer')::NUMERIC,
    (p_costeo ->> 'originPriceKg')::NUMERIC,
    (p_costeo ->> 'seaFreight')::NUMERIC,
    (p_costeo ->> 'exchangeRateBase')::NUMERIC,
    (p_costeo ->> 'exchangeRateFactor')::NUMERIC,
    (p_costeo ->> 'interestTaxRate')::NUMERIC,
    (p_costeo ->> 'customsExpenses')::NUMERIC,
    (p_costeo ->> 'inlandFreight')::NUMERIC,
    (p_costeo ->> 'storagePerBox')::NUMERIC,
    (p_costeo ->> 'targetMargin')::NUMERIC,
    NOW()
  )
  ON CONFLICT (producto_id) DO UPDATE SET
    zona = EXCLUDED.zona,
    entrega = EXCLUDED.entrega,
    condiciones = EXCLUDED.condiciones,
    moneda = EXCLUDED.moneda,
    cajas_por_tarima = EXCLUDED.cajas_por_tarima,
    tarimas_por_contenedor = EXCLUDED.tarimas_por_contenedor,
    precio_origen_kg = EXCLUDED.precio_origen_kg,
    flete_maritimo = EXCLUDED.flete_maritimo,
    tipo_cambio_base = EXCLUDED.tipo_cambio_base,
    factor_tipo_cambio = EXCLUDED.factor_tipo_cambio,
    tasa_interes_impuestos = EXCLUDED.tasa_interes_impuestos,
    gastos_aduanales = EXCLUDED.gastos_aduanales,
    flete_aduana_cliente = EXCLUDED.flete_aduana_cliente,
    almacenaje_caja = EXCLUDED.almacenaje_caja,
    margen_objetivo = EXCLUDED.margen_objetivo,
    updated_at = NOW();

  RETURN v_resultado || jsonb_build_object('costingSaved', TRUE);
END;
$$;

ALTER TABLE public.producto_costeos ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.producto_costeos FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.guardar_producto_catalogo_costeo(TEXT, JSONB, JSONB, JSONB) FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.producto_costeos TO service_role;
GRANT EXECUTE ON FUNCTION public.guardar_producto_catalogo_costeo(TEXT, JSONB, JSONB, JSONB) TO service_role;

COMMIT;
