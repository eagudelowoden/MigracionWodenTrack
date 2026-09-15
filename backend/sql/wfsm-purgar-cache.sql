-- Deja en la caché solo los últimos N días (por defecto 30) y borra lo anterior.
--
-- Es lo mismo que hace el cron cada noche (WFSM_RETENCION_DIAS), pero a mano:
-- útil para la primera limpieza, o si la ventana llevaba tiempo sin purgarse.
--
-- La tabla es CACHÉ, no libro de registro: el sistema de verdad es WFS y
-- cualquier fecha se puede volver a traer. Borrar aquí no pierde información.
--
-- El corte usa hora Colombia (UTC-5), igual que el resto del módulo.

DECLARE @dias INT = 30;                       -- <<< días a conservar
DECLARE @corte NVARCHAR(10) =
  CONVERT(NVARCHAR(10), DATEADD(DAY, -@dias, DATEADD(HOUR, -5, GETUTCDATE())), 23);

PRINT CONCAT('Se conservan las fechas >= ', @corte);


-- ── 1. Qué se va a borrar (revisar antes de ejecutar el paso 2) ─────────────
SELECT fecha,
       COUNT(*) AS filas,
       COUNT(DISTINCT id_visita) AS visitas
  FROM wfsm_seriales_recuperados
 WHERE fecha < @corte
 GROUP BY fecha
 ORDER BY fecha;

SELECT COUNT(*) AS filas_a_borrar
  FROM wfsm_seriales_recuperados
 WHERE fecha < @corte;


-- ── 2. Borrado por lotes ────────────────────────────────────────────────────
-- En lotes de 5.000 para no inflar el log de transacciones ni bloquear la
-- tabla completa en un solo DELETE.
SET NOCOUNT ON;

DECLARE @filas INT = 1;
DECLARE @total INT = 0;

WHILE @filas > 0
BEGIN
  DELETE TOP (5000) FROM wfsm_seriales_recuperados
   WHERE fecha < @corte;

  SET @filas = @@ROWCOUNT;
  SET @total = @total + @filas;
END

-- El registro de sincronización de esas fechas también sobra: si no se borra,
-- el cron creería que siguen cacheadas y no volvería a traerlas nunca.
DELETE FROM wfsm_sync_estado
 WHERE fecha < @corte;

PRINT CONCAT('Filas borradas: ', @total);


-- ── 3. Verificación ─────────────────────────────────────────────────────────
SELECT COUNT(*) AS filas_restantes,
       COUNT(DISTINCT fecha) AS fechas,
       MIN(fecha) AS mas_antigua,
       MAX(fecha) AS mas_reciente
  FROM wfsm_seriales_recuperados;
