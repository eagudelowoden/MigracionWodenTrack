-- Diagnóstico: ¿en qué punto de la migración está esta base?
-- Solo lee, no modifica nada. Ejecutar en la base que se quiera revisar.

SELECT
  CASE WHEN OBJECT_ID('wfsm_seriales_recuperados')     IS NULL THEN 'NO existe' ELSE 'existe' END AS tabla_principal,
  CASE WHEN OBJECT_ID('wfsm_seriales_recuperados_v2')  IS NULL THEN 'no'        ELSE 'SI (quedó a medias)' END AS tabla_v2,
  CASE WHEN OBJECT_ID('wfsm_seriales_recuperados_old') IS NULL THEN 'no'        ELSE 'SI (respaldo)' END AS tabla_old,
  CASE WHEN COL_LENGTH('wfsm_seriales_recuperados', 'id') IS NULL
       THEN 'NO  -> migración PENDIENTE'
       ELSE 'SI  -> migración YA APLICADA' END AS columna_id;

-- Nombres de PK e índices de las tablas wfsm
SELECT t.name AS tabla, kc.name AS restriccion, 'PRIMARY KEY' AS tipo
  FROM sys.key_constraints kc
  JOIN sys.tables t ON t.object_id = kc.parent_object_id
 WHERE t.name LIKE 'wfsm_seriales%'
UNION ALL
SELECT t.name, i.name, i.type_desc
  FROM sys.indexes i
  JOIN sys.tables t ON t.object_id = i.object_id
 WHERE t.name LIKE 'wfsm_seriales%' AND i.type_desc = 'NONCLUSTERED'
 ORDER BY tabla, tipo;

-- Conteos, para comparar antes/después
SELECT 'wfsm_seriales_recuperados' AS tabla, COUNT(*) AS filas,
       COUNT(DISTINCT id_visita) AS visitas
  FROM wfsm_seriales_recuperados;
