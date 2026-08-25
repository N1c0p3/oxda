-- Vincula el producto de interés de cada prospecto con el catálogo maestro.
-- La columna de texto se conserva como etiqueta histórica para exportaciones.

BEGIN;

ALTER TABLE public.crm_prospectos
  ADD COLUMN IF NOT EXISTS producto_interes_id BIGINT;

ALTER TABLE public.crm_prospectos
  DROP CONSTRAINT IF EXISTS crm_prospectos_producto_interes_id_fkey;

ALTER TABLE public.crm_prospectos
  ADD CONSTRAINT crm_prospectos_producto_interes_id_fkey
  FOREIGN KEY (producto_interes_id)
  REFERENCES public.productos(id)
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS crm_prospectos_producto_interes_id_idx
  ON public.crm_prospectos(producto_interes_id)
  WHERE producto_interes_id IS NOT NULL;

-- Convierte los registros previos que usaban el formato "SKU · NOMBRE".
UPDATE public.crm_prospectos AS prospecto
SET producto_interes_id = producto.id,
    producto_interes = producto.sku || ' · ' || producto.nombre
FROM public.productos AS producto
WHERE prospecto.producto_interes_id IS NULL
  AND split_part(COALESCE(prospecto.producto_interes, ''), ' · ', 1) = producto.sku;

COMMIT;
