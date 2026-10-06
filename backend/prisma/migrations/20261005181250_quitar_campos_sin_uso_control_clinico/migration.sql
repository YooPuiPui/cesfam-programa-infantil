/*
  Warnings:

  - You are about to drop the column `diagnostico_nutricional` on the `ControlClinico` table. All the data in the column will be lost.
  - You are about to drop the column `meses_dpm_aplicado` on the `ControlClinico` table. All the data in the column will be lost.
  - You are about to drop the column `presion_arterial` on the `ControlClinico` table. All the data in the column will be lost.
  - You are about to drop the column `resultado_dpm` on the `ControlClinico` table. All the data in the column will be lost.
  - You are about to drop the column `score_ira` on the `ControlClinico` table. All the data in the column will be lost.
  - You are about to drop the column `tipo_lactancia` on the `ControlClinico` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ControlClinico" DROP COLUMN "diagnostico_nutricional",
DROP COLUMN "meses_dpm_aplicado",
DROP COLUMN "presion_arterial",
DROP COLUMN "resultado_dpm",
DROP COLUMN "score_ira",
DROP COLUMN "tipo_lactancia";
