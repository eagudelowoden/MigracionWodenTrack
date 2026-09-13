-- Reconstruye wfsm_seriales_recuperados con llave subrogada, y de paso rellena
-- documento_agente desde el JSON (reemplaza al script de backfill: aquí la
-- columna se puebla al copiar).
--
-- POR QUÉ
-- La PK era id_visita, pero WFS devuelve UNA FILA POR SERIAL recuperado y una
-- misma visita puede traer decenas. Todos los seriales de una visita chocaban
-- contra la misma llave y se perdían todos menos uno.
--   Medido el 2026-09-12: la API devolvió 5.442 registros y la tabla guardaba
--   2.513 filas. Una visita (32434439) traía 45 seriales y quedaba con 1.
--
-- QUÉ HACE
-- Crea la tabla nueva, copia lo que había, y renombra. La tabla vieja NO se
-- borra: queda como wfsm_seriales_recuperados_old para poder volver atrás.
-- Bórrala tú cuando hayas verificado (al final del script está la sentencia).
--
-- Ejecutar en TEST y PROD ANTES de desplegar: synchronize está desactivado y
-- verify-schema.js bloquea el despliegue si el esquema no coincide.

SET XACT_ABORT ON;

-- ── 0. Guarda de re-ejecución ───────────────────────────────────────────────
-- Si la tabla ya tiene la columna "id", la migración ya se aplicó. NOEXEC hace
-- que los lotes siguientes se analicen pero no se ejecuten, de modo que volver
-- a correr el script no rompe nada ni duplica datos.
IF COL_LENGTH('wfsm_seriales_recuperados', 'id') IS NOT NULL
BEGIN
  PRINT '*** La migración YA fue aplicada en esta base. No se hace nada. ***';
  SET NOEXEC ON;
END
GO

-- ── 1. Estado previo ────────────────────────────────────────────────────────
SELECT COUNT(*) AS filas_antes,
       COUNT(DISTINCT id_visita) AS visitas,
       SUM(CASE WHEN documento_agente IS NULL THEN 1 ELSE 0 END) AS sin_documento
  FROM wfsm_seriales_recuperados;
GO


-- ── 2. Tabla nueva ──────────────────────────────────────────────────────────
IF OBJECT_ID('wfsm_seriales_recuperados_v2') IS NOT NULL
  DROP TABLE wfsm_seriales_recuperados_v2;
GO

CREATE TABLE wfsm_seriales_recuperados_v2 (
  id               INT IDENTITY(1,1) NOT NULL,
  id_visita        BIGINT        NOT NULL,   -- ya NO es llave: se repite por serial
  fecha            NVARCHAR(10)  NOT NULL,
  cedula_cliente   NVARCHAR(50)  NULL,
  agente_campo     NVARCHAR(255) NULL,
  documento_agente NVARCHAR(50)  NULL,       -- cédula del AGENTE (documento_identidad)
  estatus          NVARCHAR(100) NULL,
  comprobante_link NVARCHAR(500) NULL,
  datos            NVARCHAR(MAX) NOT NULL,
  actualizado_en   DATETIME2     NOT NULL
    CONSTRAINT DF_wfsm_seriales_v2_actualizado DEFAULT GETDATE(),
  CONSTRAINT PK_wfsm_seriales_recuperados_v2 PRIMARY KEY CLUSTERED (id)
);
GO


-- ── 3. Copiar lo existente, rellenando documento_agente ─────────────────────
-- Nota: lo copiado sigue teniendo un solo serial por visita (es lo que había).
-- Los seriales faltantes vuelven cuando el cron re-sincronice cada fecha.
INSERT INTO wfsm_seriales_recuperados_v2
      (id_visita, fecha, cedula_cliente, agente_campo, documento_agente,
       estatus, comprobante_link, datos, actualizado_en)
