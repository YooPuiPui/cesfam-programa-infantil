-- CreateEnum
CREATE TYPE "EstadoConvocatoria" AS ENUM ('no_contactado', 'contactado', 'confirma', 'no_confirma', 'no_contesta', 'no_puede', 'reconfirmar');

-- CreateEnum
CREATE TYPE "EstadoAsistencia" AS ENUM ('pendiente', 'asiste', 'no_asiste');

-- CreateTable
CREATE TABLE "Taller" (
    "id_taller" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "edad_min" INTEGER NOT NULL DEFAULT 0,
    "edad_max" INTEGER NOT NULL DEFAULT 17,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Taller_pkey" PRIMARY KEY ("id_taller")
);

-- CreateTable
CREATE TABLE "SesionTaller" (
    "id_sesion" SERIAL NOT NULL,
    "id_taller" INTEGER NOT NULL,
    "fecha" DATE NOT NULL,
    "cupo_maximo" INTEGER,
    "rut_profesional" VARCHAR(12),
    "profesional_externo" VARCHAR(150),
    "observaciones" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SesionTaller_pkey" PRIMARY KEY ("id_sesion")
);

-- CreateTable
CREATE TABLE "InscripcionTaller" (
    "id_inscripcion" SERIAL NOT NULL,
    "rut_paciente" TEXT NOT NULL,
    "id_sesion" INTEGER NOT NULL,
    "estado_convocatoria" "EstadoConvocatoria" NOT NULL DEFAULT 'no_contactado',
    "estado_asistencia" "EstadoAsistencia" NOT NULL DEFAULT 'pendiente',
    "telefono_contacto" VARCHAR(20),
    "observaciones" TEXT,
    "fecha_contacto" TIMESTAMP(3),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InscripcionTaller_pkey" PRIMARY KEY ("id_inscripcion")
);

-- CreateIndex
CREATE UNIQUE INDEX "Taller_nombre_key" ON "Taller"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "InscripcionTaller_rut_paciente_id_sesion_key" ON "InscripcionTaller"("rut_paciente", "id_sesion");

-- AddForeignKey
ALTER TABLE "SesionTaller" ADD CONSTRAINT "SesionTaller_id_taller_fkey" FOREIGN KEY ("id_taller") REFERENCES "Taller"("id_taller") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SesionTaller" ADD CONSTRAINT "SesionTaller_rut_profesional_fkey" FOREIGN KEY ("rut_profesional") REFERENCES "Profesional"("rut") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InscripcionTaller" ADD CONSTRAINT "InscripcionTaller_rut_paciente_fkey" FOREIGN KEY ("rut_paciente") REFERENCES "Paciente"("rut") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InscripcionTaller" ADD CONSTRAINT "InscripcionTaller_id_sesion_fkey" FOREIGN KEY ("id_sesion") REFERENCES "SesionTaller"("id_sesion") ON DELETE RESTRICT ON UPDATE CASCADE;
