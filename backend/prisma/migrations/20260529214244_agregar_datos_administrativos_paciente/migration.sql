-- CreateTable
CREATE TABLE "Profesional" (
    "id_profesional" SERIAL NOT NULL,
    "rut" VARCHAR(15) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "apellido" VARCHAR(100) NOT NULL,
    "estamento" VARCHAR(50) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Profesional_pkey" PRIMARY KEY ("id_profesional")
);

-- CreateTable
CREATE TABLE "Tutor" (
    "id_tutor" SERIAL NOT NULL,
    "rut" VARCHAR(12),
    "nombre" VARCHAR(100) NOT NULL,
    "apellido" VARCHAR(100) NOT NULL,
    "telefono" VARCHAR(15) NOT NULL,
    "parentesco" VARCHAR(50) NOT NULL,
    "correo" VARCHAR(100),
    "direccion" VARCHAR(100) NOT NULL,
    "sector" VARCHAR(100),
    "comuna" VARCHAR(100) NOT NULL,

    CONSTRAINT "Tutor_pkey" PRIMARY KEY ("id_tutor")
);

-- CreateTable
CREATE TABLE "Paciente" (
    "id_paciente" SERIAL NOT NULL,
    "rut" VARCHAR(15) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "apellido" VARCHAR(100) NOT NULL,
    "nombre_social" VARCHAR(100),
    "fecha_nacimiento" DATE NOT NULL,
    "sexo_biologico" VARCHAR(20) NOT NULL,
    "identidad_genero" VARCHAR(50),
    "nacionalidad" VARCHAR(50) DEFAULT 'Chilena',
    "direccion" TEXT NOT NULL,
    "sector" VARCHAR(50),
    "comuna" VARCHAR(50) NOT NULL,
    "nhc" VARCHAR(50),
    "prevision" VARCHAR(50),
    "fecha_inscripcion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "es_sename" BOOLEAN NOT NULL DEFAULT false,
    "es_naneas_prematuro" BOOLEAN NOT NULL DEFAULT false,
    "es_poblacion_trans" BOOLEAN NOT NULL DEFAULT false,
    "es_migrante" BOOLEAN NOT NULL DEFAULT false,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_tutor_principal" INTEGER NOT NULL,

    CONSTRAINT "Paciente_pkey" PRIMARY KEY ("id_paciente")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profesional_rut_key" ON "Profesional"("rut");

-- CreateIndex
CREATE UNIQUE INDEX "Tutor_rut_key" ON "Tutor"("rut");

-- CreateIndex
CREATE UNIQUE INDEX "Paciente_rut_key" ON "Paciente"("rut");

-- AddForeignKey
ALTER TABLE "Paciente" ADD CONSTRAINT "Paciente_id_tutor_principal_fkey" FOREIGN KEY ("id_tutor_principal") REFERENCES "Tutor"("id_tutor") ON DELETE RESTRICT ON UPDATE CASCADE;
