-- Columna documento_agente en wfsm_seriales_recuperados: cédula del AGENTE de
-- campo, para poder buscar por documento y no solo por nombre.
--
-- En la respuesta de WFS el campo se llama documento_identidad, nombre que
-- despista porque NO es el documento del cliente (ese es cedula_cliente).
-- Comprobado sobre un día completo (11.119 registros): documento_identidad
-- tiene 224 valores distintos, exactamente los mismos que agentes hay, y
-- ninguno aparece ligado a dos agentes; cedula_cliente tiene 4.884 distintos
-- y nunca coincide con documento_identidad en el mismo registro.
--
-- Ejecutar manualmente en TEST y PROD ANTES de desplegar: synchronize está
-- desactivado fuera de development y verify-schema.js bloquea el despliegue
-- si la columna no existe.

IF NOT EXISTS (
  SELECT 1 FROM sys.columns
   WHERE object_id = OBJECT_ID('wfsm_seriales_recuperados')
     AND name = 'documento_agente'
)
BEGIN
  ALTER TABLE wfsm_seriales_recuperados
    ADD documento_agente NVARCHAR(50) NULL;
END
GO

-- Índice para que el filtro por (fecha, documento_agente) no haga scan.
IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
   WHERE name = 'IDX_wfsm_seriales_fecha_documento_agente'
     AND object_id = OBJECT_ID('wfsm_seriales_recuperados')
)
BEGIN
  CREATE INDEX IDX_wfsm_seriales_fecha_documento_agente
      ON wfsm_seriales_recuperados (fecha, documento_agente);
END
GO

-- Las filas ya cacheadas quedan con documento_agente NULL hasta que su día se
-- vuelva a sincronizar (el TTL de sincronización es de 15 minutos). Para
-- forzar el refresco inmediato de todo lo cacheado, vaciar el estado de sync:
--
--   DELETE FROM wfsm_sync_estado;
--
-- La siguiente consulta de cada fecha la volverá a traer desde WFS.
