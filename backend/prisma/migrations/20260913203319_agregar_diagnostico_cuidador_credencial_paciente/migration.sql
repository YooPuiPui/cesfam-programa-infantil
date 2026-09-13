-- CreateEnum
CREATE TYPE "EstadoCredencialDiscapacidad" AS ENUM ('sin_dato', 'si', 'no', 'en_tramite');

-- AlterTable
ALTER TABLE "Paciente" ADD COLUMN     "credencial_discapacidad" "EstadoCredencialDiscapacidad" NOT NULL DEFAULT 'sin_dato',
ADD COLUMN     "credencial_discapacidad_detalle" TEXT,
ADD COLUMN     "cuidador_nombre" VARCHAR(100),
ADD COLUMN     "cuidador_parentesco" VARCHAR(50),
ADD COLUMN     "cuidador_telefono" VARCHAR(15),
ADD COLUMN     "diagnosticos" TEXT[],
ADD COLUMN     "es_salud_mental" BOOLEAN NOT NULL DEFAULT false;
