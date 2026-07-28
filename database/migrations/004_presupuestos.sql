-- Tablas de presupuestos para la vista por zona/producto

CREATE TABLE IF NOT EXISTS presupuestos_zona (
    id BIGSERIAL PRIMARY KEY,
    zona VARCHAR(80) NOT NULL,
    producto VARCHAR(120) NOT NULL,
    enero NUMERIC(14,2) NOT NULL DEFAULT 0,
    febrero NUMERIC(14,2) NOT NULL DEFAULT 0,
    marzo NUMERIC(14,2) NOT NULL DEFAULT 0,
    abril NUMERIC(14,2) NOT NULL DEFAULT 0,
    mayo NUMERIC(14,2) NOT NULL DEFAULT 0,
    UNIQUE (zona)
);

CREATE TABLE IF NOT EXISTS presupuestos_producto (
    id BIGSERIAL PRIMARY KEY,
    producto VARCHAR(120) NOT NULL UNIQUE,
    presupuesto NUMERIC(14,2) NOT NULL DEFAULT 0,
    real NUMERIC(14,2) NOT NULL DEFAULT 0,
    avance NUMERIC(5,2) NOT NULL DEFAULT 0
);

INSERT INTO presupuestos_zona (zona, producto, enero, febrero, marzo, abril, mayo)
VALUES
    ('GDL', 'Papa Recta 3/8', 868336, 937996, 1319014, 1239990, 976665),
    ('QR', 'Papa Delgada 1/4', 640090, 723170, 676280, 968530, 941850),
    ('CS', 'Papa Castel', 1224156, 1236049, 885795, 798594, 727054),
    ('CC KAIDA1', 'Papa Gajo', 624000, 636000, 576000, 600000, 316800),
    ('CC KAIDA2', 'Papa Recta Cob', 636000, 636000, 636000, 600000, 592800),
    ('CC KAIDA3', 'Papa Ondulada', 636000, 624000, 636000, 636000, 600000),
    ('MEN VLP', 'Aves', 1000000, 680000, 592919, 760000, 902885),
    ('MAY VLP', 'Secos', 485000, 583000, 495170, 550000, 766144)
ON CONFLICT (zona) DO UPDATE SET
    producto = EXCLUDED.producto,
    enero = EXCLUDED.enero,
    febrero = EXCLUDED.febrero,
    marzo = EXCLUDED.marzo,
    abril = EXCLUDED.abril,
    mayo = EXCLUDED.mayo;

INSERT INTO presupuestos_producto (producto, presupuesto, real, avance)
VALUES
    ('Papa Recta 3/8', 8500000, 7420000, 87),
    ('Papa Delgada 1/4', 4200000, 3180000, 76),
    ('Papa Castel Straight', 3800000, 2890000, 76),
    ('Papa Gajo Sazonado', 2100000, 1620000, 77),
    ('Papa Ondulada 1/2', 1800000, 1430000, 79),
    ('Aves', 3500000, 1850000, 53),
    ('Secos', 1200000, 497000, 41)
ON CONFLICT (producto) DO UPDATE SET
    presupuesto = EXCLUDED.presupuesto,
    real = EXCLUDED.real,
    avance = EXCLUDED.avance;
