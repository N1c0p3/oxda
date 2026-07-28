-- Tablas para la vista inventarios/reporte

CREATE TABLE IF NOT EXISTS inventario_reporte_productos (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(40) NOT NULL UNIQUE,
    product VARCHAR(200) NOT NULL,
    zone VARCHAR(80) NOT NULL,
    warehouse VARCHAR(120) NOT NULL,
    lot VARCHAR(80) NOT NULL,
    expiry DATE NOT NULL,
    units NUMERIC(14,3) NOT NULL DEFAULT 0,
    monthly_demand NUMERIC(14,3) NOT NULL DEFAULT 0,
    cost_box NUMERIC(12,2) NOT NULL DEFAULT 0,
    in_transit NUMERIC(14,3) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS inventario_reporte_movimientos (
    id BIGSERIAL PRIMARY KEY,
    date DATE NOT NULL,
    type VARCHAR(40) NOT NULL,
    zone VARCHAR(80) NOT NULL,
    warehouse VARCHAR(120) NOT NULL,
    code VARCHAR(40) NOT NULL,
    product VARCHAR(200) NOT NULL,
    lot VARCHAR(80) NOT NULL,
    units NUMERIC(14,3) NOT NULL,
    reference VARCHAR(200) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventario_rotacion (
    id BIGSERIAL PRIMARY KEY,
    tipo VARCHAR(20) NOT NULL, -- historico | semanal
    periodo VARCHAR(40) NOT NULL,
    gdl NUMERIC(5,2) NOT NULL DEFAULT 0,
    qr NUMERIC(5,2) NOT NULL DEFAULT 0,
    cs NUMERIC(5,2) NOT NULL DEFAULT 0,
    men_vlp NUMERIC(5,2) NOT NULL DEFAULT 0,
    may_vlp NUMERIC(5,2) NOT NULL DEFAULT 0,
    consolidated NUMERIC(5,2) NOT NULL DEFAULT 0,
    UNIQUE (tipo, periodo)
);

INSERT INTO inventario_reporte_productos (code, product, zone, warehouse, lot, expiry, units, monthly_demand, cost_box, in_transit)
VALUES
    ('105632', '10 MM NATURAL WERISNG', 'GDL', 'FRIJALISCO', 'WERISNG-105632', '2026-09-18', 1755, 858, 276, 1185),
    ('102341', '10 MM CON COBERTURA', 'GDL', 'FRIJALISCO', 'WERISNG-102341', '2026-08-30', 465, 303, 307, 0),
    ('102310', '7 MM CON COBERTURA', 'QR', 'CDMX', 'WERISNG-102310', '2026-08-14', 99, 181, 310, 1512),
    ('102211', '7 MM NATURAL', 'QR', 'CDMX', 'WERISNG-102211', '2026-10-06', 466, 157, 295, 0),
    ('104215', '10 MM CON COBERTURA Y CÁSCARA', 'CS', 'BAJO CERO', 'WERISNG-104215', '2026-07-28', 24, 153, 350, 1312),
    ('114054', 'GAJOS SAZONADOS', 'CS', 'BAJO CERO', 'WERISNG-114054', '2026-09-09', 461, 279, 325, 0),
    ('102419', 'PAPA ONDULADA', 'MEN VLP', 'VULPES', 'WERISNG-102419', '2026-10-22', 337, 132, 298, 0),
    ('505015', '10 MM NATURAL KAIDA', 'MAY VLP', 'ABASTOS LÓGICOS', 'KAIDA-505015', '2026-11-16', 3636, 466, 271, 2268),
    ('260612', 'CASTEL STRAIGHT CUT 4X2500G', 'CC CASTEL', 'BAJO CERO', 'AVIKO-260612', '2026-07-19', 83, 83, 250, 0),
    ('806982', 'AROS DE CEBOLLA AVIKO', 'CC KAIDA1', 'FRIJALISCO', 'AVIKO-806982', '2026-08-03', 52, 53, 334, 0),
    ('807769', 'PAPAS FRITAS CORTE REGULAR', 'FARAON', 'BAJO CERO', 'BC-807769', '2026-09-25', 177, 177, 285, 177),
    ('807329', 'AVIKO ORIGINAL 20X450G', 'VERACRUZ', 'CDMX', 'BC-807329', '2026-08-21', 145, 145, 290, 0)
ON CONFLICT (code) DO UPDATE SET
    product = EXCLUDED.product,
    zone = EXCLUDED.zone,
    warehouse = EXCLUDED.warehouse,
    lot = EXCLUDED.lot,
    expiry = EXCLUDED.expiry,
    units = EXCLUDED.units,
    monthly_demand = EXCLUDED.monthly_demand,
    cost_box = EXCLUDED.cost_box,
    in_transit = EXCLUDED.in_transit;

INSERT INTO inventario_reporte_movimientos (date, type, zone, warehouse, code, product, lot, units, reference)
VALUES
    ('2026-05-13', 'Salida', 'GDL', 'FRIJALISCO', '105632', '10 MM NATURAL WERISNG', 'WERISNG-105632', 96, 'FACTURA VLP-16142'),
    ('2026-05-12', 'Entrada', 'FARAON', 'BAJO CERO', '807769', 'PAPAS FRITAS CORTE REGULAR', 'BC-807769', 177, 'RECEPCIÓN OC-1841'),
    ('2026-05-10', 'Transferencia', 'QR', 'CDMX', '102341', '10 MM CON COBERTURA', 'WERISNG-102341', 240, 'TR-0048'),
    ('2026-05-08', 'Salida', 'CS', 'BAJO CERO', '114054', 'GAJOS SAZONADOS', 'WERISNG-114054', 54, 'FACTURA VLP-16098'),
    ('2026-05-06', 'Ajuste', 'CC CASTEL', 'BAJO CERO', '260612', 'CASTEL STRAIGHT CUT', 'AVIKO-260612', -3, 'CONTEO CÍCLICO CC-021')
ON CONFLICT DO NOTHING;

INSERT INTO inventario_rotacion (tipo, periodo, gdl, qr, cs, men_vlp, may_vlp, consolidated)
VALUES
    ('historico', 'Ene', 0.92, 0.78, 0.84, 0.66, 0.51, 0.76),
    ('historico', 'Feb', 1.04, 0.87, 0.91, 0.72, 0.58, 0.85),
    ('historico', 'Mar', 1.17, 0.96, 1.02, 0.83, 0.64, 0.94),
    ('historico', 'Abr', 1.09, 1.02, 0.94, 0.88, 0.71, 0.93),
    ('historico', 'May', 1.21, 1.08, 1.12, 0.91, 0.77, 1.02),
    ('semanal', '27 Abr', 1.06, 0.91, 0.88, 0.79, 0.65, 0.86),
    ('semanal', '4 May', 1.14, 1.02, 1.01, 0.84, 0.71, 0.94),
    ('semanal', '11 May', 1.21, 1.08, 1.12, 0.91, 0.77, 1.02),
    ('semanal', '18 May', 1.18, 1.11, 1.04, 0.93, 0.82, 1.03)
ON CONFLICT (tipo, periodo) DO UPDATE SET
    gdl = EXCLUDED.gdl,
    qr = EXCLUDED.qr,
    cs = EXCLUDED.cs,
    men_vlp = EXCLUDED.men_vlp,
    may_vlp = EXCLUDED.may_vlp,
    consolidated = EXCLUDED.consolidated;
