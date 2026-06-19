-- CreateTable
CREATE TABLE "ControlClinico" (
    "id_control" SERIAL NOT NULL,
    "fecha_control" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "edad_meses" INTEGER NOT NULL,
    "peso_kg" DOUBLE PRECISION NOT NULL,
    "talla_cm" DOUBLE PRECISION NOT NULL,
    "perimetro_cefalico" DOUBLE PRECISION,
    "imc" DOUBLE PRECISION NOT NULL,
    "presion_arterial" VARCHAR(30),
    "diagnostico_nutricional" VARCHAR(500),
    "tipo_lactancia" VARCHAR(100),
    "resultado_dpm" VARCHAR(100),
    "meses_dpm_aplicado" INTEGER,
    "score_ira" VARCHAR(100),
    "problemas_diagnosticos" TEXT,
    "indicaciones_acuerdos" TEXT,
    "fecha_proximoControl" DATE NOT NULL,
    "id_paciente" INTEGER NOT NULL,
    "id_profesional" INTEGER NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ControlClinico_pkey" PRIMARY KEY ("id_control")
);

-- AddForeignKey
ALTER TABLE "ControlClinico" ADD CONSTRAINT "ControlClinico_id_paciente_fkey" FOREIGN KEY ("id_paciente") REFERENCES "Paciente"("id_paciente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ControlClinico" ADD CONSTRAINT "ControlClinico_id_profesional_fkey" FOREIGN KEY ("id_profesional") REFERENCES "Profesional"("id_profesional") ON DELETE RESTRICT ON UPDATE CASCADE;
