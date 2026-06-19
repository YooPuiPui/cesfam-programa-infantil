/*
  Warnings:

  - You are about to drop the column `problemas_diagnosticos` on the `ControlClinico` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ControlClinico" DROP COLUMN "problemas_diagnosticos",
ADD COLUMN     "problemas_diagnosticados" TEXT;
