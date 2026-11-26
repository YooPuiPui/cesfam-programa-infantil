-- CreateEnum
CREATE TYPE "MotivoDesactivacion" AS ENUM ('TRASLADO', 'EGRESO_POR_EDAD', 'FALLECIMIENTO', 'NO_DESEA_CONTINUAR', 'INUBICABLE', 'ERROR_DE_REGISTRO', 'OTRO');

-- AlterTable
ALTER TABLE "Paciente" ADD COLUMN     "detalle_desactivacion" VARCHAR(200),
ADD COLUMN     "fecha_desactivacion" TIMESTAMP(3),
ADD COLUMN     "motivo_desactivacion" "MotivoDesactivacion";
