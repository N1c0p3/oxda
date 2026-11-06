# Papas Demo

## Acceso al sistema

Cada persona entra en `/login` con su usuario (`juan`, `angeles`, `gama` o
`direccion`) y su sesión dura 12 horas. Las cuentas viven en Supabase Auth y el perfil
de cada una está en `app_metadata.perfil`. `proxy.ts` protege pantallas, API y archivos
de `public/data` según el perfil, y requiere `AUTH_SECRET` en `.env.local` y en Vercel.

`node scripts/crear_accesos.mjs` crea las cuentas que falten y
`node scripts/crear_accesos.mjs --restablecer juan` genera otra contraseña. Las
contraseñas nuevas se guardan en `.env.accesos`, que Git ignora.

## Maggie, la asistente de IA

Maggie (@MaggieOxdaBot) permite consultar y modificar el sistema desde Telegram,
por texto o nota de voz, con los mismos permisos de cada perfil. Toda modificación
se aplica hasta que el usuario toca Confirmar y queda registrada en el panel
`/telegram` (solo perfil Dirección). `/maggie` la presenta a todo el equipo y su
identidad está en [docs/maggie-marca.md](docs/maggie-marca.md).

Puesta en marcha:

1. Ejecuta `database/migrations/021_telegram_agente.sql` en Supabase.
2. Define en `.env.local` y en Vercel las variables de `.env.example`.
3. Despliega y abre `/telegram` desde el sitio publicado con `TELEGRAM_ADMIN_KEY`.
4. Toca **Activar a Maggie**, que también aplica su nombre, textos y foto en
   Telegram, y genera un enlace por persona. Cada enlace es de un solo uso y vence
   en 24 horas.

Maggie opera con `claude-haiku-5-5` (se cambia con `CLAUDE_MODEL`) y transcribe la
voz con `gpt-transcribe` de OpenAI (se cambia con `OPENAI_TRANSCRIPTION_MODEL`).

## Actualización de cortes de negocio

Los archivos fuente no se modifican. Cuando se reciba un nuevo corte de ventas,
inventario o logística, reemplázalo con el nombre definido en los scripts y ejecuta:

```bash
npm run data:refresh
```

El proceso genera los derivados auditables para ventas, inventario, logística y predicción.
El pronóstico usa el histórico completo de
`2025 Reporte de Ventas Oxda-Vulpes al 31.12.2025..xlsx`, el corte 2026 y
`INVENTARIOS OXDA AGOSTO 2026..xlsx`. Para cada producto/almacén combina el
mismo mes de 2025 ajustado por la tendencia 2026 con el promedio de los tres
meses completos más recientes; después descuenta la existencia física para
calcular la compra sugerida.
Si se requiere publicar esos cortes en la base de datos, después ejecuta:

```bash
npm run data:predicciones
```

La aplicación conserva el último corte validado como respaldo: una tabla vacía
en la base no deja sin información al módulo predictivo.

Sistema inteligente para operatividad de empresa papera (papa en general), integrando ERP + CRM en una sola plataforma, construido en Next.js (full-stack).

## Objetivo

Centralizar la operación completa:
- Planeación de demanda y producción
- Captura operativa por trabajador y por área
- Inventarios y trazabilidad de lotes
- Logística de entradas/salidas
- Compras y costos
- Ventas, cartera, CRM y servicio al cliente
- Inteligencia operativa con alertas y KPIs

## Módulos principales

1. Núcleo ERP
- Inventarios y almacenes
- Producción y rendimiento por proceso
- Compras y proveedores
- Logística y rutas
- Finanzas básicas y costos por lote

2. Núcleo CRM
- Clientes y contactos
- Oportunidades de venta y pipeline
- Cotizaciones y pedidos
- Postventa, incidencias y seguimiento

3. Inteligencia operativa
- Predicción de demanda
- Alertas de quiebre de inventario
- Alertas de mermas fuera de parámetro
- Sugerencias de reabasto y priorización de rutas

## Roles del sistema

1. Dirección
- Visión global, márgenes, cumplimiento y riesgos

2. Administración
- Parametrización, catálogos, permisos, cierres y reportes

3. Jefe de planta
- Planeación de turnos, metas de procesamiento, productividad

4. Personal de proceso
- Captura de kilos procesados, tiempos, incidencias y mermas

