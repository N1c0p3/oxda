-- Inventarios en tránsito

CREATE TABLE IF NOT EXISTS inventarios_transito (
    id BIGSERIAL PRIMARY KEY,
    almacen_destino VARCHAR(200) NOT NULL,
    producto VARCHAR(200) NOT NULL,
    cajas NUMERIC(10,2) NOT NULL DEFAULT 0,
    valor NUMERIC(14,2) NOT NULL DEFAULT 0,
    origen VARCHAR(120),
    eta DATE,
    estado VARCHAR(60),
    transportista VARCHAR(120),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO inventarios_transito (almacen_destino, producto, cajas, valor, origen, eta, estado, transportista)
VALUES
    ('Abastos Logicos', 'Papa Recta 3/8', 2268, 626000, 'Proveedor A', '2026-06-03', 'En ruta', 'Transportes del Norte'),
    ('CDMX', 'Papa Delgada 1/4', 1512, 418000, 'Proveedor A', '2026-06-05', 'En ruta', 'Logística CDMX'),
    ('Bajo Cero', 'Papa Castel Straight', 1312, 362000, 'Proveedor B', '2026-06-04', 'En ruta', 'Frío Express'),
    ('Frjalisco', 'Papa Ondulada 1/2', 593, 164000, 'Proveedor C', '2026-06-06', 'Pendiente', 'Cargas Jalisco'),
    ('Abastos Logicos', 'Papa Recta Cobertura', 2376, 655000, 'Proveedor B', '2026-06-08', 'Pendiente', 'Transportes del Norte'),
    ('CDMX', 'Papa Gajo Sazonado', 1512, 418000, 'Proveedor A', '2026-06-07', 'En ruta', 'Logística CDMX')
ON CONFLICT DO NOTHING;
