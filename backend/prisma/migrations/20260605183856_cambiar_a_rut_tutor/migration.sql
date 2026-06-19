/*
  Warnings:

  - You are about to drop the column `id_paciente` on the `ControlClinico` table. All the data in the column will be lost.
  - You are about to drop the column `id_tutor_principal` on the `Paciente` table. All the data in the column will be lost.
  - You are about to alter the column `rut` on the `Profesional` table. The data in that column could be lost. The data in that column will be cast from `VarChar(15)` to `VarChar(12)`.
  - Added the required column `rut_paciente` to the `ControlClinico` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rut_tutor_principal` to the `Paciente` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ControlClinico" DROP CONSTRAINT "ControlClinico_id_paciente_fkey";

-- DropForeignKey
ALTER TABLE "Paciente" DROP CONSTRAINT "Paciente_id_tutor_principal_fkey";

-- AlterTable
ALTER TABLE "ControlClinico" DROP COLUMN "id_paciente",
ADD COLUMN     "rut_paciente" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Paciente" DROP COLUMN "id_tutor_principal",
ADD COLUMN     "rut_tutor_principal" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Profesional" ALTER COLUMN "rut" SET DATA TYPE VARCHAR(12);

-- AddForeignKey
ALTER TABLE "Paciente" ADD CONSTRAINT "Paciente_rut_tutor_principal_fkey" FOREIGN KEY ("rut_tutor_principal") REFERENCES "Tutor"("rut") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ControlClinico" ADD CONSTRAINT "ControlClinico_rut_paciente_fkey" FOREIGN KEY ("rut_paciente") REFERENCES "Paciente"("rut") ON DELETE RESTRICT ON UPDATE CASCADE;
