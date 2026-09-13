-- Rellena documento_agente en las filas que ya estaban cacheadas antes de que
-- la columna existiera (quedaron en NULL).
--
-- No hace falta volver a consultar WFS: la columna "datos" ya guarda el JSON
-- completo del registro, y ahí adentro viene documento_identidad — que es la
-- cédula del AGENTE, no la del cliente (esa es cedula_cliente).
--
-- Ejecutar en TEST y PROD después de 2026-09-12-wfsm-documento-agente.sql.
-- Requiere SQL Server 2016 o superior (JSON_VALUE / ISJSON).

-- ── 1. Cuántas filas están sin poblar ───────────────────────────────────────
SELECT COUNT(*) AS total,
       SUM(CASE WHEN documento_agente IS NULL THEN 1 ELSE 0 END) AS sin_documento
  FROM wfsm_seriales_recuperados;


-- ── 2. Relleno por lotes ────────────────────────────────────────────────────
-- En lotes de 5.000 para no inflar el log de transacciones ni bloquear la
-- tabla en un solo UPDATE gigante.
--
-- La condición "JSON_VALUE(...) IS NOT NULL" es la que termina el ciclo: sin
-- ella, las filas cuyo JSON no traiga documento_identidad se actualizarían a
-- NULL una y otra vez y el WHILE nunca saldría.

SET NOCOUNT ON;

DECLARE @filas INT = 1;
DECLARE @total INT = 0;

WHILE @filas > 0
BEGIN
  UPDATE TOP (5000) wfsm_seriales_recuperados
     SET documento_agente = JSON_VALUE(datos, '$.documento_identidad')
   WHERE documento_agente IS NULL
     AND ISJSON(datos) = 1
     AND JSON_VALUE(datos, '$.documento_identidad') IS NOT NULL;

  SET @filas = @@ROWCOUNT;
  SET @total = @total + @filas;
END

PRINT CONCAT('Filas actualizadas: ', @total);
GO


-- ── 3. Verificación ─────────────────────────────────────────────────────────
-- "sin_documento" debería quedar en 0, o en la cantidad de registros cuyo JSON
-- realmente no traía documento_identidad.
SELECT COUNT(*) AS total,
       SUM(CASE WHEN documento_agente IS NULL THEN 1 ELSE 0 END) AS sin_documento
  FROM wfsm_seriales_recuperados;

-- Muestra de control: la columna debe coincidir con lo que dice el JSON.
SELECT TOP 5
       id_visita,
       agente_campo,
       documento_agente,
       JSON_VALUE(datos, '$.documento_identidad') AS documento_en_json,
       cedula_cliente
  FROM wfsm_seriales_recuperados
 WHERE documento_agente IS NOT NULL;
