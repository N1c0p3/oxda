-- Métricas por almacén para la vista inventarios/almacenes

CREATE TABLE IF NOT EXISTS almacenes_metricas (
    id BIGSERIAL PRIMARY KEY,
    almacen VARCHAR(200) NOT NULL UNIQUE,
    valor NUMERIC(14,2) NOT NULL DEFAULT 0,
    cajas NUMERIC(10,2) NOT NULL DEFAULT 0,
    costo_prom NUMERIC(10,2) NOT NULL DEFAULT 0,
    ventas_mes NUMERIC(10,2) NOT NULL DEFAULT 0,
    llegadas NUMERIC(10,2) NOT NULL DEFAULT 0,
    ventas_est NUMERIC(10,2) NOT NULL DEFAULT 0,
    cobertura NUMERIC(5,2) NOT NULL DEFAULT 0,
    status VARCHAR(40) NOT NULL DEFAULT 'Óptimo'
);

INSERT INTO almacenes_metricas (almacen, valor, cajas, costo_prom, ventas_mes, llegadas, ventas_est, cobertura, status)
VALUES
    ('Abastos Logicos', 743039, 2692, 276, 493, 4644, 2000, 2.67, 'Óptimo'),
    ('CDMX: Arcosa/Fresco/Frigarsa/Canbelt', 2089695, 5626, 371, 411, 3024, 1200, 6.21, 'Óptimo'),
    ('Bajo Cero', 1358076, 4926, 276, 0, 2622, 1000, 7.93, 'Exceso'),
    ('Frjalisco', 1231168, 4584, 269, 3410, 1185, 2800, 1.06, 'Crítico'),
    ('Alfrimex', 94931, 356, 267, 158, 0, 50, 6.12, 'Óptimo'),
    ('Vulpes', 307923, 981, 314, 0, 0, 0, 0, 'Sin movimiento')
ON CONFLICT (almacen) DO UPDATE SET
    valor = EXCLUDED.valor,
    cajas = EXCLUDED.cajas,
    costo_prom = EXCLUDED.costo_prom,
    ventas_mes = EXCLUDED.ventas_mes,
    llegadas = EXCLUDED.llegadas,
    ventas_est = EXCLUDED.ventas_est,
    cobertura = EXCLUDED.cobertura,
    status = EXCLUDED.status;
