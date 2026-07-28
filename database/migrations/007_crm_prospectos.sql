-- Tablas CRM para prospectos y seguimientos

CREATE TABLE IF NOT EXISTS crm_prospectos (
    id BIGSERIAL PRIMARY KEY,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    asesor VARCHAR(120) NOT NULL,
    canal VARCHAR(80) NOT NULL,
    nombre_prospecto VARCHAR(200) NOT NULL,
    cargo_prospecto VARCHAR(120),
    nombre_negocio VARCHAR(200) NOT NULL,
    municipio VARCHAR(120),
    estado VARCHAR(80),
    contacto1 VARCHAR(80),
    contacto2 VARCHAR(80),
    correo VARCHAR(120),
    producto_interes VARCHAR(120),
    zona VARCHAR(80),
    etapa VARCHAR(40) NOT NULL DEFAULT 'nuevo',
    notas TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_seguimientos (
    id BIGSERIAL PRIMARY KEY,
    prospecto_id BIGINT NOT NULL REFERENCES crm_prospectos(id) ON DELETE CASCADE,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    tipo VARCHAR(40) NOT NULL,
    comentario TEXT NOT NULL DEFAULT '',
    proxima_accion TEXT,
    fecha_proxima DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_seguimientos_prospecto ON crm_seguimientos(prospecto_id);
