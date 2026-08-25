-- Origen de leads para pipeline

CREATE TABLE IF NOT EXISTS pipeline_origen_leads (
    id BIGSERIAL PRIMARY KEY,
    origen VARCHAR(80) NOT NULL UNIQUE,
    cantidad INTEGER NOT NULL DEFAULT 0,
    porcentaje NUMERIC(5,2) NOT NULL DEFAULT 0
);

INSERT INTO pipeline_origen_leads (origen, cantidad, porcentaje)
VALUES
    ('Referidos', 28, 38.9),
    ('Web', 18, 25.0),
    ('Llamadas', 15, 20.8),
    ('Eventos', 8, 11.1),
    ('Base', 3, 4.2)
ON CONFLICT (origen) DO UPDATE SET
    cantidad = EXCLUDED.cantidad,
    porcentaje = EXCLUDED.porcentaje;
