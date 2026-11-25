/*
  Reemplaza el arreglo Paciente.diagnosticos por un catálogo (Diagnostico) y las tablas
  PacienteDiagnostico (condiciones de base) y ControlDiagnostico (diagnósticos de cada control).

  El SQL fue editado a mano: la columna "diagnosticos" se elimina recién al final, después de
  copiar su contenido y comprobar que no se perdió ningún par (paciente, diagnóstico).
  Los controles antiguos conservan su texto en "problemas_diagnosticados" y no se migran.
*/

-- ==================== 1. Estructura ====================

-- CreateEnum
CREATE TYPE "TipoDiagnostico" AS ENUM ('CONDICION', 'CONTROL');

-- AlterTable
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "Diagnostico" (
    "id_diagnostico" SERIAL NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "tipo" "TipoDiagnostico" NOT NULL,
    "codigo_cie10" VARCHAR(10),
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Diagnostico_pkey" PRIMARY KEY ("id_diagnostico")
);

-- CreateTable
CREATE TABLE "PacienteDiagnostico" (
    "id_paciente" INTEGER NOT NULL,
    "id_diagnostico" INTEGER NOT NULL,

    CONSTRAINT "PacienteDiagnostico_pkey" PRIMARY KEY ("id_paciente","id_diagnostico")
);

-- CreateTable
CREATE TABLE "ControlDiagnostico" (
    "id_control" INTEGER NOT NULL,
    "id_diagnostico" INTEGER NOT NULL,

    CONSTRAINT "ControlDiagnostico_pkey" PRIMARY KEY ("id_control","id_diagnostico")
);

-- CreateIndex
CREATE UNIQUE INDEX "Diagnostico_nombre_key" ON "Diagnostico"("nombre");

-- CreateIndex
CREATE INDEX "Diagnostico_tipo_activo_idx" ON "Diagnostico"("tipo", "activo");

-- CreateIndex
CREATE INDEX "PacienteDiagnostico_id_diagnostico_idx" ON "PacienteDiagnostico"("id_diagnostico");

-- CreateIndex
CREATE INDEX "ControlDiagnostico_id_diagnostico_idx" ON "ControlDiagnostico"("id_diagnostico");

-- CreateIndex
CREATE INDEX "ControlClinico_rut_paciente_fecha_control_idx" ON "ControlClinico"("rut_paciente", "fecha_control");

-- CreateIndex
CREATE INDEX "ControlClinico_fecha_proximoControl_idx" ON "ControlClinico"("fecha_proximoControl");

-- CreateIndex
CREATE INDEX "InscripcionTaller_id_sesion_idx" ON "InscripcionTaller"("id_sesion");

-- CreateIndex
CREATE INDEX "Paciente_id_tutor_principal_idx" ON "Paciente"("id_tutor_principal");

-- CreateIndex
CREATE INDEX "SesionTaller_id_taller_fecha_idx" ON "SesionTaller"("id_taller", "fecha");

-- AddForeignKey
ALTER TABLE "PacienteDiagnostico" ADD CONSTRAINT "PacienteDiagnostico_id_paciente_fkey" FOREIGN KEY ("id_paciente") REFERENCES "Paciente"("id_paciente") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PacienteDiagnostico" ADD CONSTRAINT "PacienteDiagnostico_id_diagnostico_fkey" FOREIGN KEY ("id_diagnostico") REFERENCES "Diagnostico"("id_diagnostico") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ControlDiagnostico" ADD CONSTRAINT "ControlDiagnostico_id_control_fkey" FOREIGN KEY ("id_control") REFERENCES "ControlClinico"("id_control") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ControlDiagnostico" ADD CONSTRAINT "ControlDiagnostico_id_diagnostico_fkey" FOREIGN KEY ("id_diagnostico") REFERENCES "Diagnostico"("id_diagnostico") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ==================== 2. Catálogo inicial ====================

