-- Agrega el rango fijo opcional al cron de resumen de asistencia.
-- Ejecutar manualmente en TEST y PROD antes de desplegar (mismo motivo que
-- 2026-08-22-asistencia-resumen.sql: synchronize está desactivado ahí y
-- verify-schema.js bloquea el despliegue si faltan columnas).

IF NOT EXISTS (
  SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('asistencia_cron_config') AND name = 'rango_fijo_desde'
)
BEGIN
  ALTER TABLE asistencia_cron_config ADD rango_fijo_desde NVARCHAR(10) NULL;
END

IF NOT EXISTS (
  SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('asistencia_cron_config') AND name = 'rango_fijo_hasta'
)
BEGIN
  ALTER TABLE asistencia_cron_config ADD rango_fijo_hasta NVARCHAR(10) NULL;
END
