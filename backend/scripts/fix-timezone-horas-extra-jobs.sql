-- Corrige el DEFAULT de created_at/updated_at en horas_extra_jobs.
-- Problema: la columna usaba GETDATE() (hora LOCAL del servidor SQL), mientras
-- que started_at/finished_at usan SYSUTCDATETIME() (UTC). El frontend asume que
-- todo lo que llega de la BD es UTC y le resta 5h para Bogotá, así que la fecha
-- mostrada en "Últimas Ejecuciones" queda desfasada.
-- Este script SOLO cambia el default para inserciones futuras; no corrige
-- registros históricos (ya guardados con la hora local del servidor).

DECLARE @constraintName NVARCHAR(200);

-- created_at
SELECT @constraintName = dc.name
FROM sys.default_constraints dc
JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
WHERE dc.parent_object_id = OBJECT_ID('horas_extra_jobs') AND c.name = 'created_at';
IF @constraintName IS NOT NULL
  EXEC('ALTER TABLE horas_extra_jobs DROP CONSTRAINT ' + @constraintName);
ALTER TABLE horas_extra_jobs ADD CONSTRAINT DF_horas_extra_jobs_created_at DEFAULT SYSUTCDATETIME() FOR created_at;

-- updated_at
SET @constraintName = NULL;
SELECT @constraintName = dc.name
FROM sys.default_constraints dc
JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
WHERE dc.parent_object_id = OBJECT_ID('horas_extra_jobs') AND c.name = 'updated_at';
IF @constraintName IS NOT NULL
  EXEC('ALTER TABLE horas_extra_jobs DROP CONSTRAINT ' + @constraintName);
ALTER TABLE horas_extra_jobs ADD CONSTRAINT DF_horas_extra_jobs_updated_at DEFAULT SYSUTCDATETIME() FOR updated_at;
