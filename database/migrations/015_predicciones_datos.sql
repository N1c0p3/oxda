-- Tabla para almacenar datos de predicción/logística usados en logistica/prediccion
-- Los datos se cargan desde public/data/*.json mediante scripts/importar_predicciones.mjs

CREATE TABLE IF NOT EXISTS predicciones_datos (
    id BIGSERIAL PRIMARY KEY,
    clave VARCHAR(40) NOT NULL UNIQUE,
    datos JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
