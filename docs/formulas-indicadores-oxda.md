# Fórmulas e indicadores OXDA

## Criterios vigentes

| Indicador | Fórmula | Fuente |
|---|---|---|
| Venta neta | Suma de `Neto` | Facturación |
| Costo | Suma de `Costo total` | Facturación |
| Margen | Venta neta menos costo total | Facturación |
| Margen % | Margen total / venta neta total × 100 | Cálculo ponderado |
| Frecuencia de compra | Documentos únicos del periodo | Serie y folio |
| Rotación comercial mensual | Unidades / días observados × 30 | Facturación |
| Rotación de inventario | Cajas vendidas / inventario físico promedio | Inventario mensual |
| Participación de inventario | Cajas del producto o almacén / cajas totales × 100 | Existencias físicas |
| Cobertura | Unidades disponibles / consumo mensual | Inventario y venta |
| Factor de tendencia | Venta facturada del periodo / venta facturada del periodo anterior | Fecha de factura |
| Avance de presupuesto | Venta comparable / presupuesto configurado × 100 | Facturación y objetivos |
| Stock ideal | Venta diaria promedio × días de cobertura objetivo | Venta e inventario |
| Precio sugerido | Costo por caja / (1 − margen objetivo) | Costeo |

## Clasificación de cobertura

- Crítico: menos de 1.5 meses.
- Óptimo: desde 1.5 y menos de 2 meses.
- Exceso: 2 meses o más.

## Pendiente funcional

MCP no se calcula ni se presenta como sinónimo de margen. Hace falta aprobar su definición, campos de origen y tratamiento de devoluciones, descuentos e impuestos antes de activarlo.

## Notas de control

- Los porcentajes de margen se calculan sobre totales; no se promedian porcentajes por renglón.
- En la vista consolidada, el avance de presupuesto utiliza únicamente la venta de zonas que tienen una meta configurada. La venta total permanece visible por separado.
- Las fechas de caducidad que no existen en la fuente se muestran como pendientes de captura; no se generan fechas estimadas como si fueran datos reales.
