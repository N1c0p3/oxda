-- Datos consolidados para la vista resumen ejecutivo

CREATE TABLE IF NOT EXISTS resumen_global (
    id BIGSERIAL PRIMARY KEY,
    periodo VARCHAR(20) NOT NULL UNIQUE,
    divisiones JSONB NOT NULL DEFAULT '[]',
    ventas_mensuales JSONB NOT NULL DEFAULT '[]',
    top_clientes JSONB NOT NULL DEFAULT '[]',
    ventas_canal JSONB NOT NULL DEFAULT '[]',
    top_vendedores JSONB NOT NULL DEFAULT '[]',
    totales JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO resumen_global (periodo, divisiones, ventas_mensuales, top_clientes, ventas_canal, top_vendedores, totales)
VALUES (
    '2026',
    '[
      {"division":"GDL","presupuesto":976665,"real":323732,"avance":33,"mscp":64239,"mscpPct":20},
      {"division":"QR","presupuesto":941850,"real":202470,"avance":21,"mscp":37647,"mscpPct":19},
      {"division":"CS","presupuesto":727054,"real":177115,"avance":24,"mscp":49942,"mscpPct":28},
      {"division":"CC CASTEL","presupuesto":621000,"real":621000,"avance":100,"mscp":16146,"mscpPct":3},
      {"division":"CC KAIDA1","presupuesto":316800,"real":316800,"avance":100,"mscp":29700,"mscpPct":9},
      {"division":"MEN VLP","presupuesto":902885,"real":367622,"avance":41,"mscp":81972,"mscpPct":22},
      {"division":"MAY VLP","presupuesto":766144,"real":117981,"avance":15,"mscp":41574,"mscpPct":35}
    ]',
    '[
      {"mes":"Enero","venta":6328368,"unidades":16831},
      {"mes":"Febrero","venta":7444180,"unidades":22339},
      {"mes":"Marzo","venta":7193476,"unidades":20815},
      {"mes":"Abril","venta":5736381,"unidades":15752},
      {"mes":"Mayo","venta":2126719,"unidades":6480}
    ]',
    '[
      {"cliente":"CREMERIA LOS ALTOS","cajas":2799,"venta":717720,"margen":31007,"margenPct":4.32},
      {"cliente":"CRISTIAN IVAN ESTRADA","cajas":1100,"venta":316800,"margen":29700,"margenPct":9.38},
      {"cliente":"JONATAN MICHAEL RAMIREZ","cajas":282,"venta":125721,"margen":29725,"margenPct":23.64},
      {"cliente":"OPERADORA VALIENTE","cajas":240,"venta":111000,"margen":34397,"margenPct":30.99},
      {"cliente":"EL SAZON 86","cajas":126,"venta":84190,"margen":15396,"margenPct":18.29},
      {"cliente":"TREFOODS","cajas":249,"venta":80951,"margen":31244,"margenPct":38.60},
      {"cliente":"COMERCIAL PDC","cajas":130,"venta":45500,"margen":4144,"margenPct":9.11},
      {"cliente":"SLOVENSKO","cajas":120,"venta":40800,"margen":7024,"margenPct":17.21}
    ]',
    '[
      {"canal":"Papa","venta":25798940,"porcentaje":89.49},
      {"canal":"Aves","venta":1849675,"porcentaje":6.42},
      {"canal":"Secos","venta":497188,"porcentaje":1.72},
      {"canal":"Carne","venta":256935,"porcentaje":0.89},
      {"canal":"Fruta y Verd","venta":219438,"porcentaje":0.76},
      {"canal":"Lacteos","venta":205659,"porcentaje":0.71}
    ]',
    '[
      {"nombre":"Mario","ventas":12430948,"porcentaje":43.1},
      {"nombre":"OXDA","ventas":10622056,"porcentaje":36.8},
      {"nombre":"Gabriela","ventas":2155082,"porcentaje":7.5},
      {"nombre":"Diego","ventas":1954324,"porcentaje":6.8},
      {"nombre":"Gamaliel","ventas":593262,"porcentaje":2.1},
      {"nombre":"MKT","ventas":553904,"porcentaje":1.9},
      {"nombre":"Adolfo","ventas":279899,"porcentaje":1.0},
      {"nombre":"Karim","ventas":239650,"porcentaje":0.8}
    ]',
    '{"ventaTotal":28829125,"unidadesTotal":82217,"presupuestoTotal":7156798,"realTotal":2126719,"avanceGlobal":30,"mscpTotal":321219,"mscpPromedio":15}'
)
ON CONFLICT (periodo) DO UPDATE SET
    divisiones = EXCLUDED.divisiones,
    ventas_mensuales = EXCLUDED.ventas_mensuales,
    top_clientes = EXCLUDED.top_clientes,
    ventas_canal = EXCLUDED.ventas_canal,
    top_vendedores = EXCLUDED.top_vendedores,
    totales = EXCLUDED.totales,
    updated_at = NOW();
