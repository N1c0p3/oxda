-- Ejecuta después de 018_clientes_pedidos_catalogo.sql.

SELECT
  COUNT(*) = 250 AS existen_250_clientes_anexos,
  COUNT(*) FILTER (WHERE zona_comercial IS NULL OR zona_comercial = '') AS clientes_sin_zona,
  COUNT(*) FILTER (WHERE vendedor IS NULL OR vendedor = '') AS clientes_sin_vendedor
FROM public.clientes
WHERE codigo_externo IS NOT NULL;

SELECT
  zona_comercial,
  COUNT(*) AS clientes
FROM public.clientes
WHERE codigo_externo IS NOT NULL
GROUP BY zona_comercial
ORDER BY zona_comercial;

SELECT
  COUNT(*) = 0 AS codigos_duplicados
FROM (
  SELECT codigo_externo
  FROM public.clientes
  WHERE codigo_externo IS NOT NULL
  GROUP BY codigo_externo
  HAVING COUNT(*) > 1
) duplicados;

SELECT
  EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ventas_pedidos'
      AND column_name = 'comentarios'
  ) AS pedidos_tienen_comentarios;
