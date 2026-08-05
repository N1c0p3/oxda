# Papas Demo

## Actualización de cortes de negocio

Los archivos fuente no se modifican. Cuando se reciba un nuevo corte de ventas,
inventario o logística, reemplázalo con el nombre definido en los scripts y ejecuta:

```bash
npm run data:refresh
```

El proceso genera los derivados auditables para ventas, logística y predicción.
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

Nota: el MVP actual usa almacenamiento en memoria para validar flujos y pantallas; el esquema productivo PostgreSQL ya está definido en database/schema.sql.

## Siguiente paso recomendado

Implementar un MVP en 3 fases:
1. Captura operativa + inventarios + trazabilidad
2. Ventas/CRM + pedidos + logística
3. Inteligencia operativa + tableros + automatizaciones
