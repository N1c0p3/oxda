-- Documentos de cobranza para la cartera de clientes

CREATE TABLE IF NOT EXISTS cobranza_documentos (
    id BIGSERIAL PRIMARY KEY,
    documento VARCHAR(40) NOT NULL UNIQUE,
    cliente VARCHAR(120) NOT NULL,
    zona VARCHAR(80),
    vendedor VARCHAR(120),
    saldo NUMERIC(14,2) NOT NULL DEFAULT 0,
    fecha_vencimiento DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO cobranza_documentos (documento, cliente, zona, vendedor, saldo, fecha_vencimiento)
VALUES
    ('FAC-16021', 'CREMERIA LOS ALTOS', 'GDL', 'MARIO', 87400, '2026-06-09'),
    ('FAC-16034', 'CRISTIAN IVAN ESTRADA', 'QR', 'MARIO', 53200, '2026-06-08'),
    ('FAC-15988', 'EL SAZON 86', 'CS', 'DIEGO', 25257, '2026-04-29'),
    ('FAC-16002', 'TREFOODS', 'MEN VLP', 'GABRIELA', 12143, '2026-05-16'),
    ('FAC-15894', 'EVENTUAL', 'MAY VLP', 'MARIO', 19147, '2026-04-04'),
    ('FAC-16055', 'COMERCIAL PDC', 'GDL', 'GAMALIEL', 13650, '2026-06-20'),
    ('FAC-16062', 'SLOVENSKO', 'QR', 'ADOLFO', 12240, '2026-06-25'),
    ('FAC-15721', 'DISTRIBUIDORA BAHIA KINO', 'CS', 'MARIO', 11250, '2026-04-12'),
    ('FAC-15601', 'OPERADORA VALIENTE', 'CC CASTEL', 'MARIO', 55500, '2026-02-28')
ON CONFLICT (documento) DO UPDATE SET
    cliente = EXCLUDED.cliente,
    zona = EXCLUDED.zona,
    vendedor = EXCLUDED.vendedor,
    saldo = EXCLUDED.saldo,
    fecha_vencimiento = EXCLUDED.fecha_vencimiento;
