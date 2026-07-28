-- Tabla de comisiones para cuentas por pagar y logística/predicción

CREATE TABLE IF NOT EXISTS comisiones (
    id BIGSERIAL PRIMARY KEY,
    vendedor VARCHAR(120) NOT NULL,
    zona VARCHAR(80),
    venta NUMERIC(14,2) NOT NULL DEFAULT 0,
    tasa NUMERIC(5,2) NOT NULL DEFAULT 0,
    estatus VARCHAR(40) NOT NULL DEFAULT 'Por autorizar', -- Por autorizar, Programada, Pagada
    fecha_pago DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO comisiones (vendedor, zona, venta, tasa, estatus, fecha_pago)
VALUES
    ('MARIO', 'GDL', 916518, 1.5, 'Por autorizar', NULL),
    ('GABRIELA', 'MEN VLP', 159504, 2, 'Programada', '2026-07-31'),
    ('DIEGO', 'CS', 144616, 2, 'Pagada', '2026-07-15'),
    ('GAMALIEL', 'QR', 44661, 2.5, 'Por autorizar', NULL),
    ('MKT', 'MAY VLP', 40408, 1, 'Programada', '2026-07-31')
ON CONFLICT DO NOTHING;
