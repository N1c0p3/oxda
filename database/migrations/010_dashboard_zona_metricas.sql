-- Métricas por zona para el dashboard

CREATE TABLE IF NOT EXISTS dashboard_zona_metricas (
    id BIGSERIAL PRIMARY KEY,
    zona VARCHAR(80) NOT NULL UNIQUE,
    inventory_units NUMERIC(10,2) NOT NULL DEFAULT 0,
    inventory_rotation NUMERIC(5,2) NOT NULL DEFAULT 0,
    inventory_critical NUMERIC(10,2) NOT NULL DEFAULT 0,
    inventory_transit NUMERIC(10,2) NOT NULL DEFAULT 0,
    inventory_transit_value NUMERIC(14,2) NOT NULL DEFAULT 0,
    receivables_total NUMERIC(14,2) NOT NULL DEFAULT 0,
    receivables_overdue NUMERIC(14,2) NOT NULL DEFAULT 0,
    receivables_due_soon NUMERIC(14,2) NOT NULL DEFAULT 0
);

INSERT INTO dashboard_zona_metricas (
    zona, inventory_units, inventory_rotation, inventory_critical,
    inventory_transit, inventory_transit_value,
    receivables_total, receivables_overdue, receivables_due_soon
)
VALUES
    ('GDL', 2220, 1.21, 0, 1185, 327060, 101050, 0, 87400),
    ('QR', 565, 1.08, 1, 1512, 468720, 65440, 0, 53200),
    ('CS', 485, 1.12, 1, 1312, 459200, 36507, 36507, 0),
    ('MEN VLP', 337, 0.91, 0, 0, 0, 12143, 12143, 0),
    ('MAY VLP', 3636, 0.77, 0, 2268, 614628, 19147, 19147, 0),
    ('CC CASTEL', 83, 1.00, 1, 0, 0, 55500, 55500, 0),
    ('CC KAIDA1', 52, 0.98, 1, 0, 0, 0, 0, 0),
    ('FARAON', 177, 1.00, 1, 177, 50445, 0, 0, 0),
    ('VERACRUZ', 145, 1.00, 1, 0, 0, 0, 0, 0)
ON CONFLICT (zona) DO UPDATE SET
    inventory_units = EXCLUDED.inventory_units,
    inventory_rotation = EXCLUDED.inventory_rotation,
    inventory_critical = EXCLUDED.inventory_critical,
    inventory_transit = EXCLUDED.inventory_transit,
    inventory_transit_value = EXCLUDED.inventory_transit_value,
    receivables_total = EXCLUDED.receivables_total,
    receivables_overdue = EXCLUDED.receivables_overdue,
    receivables_due_soon = EXCLUDED.receivables_due_soon;