5. Almacén
- Entradas, salidas, conteos cíclicos, ajuste de inventario

6. Logística
- Programación de rutas, embarques, evidencias de entrega

7. Ventas
- Prospectos, seguimiento comercial, pedidos y cobranza

8. Compras
- Solicitudes de compra, órdenes, recepción y evaluación de proveedor

## Flujo operativo resumido

1. Se pronostica demanda por cliente/producto.
2. Se genera plan de producción y necesidades de materia prima.
3. Operadores capturan producción por lote y por turno.
4. Se actualiza inventario automáticamente con trazabilidad.
5. Logística programa envíos y confirma entregas.
6. Ventas registra pedidos, estatus y seguimiento de cartera.
7. Dirección monitorea KPIs y alertas en tablero ejecutivo.

## KPIs recomendados

- Kilos procesados por turno/área/persona
- Rendimiento real vs esperado
- Merma porcentual por lote y por proceso
- Fill rate (cumplimiento de pedido)
- OTIF (on time in full)
- Rotación de inventario
- Margen por cliente y por producto
- Días de cartera vencida

## Entregables incluidos en este repositorio

- Arquitectura funcional: docs/arquitectura-funcional.md
- Contratos de API sugeridos: docs/apis.md
- Esquema de base de datos PostgreSQL: database/schema.sql
- Matriz de roles y pantallas: docs/matriz-roles-y-pantallas.md
- Backlog MVP por sprints: docs/backlog-mvp.md
- App Next.js full-stack: app/
- API en Next Route Handlers: app/api/v1/

## Ejecutar proyecto Next.js

1. Instalar dependencias

```bash
npm install
```

2. Levantar aplicación

```bash
npm run dev
```

3. Abrir aplicación y APIs

- App: http://127.0.0.1:3000
- KPI demo: http://127.0.0.1:3000/api/v1/dashboard/kpis

## Catálogo y listas de precios

La pantalla `/costeo` administra el catálogo final y sus listas General y
Mayoreo. Los productos se ligan con sus bandas de precio mediante
`producto_precios.producto_id` y los cambios se guardan con una transacción en
Supabase.

Para habilitarla en una base existente:

1. Abre **Supabase → SQL Editor → New query**.
2. Copia y ejecuta una sola vez `database/migrations/017_catalogo_listas_precios.sql`.
3. Copia y ejecuta `database/verify/017_catalogo_listas_precios_check.sql`.
4. Confirma que las comprobaciones regresen `true` y que las consultas de
   incidencias no devuelvan filas.

Para habilitar el modelo completo de importación del archivo
`Modulo de Costeos de Productos (1).xlsx` (contenedor, moneda, tipo de cambio,
fletes, aduana, impuestos, almacenaje y margen), ejecuta después:

1. `database/migrations/019_modelo_costeo_importacion.sql`.
2. `database/verify/019_modelo_costeo_importacion_check.sql`.

La pantalla conserva por producto los supuestos del costeo y calcula en tiempo
real costo puesto por caja, precio objetivo por caja y precio objetivo por kg.

Para habilitar los selectores de clientes/productos y el histórico de precios
del capturador de pedidos, ejecuta después:

1. `database/migrations/018_clientes_pedidos_catalogo.sql`.
2. `database/verify/018_clientes_pedidos_catalogo_check.sql`.

La aplicación consulta estas tablas únicamente desde sus Route Handlers con
`SUPABASE_SERVICE_ROLE_KEY`. No expongas esa llave en variables `NEXT_PUBLIC_*`.

El campo **Producto de interés** del CRM se vincula con el mismo catálogo de
productos y listas de precios. Para habilitar la llave foránea en una base ya
existente, ejecuta:

1. `database/migrations/020_crm_producto_interes_catalogo.sql`.
2. `database/verify/020_crm_producto_interes_catalogo_check.sql`.

Nota: el MVP actual usa almacenamiento en memoria para validar flujos y pantallas; el esquema productivo PostgreSQL ya está definido en database/schema.sql.

## Siguiente paso recomendado

Implementar un MVP en 3 fases:
1. Captura operativa + inventarios + trazabilidad
2. Ventas/CRM + pedidos + logística
3. Inteligencia operativa + tableros + automatizaciones