SELECT id_visita, fecha, cedula_cliente, agente_campo,
       COALESCE(documento_agente,
                CASE WHEN ISJSON(datos) = 1
                     THEN JSON_VALUE(datos, '$.documento_identidad')
                END),
       estatus, comprobante_link, datos, actualizado_en
  FROM wfsm_seriales_recuperados;
GO


-- ── 4. Índices (los mismos que declaran los decoradores @Index) ─────────────
CREATE INDEX IDX_wfsm_seriales_v2_fecha_cedula_cliente
    ON wfsm_seriales_recuperados_v2 (fecha, cedula_cliente);
CREATE INDEX IDX_wfsm_seriales_v2_fecha_agente_campo
    ON wfsm_seriales_recuperados_v2 (fecha, agente_campo);
CREATE INDEX IDX_wfsm_seriales_v2_fecha_documento_agente
    ON wfsm_seriales_recuperados_v2 (fecha, documento_agente);
CREATE INDEX IDX_wfsm_seriales_v2_id_visita
    ON wfsm_seriales_recuperados_v2 (id_visita);
GO


-- ── 5. Intercambio ──────────────────────────────────────────────────────────
EXEC sp_rename 'wfsm_seriales_recuperados',    'wfsm_seriales_recuperados_old';
EXEC sp_rename 'wfsm_seriales_recuperados_v2', 'wfsm_seriales_recuperados';
GO

-- La PK y los índices conservan el nombre "_v2" tras el rename de la tabla
-- (SQL Server NO renombra las restricciones al renombrar la tabla) y sus
-- nombres son únicos en toda la base: si no se renombran, volver a ejecutar
-- este script falla con "There is already an object named 'PK_..._v2'".
-- Cada rename va protegido: si el objeto ya tiene el nombre final (porque el
-- script se corrió antes hasta este punto), se omite en vez de abortar con
-- "Either the parameter @objname is ambiguous...".
IF OBJECT_ID('PK_wfsm_seriales_recuperados_v2') IS NOT NULL
  EXEC sp_rename 'PK_wfsm_seriales_recuperados_v2', 'PK_wfsm_seriales_recuperados', 'OBJECT';
GO

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IDX_wfsm_seriales_v2_fecha_cedula_cliente'
             AND object_id = OBJECT_ID('wfsm_seriales_recuperados'))
  EXEC sp_rename 'wfsm_seriales_recuperados.IDX_wfsm_seriales_v2_fecha_cedula_cliente', 'IDX_wfsm_seriales_fecha_cedula_cliente', 'INDEX';
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IDX_wfsm_seriales_v2_fecha_agente_campo'
             AND object_id = OBJECT_ID('wfsm_seriales_recuperados'))
  EXEC sp_rename 'wfsm_seriales_recuperados.IDX_wfsm_seriales_v2_fecha_agente_campo', 'IDX_wfsm_seriales_fecha_agente_campo', 'INDEX';
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IDX_wfsm_seriales_v2_fecha_documento_agente'
             AND object_id = OBJECT_ID('wfsm_seriales_recuperados'))
  EXEC sp_rename 'wfsm_seriales_recuperados.IDX_wfsm_seriales_v2_fecha_documento_agente', 'IDX_wfsm_seriales_fecha_documento_agente', 'INDEX';
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IDX_wfsm_seriales_v2_id_visita'
             AND object_id = OBJECT_ID('wfsm_seriales_recuperados'))
  EXEC sp_rename 'wfsm_seriales_recuperados.IDX_wfsm_seriales_v2_id_visita', 'IDX_wfsm_seriales_id_visita', 'INDEX';
GO


-- ── 6. Verificación ─────────────────────────────────────────────────────────
SELECT COUNT(*) AS filas_despues,
       SUM(CASE WHEN documento_agente IS NULL THEN 1 ELSE 0 END) AS sin_documento
  FROM wfsm_seriales_recuperados;
GO


SET NOEXEC OFF;
GO


-- ── 7. Limpieza (ejecutar SOLO tras verificar que todo funciona) ────────────
-- DROP TABLE wfsm_seriales_recuperados_old;
