/*
  Warnings:

  - You are about to drop the column `id_profesional` on the `ControlClinico` table. All the data in the column will be lost.
  - You are about to drop the column `rut_tutor_principal` on the `Paciente` table. All the data in the column will be lost.
  - Added the required column `rut_profesional` to the `ControlClinico` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id_tutor_principal` to the `Paciente` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ControlClinico" DROP CONSTRAINT "ControlClinico_id_profesional_fkey";

-- DropForeignKey
ALTER TABLE "Paciente" DROP CONSTRAINT "Paciente_rut_tutor_principal_fkey";

-- AlterTable
ALTER TABLE "ControlClinico" DROP COLUMN "id_profesional",
ADD COLUMN     "rut_profesional" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Paciente" DROP COLUMN "rut_tutor_principal",
ADD COLUMN     "id_tutor_principal" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Paciente" ADD CONSTRAINT "Paciente_id_tutor_principal_fkey" FOREIGN KEY ("id_tutor_principal") REFERENCES "Tutor"("id_tutor") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ControlClinico" ADD CONSTRAINT "ControlClinico_rut_profesional_fkey" FOREIGN KEY ("rut_profesional") REFERENCES "Profesional"("rut") ON DELETE RESTRICT ON UPDATE CASCADE;