INSERT INTO "Diagnostico" ("nombre", "tipo", "codigo_cie10") VALUES
    ('TEA', 'CONDICION', 'F84.0'),
    ('Obs TEA', 'CONDICION', 'Z03.2'),
    ('TEA Grado 1', 'CONDICION', NULL),
    ('TEA Grado 2', 'CONDICION', NULL),
    ('TEA GRADO 3', 'CONDICION', NULL),
    ('TEA NO VERBAL', 'CONDICION', NULL),
    ('TEA (SD DE ASPERGER)', 'CONDICION', NULL),
    ('SINDROME DE ASPERGER', 'CONDICION', NULL),
    ('TRASTORNOS GENERALIZADOS DEL DESARROLLO', 'CONDICION', 'F84.9'),
    ('TDAH', 'CONDICION', 'F90.0'),
    ('TOD', 'CONDICION', NULL),
    ('Trastorno Conductual', 'CONDICION', NULL),
    ('Trastorno Ansioso', 'CONDICION', 'F41.9'),
    ('MUTISMO', 'CONDICION', NULL),
    ('TEL', 'CONDICION', NULL),
    ('TEL Expresivo', 'CONDICION', 'F80.1'),
    ('Apraxia del Habla', 'CONDICION', NULL),
    ('Dispraxia', 'CONDICION', NULL),
    ('DI', 'CONDICION', NULL),
    ('DI leve', 'CONDICION', NULL),
    ('RETRASO DSM', 'CONDICION', NULL),
    ('FIL', 'CONDICION', NULL),
    ('TIS', 'CONDICION', NULL),
    ('Epilepsia', 'CONDICION', 'G40.9'),
    ('PARALISIS CEREBRAL', 'CONDICION', 'G80.9'),
    ('HIDROCEFALIA', 'CONDICION', NULL),
    ('MICROCEFALIA', 'CONDICION', NULL),
    ('CHIARI G1', 'CONDICION', NULL),
    ('OBS NEUROFIBROMATOSIS', 'CONDICION', NULL),
    ('Síndrome de Down', 'CONDICION', 'Q90.9'),
    ('En Estudio de Genética', 'CONDICION', NULL),
    ('HIPOTONIA CONGENITA', 'CONDICION', NULL),
    ('MALFORMACIÓN ANORRECTAL', 'CONDICION', NULL),
    ('SIFILIS CONGENITA', 'CONDICION', NULL),
    ('PREMATURA', 'CONDICION', NULL),
    ('PREMATURA 34 SEMANAS', 'CONDICION', NULL),
    ('PREMATURO 30 SEMANAS', 'CONDICION', NULL),
    ('PREMATURO 31 SEMANAS', 'CONDICION', NULL),
    ('ASMA', 'CONDICION', 'J45.9'),
    ('RINITIS', 'CONDICION', NULL),
    ('Hipotiroidismo', 'CONDICION', 'E03.9'),
    ('DIABETES MELLITUS', 'CONDICION', NULL),
    ('HIPERTENSION ARTERIAL', 'CONDICION', NULL),
    ('DEPENDIENTE SEVERO', 'CONDICION', NULL),
    ('Estado nutricional normal', 'CONTROL', NULL),
    ('Riesgo de desnutrir', 'CONTROL', NULL),
    ('Desnutrición', 'CONTROL', 'E46'),
    ('Sobrepeso', 'CONTROL', NULL),
    ('Obesidad', 'CONTROL', 'E66.9'),
    ('Requiere seguimiento nutricional', 'CONTROL', NULL),
    ('Desarrollo psicomotor acorde a la edad', 'CONTROL', NULL),
    ('Riesgo de retraso del desarrollo psicomotor', 'CONTROL', NULL),
    ('Retraso del desarrollo psicomotor', 'CONTROL', 'R62.0'),
    ('Rinofaringitis aguda (resfriado común)', 'CONTROL', 'J00'),
    ('Síndrome febril sin foco aparente', 'CONTROL', 'R50.9'),
    ('Amigdalitis aguda', 'CONTROL', 'J03.9'),
    ('Síndrome bronquial obstructivo', 'CONTROL', NULL),
    ('Gastroenteritis aguda', 'CONTROL', 'A09.9'),
    ('Adolescente sano', 'CONTROL', 'Z00.3'),
    ('Apto para inmunización según esquema PNI', 'CONTROL', NULL),
    ('Esquema de inmunización incompleto', 'CONTROL', NULL),
    ('Seguimiento NANEAS sin descompensación', 'CONTROL', NULL),
    ('Seguimiento NANEAS con descompensación', 'CONTROL', NULL),
    ('Evolución favorable en terapias', 'CONTROL', NULL),
    ('Episodios de desregulación', 'CONTROL', NULL),
    ('En observación, sin diagnóstico definido', 'CONTROL', 'Z03.9')
ON CONFLICT ("nombre") DO NOTHING;

-- ==================== 3. Valores del arreglo que no están en el catálogo ====================

INSERT INTO "Diagnostico" ("nombre", "tipo")
SELECT DISTINCT btrim(u.nombre, E' \t\n\r\f\u00A0'), 'CONDICION'::"TipoDiagnostico"
FROM "Paciente" p
CROSS JOIN LATERAL unnest(p."diagnosticos") AS u(nombre)
WHERE btrim(u.nombre, E' \t\n\r\f\u00A0') <> ''
ON CONFLICT ("nombre") DO NOTHING;

-- ==================== 4. Copia a PacienteDiagnostico ====================

INSERT INTO "PacienteDiagnostico" ("id_paciente", "id_diagnostico")
SELECT p."id_paciente", d."id_diagnostico"
FROM "Paciente" p
CROSS JOIN LATERAL unnest(p."diagnosticos") AS u(nombre)
JOIN "Diagnostico" d ON d."nombre" = btrim(u.nombre, E' \t\n\r\f\u00A0')
ON CONFLICT DO NOTHING;

-- ==================== 5. Verificación: si no calza, la migración se detiene ====================

DO $$
DECLARE
    esperados BIGINT;
    copiados BIGINT;
BEGIN
    SELECT COUNT(*) INTO esperados FROM (
        SELECT DISTINCT p."id_paciente", btrim(u.nombre, E' \t\n\r\f\u00A0')
        FROM "Paciente" p
        CROSS JOIN LATERAL unnest(p."diagnosticos") AS u(nombre)
        WHERE btrim(u.nombre, E' \t\n\r\f\u00A0') <> ''
    ) AS pares;

    SELECT COUNT(*) INTO copiados FROM "PacienteDiagnostico";

    IF esperados <> copiados THEN
        RAISE EXCEPTION 'Copia de diagnósticos incompleta: % pares en el arreglo y % filas en PacienteDiagnostico', esperados, copiados;
    END IF;
END $$;

-- ==================== 6. Eliminación del arreglo ====================

-- AlterTable
ALTER TABLE "Paciente" DROP COLUMN "diagnosticos";
