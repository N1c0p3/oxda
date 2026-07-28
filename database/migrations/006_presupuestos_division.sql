-- Presupuesto vs Real por división para la página de ventas/vs-presupuesto

CREATE TABLE IF NOT EXISTS presupuestos_division (
    id BIGSERIAL PRIMARY KEY,
    division VARCHAR(80) NOT NULL UNIQUE,
    presupuesto NUMERIC(14,2) NOT NULL DEFAULT 0,
    real NUMERIC(14,2) NOT NULL DEFAULT 0,
    diferencia NUMERIC(14,2) NOT NULL DEFAULT 0,
    avance NUMERIC(5,2) NOT NULL DEFAULT 0
);

INSERT INTO presupuestos_division (division, presupuesto, real, diferencia, avance)
VALUES
    ('GDL', 976665, 323732, -652933, 33),
    ('QR', 941850, 202470, -739380, 21),
    ('CS', 727054, 177115, -549939, 24),
    ('CC CASTEL', 621000, 621000, 0, 100),
    ('CC KAIDA1', 316800, 316800, 0, 100),
    ('MEN VLP', 902885, 367622, -535263, 41),
    ('MAY VLP', 766144, 117981, -648163, 15)
ON CONFLICT (division) DO UPDATE SET
    presupuesto = EXCLUDED.presupuesto,
    real = EXCLUDED.real,
    diferencia = EXCLUDED.diferencia,
    avance = EXCLUDED.avance;
