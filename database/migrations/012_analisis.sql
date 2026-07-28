-- Datos de análisis avanzado

CREATE TABLE IF NOT EXISTS analisis_dashboard (
    id BIGSERIAL PRIMARY KEY,
    periodo VARCHAR(20) NOT NULL UNIQUE,
    tendencias JSONB NOT NULL DEFAULT '[]',
    eficiencia_clientes JSONB NOT NULL DEFAULT '[]',
    proyeccion_trimestre JSONB NOT NULL DEFAULT '[]',
    kpis JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO analisis_dashboard (periodo, tendencias, eficiencia_clientes, proyeccion_trimestre, kpis)
VALUES (
    '2026',
    '[
      {"periodo":"Semana 1","inventario":5800000,"ventas":420000,"rotacion":1.45},
      {"periodo":"Semana 2","inventario":5200000,"ventas":580000,"rotacion":1.89},
      {"periodo":"Semana 3","inventario":4800000,"ventas":720000,"rotacion":2.35},
      {"periodo":"Semana 4","inventario":4190810,"ventas":249636,"rotacion":1.77}
    ]',
    '[
      {"cliente":"Abastos logicos","rotacion":2.84,"eficiencia":85,"stockIdeal":3500},
      {"cliente":"CDMX Arcosa","rotacion":1.45,"eficiencia":92,"stockIdeal":5200},
      {"cliente":"Bajo Cero","rotacion":0.0,"eficiencia":65,"stockIdeal":3800}
    ]',
    '[
      {"mes":"Mayo","escenario":"Conservador","valor":6800000,"probabilidad":60},
      {"mes":"Mayo","escenario":"Optimista","valor":7500000,"probabilidad":30},
      {"mes":"Junio","escenario":"Conservador","valor":6200000,"probabilidad":55},
      {"mes":"Junio","escenario":"Optimista","valor":7200000,"probabilidad":35},
      {"mes":"Julio","escenario":"Conservador","valor":5800000,"probabilidad":50},
      {"mes":"Julio","escenario":"Optimista","valor":7000000,"probabilidad":40}
    ]',
    '{"rotacionPromedio":1.77,"eficienciaGlobal":81,"diasInventario":16.9,"clientesCriticos":1}'
)
ON CONFLICT (periodo) DO UPDATE SET
    tendencias = EXCLUDED.tendencias,
    eficiencia_clientes = EXCLUDED.eficiencia_clientes,
    proyeccion_trimestre = EXCLUDED.proyeccion_trimestre,
    kpis = EXCLUDED.kpis,
    updated_at = NOW();
