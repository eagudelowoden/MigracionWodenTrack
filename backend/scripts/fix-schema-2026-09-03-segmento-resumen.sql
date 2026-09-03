-- Agrega segmento_id / segmento_nombre a asistencia_diaria_resumen (nuevas
-- columnas de AsistenciaDiariaResumen). Sin esto, el cron de resumen de
-- asistencia falla al guardar en cualquier ambiente con DB_SYNCHRONIZE
-- distinto de "true" (QA WodenTrackTest y producción).
-- Ejecutar contra la base correspondiente antes de desplegar este cambio.

IF NOT EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'asistencia_diaria_resumen' AND COLUMN_NAME = 'segmento_id'
)
  ALTER TABLE asistencia_diaria_resumen ADD segmento_id INT NULL;

IF NOT EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'asistencia_diaria_resumen' AND COLUMN_NAME = 'segmento_nombre'
)
  ALTER TABLE asistencia_diaria_resumen ADD segmento_nombre NVARCHAR(255) NULL;

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE name = 'IDX_asistencia_dia_segmento' AND object_id = OBJECT_ID('asistencia_diaria_resumen')
)
  CREATE INDEX IDX_asistencia_dia_segmento ON asistencia_diaria_resumen (segmento_nombre);
