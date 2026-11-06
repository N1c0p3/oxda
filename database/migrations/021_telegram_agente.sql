-- Agente de Telegram: vínculos por persona, conversación, cambios por confirmar y auditoría.
-- Las cuatro tablas quedan con RLS y sin políticas: solo la service role del servidor las usa.

CREATE TABLE IF NOT EXISTS telegram_vinculos (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    perfil VARCHAR(20) NOT NULL CHECK (perfil IN ('contador', 'logistica', 'ventas', 'direccion')),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    codigo_hash CHAR(64) UNIQUE,
    codigo_expira TIMESTAMPTZ,
    telegram_user_id BIGINT UNIQUE,
    telegram_chat_id BIGINT,
    telegram_username VARCHAR(64),
    vinculado_at TIMESTAMPTZ,
    ultimo_mensaje_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS telegram_mensajes (
    id BIGSERIAL PRIMARY KEY,
    vinculo_id BIGINT NOT NULL REFERENCES telegram_vinculos(id) ON DELETE CASCADE,
    rol VARCHAR(10) NOT NULL CHECK (rol IN ('user', 'assistant')),
    contenido TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telegram_mensajes_vinculo ON telegram_mensajes(vinculo_id, id DESC);

-- Cada tarjeta de confirmación es una fila. Sobrevive al vínculo para conservar la auditoría.
CREATE TABLE IF NOT EXISTS telegram_acciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vinculo_id BIGINT REFERENCES telegram_vinculos(id) ON DELETE SET NULL,
    autor VARCHAR(120) NOT NULL,
    perfil VARCHAR(20) NOT NULL,
    operaciones JSONB NOT NULL,
    resultados JSONB,
    estatus VARCHAR(20) NOT NULL DEFAULT 'pendiente'
        CHECK (estatus IN ('pendiente', 'ejecutando', 'ejecutada', 'parcial', 'fallida', 'cancelada')),
    expira_at TIMESTAMPTZ NOT NULL,
    resuelta_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telegram_acciones_recientes ON telegram_acciones(created_at DESC);

-- Telegram reintenta las entregas; esta tabla evita procesar dos veces un mismo update.
CREATE TABLE IF NOT EXISTS telegram_updates (
    update_id BIGINT PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE telegram_vinculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_mensajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_acciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_updates ENABLE ROW LEVEL SECURITY;
