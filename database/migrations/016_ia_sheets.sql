-- Datos fallback para la integración de Google Sheets en ia/page.tsx

CREATE TABLE IF NOT EXISTS ia_sheets_registros (
    id BIGSERIAL PRIMARY KEY,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
    categoria VARCHAR(120) NOT NULL,
    importe NUMERIC(12,2) NOT NULL DEFAULT 0,
    dia INTEGER NOT NULL DEFAULT 1,
    mes INTEGER NOT NULL DEFAULT 1,
    anio INTEGER NOT NULL DEFAULT 2025,
    UNIQUE (tipo, categoria, importe, dia, mes, anio)
);

INSERT INTO ia_sheets_registros (tipo, categoria, importe, dia, mes, anio)
VALUES
    ('ingreso', 'Ingreso', 12000, 11, 7, 2025),
    ('ingreso', 'Ingreso', 10000, 11, 7, 2025),
    ('ingreso', 'Ingreso', 500, 11, 7, 2025),
    ('ingreso', 'Ingreso mensual', 2000, 28, 7, 2025),
    ('ingreso', 'Campaña, Bot y Plataforma Digital', 45000, 26, 7, 2025),
    ('ingreso', 'Campaña, bot y plataforma digital', 45000, 26, 7, 2025),
    ('ingreso', 'Ingreso por campaña Facebook Ads', 25000, 5, 9, 2025),
    ('ingreso', 'Campaña Publicitaria', 25000, 18, 9, 2025),
    ('ingreso', 'Ingreso por campaña y desarrollo de página web', 35000, 18, 9, 2025),
    ('ingreso', 'Desarrollo inmobiliario', 45000, 23, 9, 2025),
    ('ingreso', 'Desarrollo del sistema NFC', 35000, 24, 9, 2025),
    ('ingreso', 'Desarrollo, campaña e implementación', 75000, 26, 9, 2025),
    ('ingreso', 'Ingreso por radiografías y consulta', 25000, 4, 10, 2025),
    ('ingreso', 'Ingreso por servicios', 38000, 15, 10, 2025),
    ('ingreso', 'Campaña e implementación QR acceso escolar', 45000, 29, 9, 2025),
    ('ingreso', 'CRM inteligente tema dental', 35000, 1, 10, 2025),
    ('egreso', 'Gasto', 11000, 11, 7, 2025),
    ('egreso', 'Gasto inesperado', 12000, 11, 7, 2025),
    ('egreso', 'Pago de luz', 45000, 14, 6, 2025),
    ('egreso', 'Pago de luz', 45000, 14, 7, 2025),
    ('egreso', 'Internet Consultorio', 1500, 25, 7, 2025),
    ('egreso', 'Mano de obra', 3500, 26, 7, 2025),
    ('egreso', 'Impermeabilizante', 35000, 26, 7, 2025),
    ('egreso', 'Costos operativos de cirugía', 12000, 2, 8, 2025),
    ('egreso', 'Campaña Publicitaria', 15000, 11, 8, 2025),
    ('egreso', 'Gastos publicitarios', 15000, 12, 8, 2025),
    ('egreso', 'Costo y pago de mantenimiento', 12000, 16, 8, 2025),
    ('egreso', 'inversión inicial, Bolsen', 14000, 18, 8, 2025),
    ('egreso', 'Sueldos Fever', 100000, 24, 9, 2025),
    ('egreso', 'Desarrollo hidráulico', 25000, 26, 9, 2025),
    ('egreso', 'Gastos de campaña', 25000, 23, 9, 2025),
    ('egreso', 'Publicidad y desarrollo de crm inteligente', 120000, 7, 10, 2025),
    ('egreso', 'costos operativos', 25000, 25, 10, 2025)
ON CONFLICT DO NOTHING;
