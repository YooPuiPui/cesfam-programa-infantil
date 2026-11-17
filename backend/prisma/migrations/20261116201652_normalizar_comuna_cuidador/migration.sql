/*
  Normaliza la comuna y el cuidador.

  - Crea las tablas "Comuna" y "Cuidador".
  - Reemplaza Paciente.comuna y Tutor.comuna por id_comuna (FK a Comuna).
  - Reemplaza Paciente.cuidador_nombre/telefono/parentesco por id_cuidador (FK a Cuidador).

  Antes de borrar las columnas antiguas, los datos existentes se mueven a las
  tablas nuevas, así que la migración funciona sobre una base con datos.
  Si hay un paciente con teléfono o parentesco de cuidador pero sin nombre,
  la migración se aborta (no se pierde nada).
*/

-- 1. Crear la tabla Comuna
CREATE TABLE "Comuna" (
    "id_comuna" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,

    CONSTRAINT "Comuna_pkey" PRIMARY KEY ("id_comuna")
);

-- 2. Crear la tabla Cuidador
CREATE TABLE "Cuidador" (
    "id_cuidador" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "telefono" VARCHAR(15),
    "parentesco" VARCHAR(50),

    CONSTRAINT "Cuidador_pkey" PRIMARY KEY ("id_cuidador")
);

-- 3. Nombre de comuna único
CREATE UNIQUE INDEX "Comuna_nombre_key" ON "Comuna"("nombre");

-- 4. Agregar las columnas nuevas (id_comuna todavía sin NOT NULL)
ALTER TABLE "Paciente" ADD COLUMN "id_comuna" INTEGER,
ADD COLUMN "id_cuidador" INTEGER;

ALTER TABLE "Tutor" ADD COLUMN "id_comuna" INTEGER;

-- 5. Revisión de seguridad: no se puede crear un cuidador sin nombre
DO $$
DECLARE
    cantidad INTEGER;
BEGIN
    SELECT count(*) INTO cantidad
    FROM "Paciente"
    WHERE btrim(coalesce("cuidador_nombre", '')) = ''
      AND (btrim(coalesce("cuidador_telefono", '')) <> ''
           OR btrim(coalesce("cuidador_parentesco", '')) <> '');

    IF cantidad > 0 THEN
        RAISE EXCEPTION 'Migración abortada: hay % paciente(s) con teléfono o parentesco de cuidador pero sin nombre de cuidador. Corrige esos datos antes de migrar para no perder información.', cantidad;
    END IF;
END $$;

-- 6. Poblar Comuna con las comunas existentes (Paciente y Tutor)
--    Se limpian los espacios y se unifican las variantes de la misma comuna
--    (sin importar mayúsculas, espacios ni tildes). Se usa la grafía más frecuente.
INSERT INTO "Comuna" ("nombre")
SELECT "nombre"
FROM (
    SELECT DISTINCT ON ("clave") "clave", "nombre"
    FROM (
        SELECT
            translate(lower("limpia"), 'áéíóúñü', 'aeiounu') AS "clave",
            "limpia" AS "nombre",
            count(*) AS "cantidad"
        FROM (
            SELECT coalesce(nullif(btrim(regexp_replace("comuna", '\s+', ' ', 'g')), ''), 'Sin dato') AS "limpia"
            FROM "Paciente"
            UNION ALL
            SELECT coalesce(nullif(btrim(regexp_replace("comuna", '\s+', ' ', 'g')), ''), 'Sin dato') AS "limpia"
            FROM "Tutor"
        ) AS "valores"
        GROUP BY "limpia"
    ) AS "grafias"
    ORDER BY "clave", "cantidad" DESC, "nombre" ASC
) AS "canonicas"
ORDER BY "nombre";

-- 7. Enlazar cada paciente con su comuna
UPDATE "Paciente" AS p
SET "id_comuna" = c."id_comuna"
FROM "Comuna" AS c
WHERE translate(lower(coalesce(nullif(btrim(regexp_replace(p."comuna", '\s+', ' ', 'g')), ''), 'Sin dato')), 'áéíóúñü', 'aeiounu')
    = translate(lower(c."nombre"), 'áéíóúñü', 'aeiounu');

-- 8. Enlazar cada tutor con su comuna
UPDATE "Tutor" AS t
SET "id_comuna" = c."id_comuna"
FROM "Comuna" AS c
WHERE translate(lower(coalesce(nullif(btrim(regexp_replace(t."comuna", '\s+', ' ', 'g')), ''), 'Sin dato')), 'áéíóúñü', 'aeiounu')
    = translate(lower(c."nombre"), 'áéíóúñü', 'aeiounu');

-- 9. Columna temporal para saber de qué paciente viene cada cuidador
ALTER TABLE "Cuidador" ADD COLUMN "_id_paciente_origen" INTEGER;

-- 10. Crear un cuidador por cada paciente que tenga algún dato de cuidador
--     (no se fusionan cuidadores entre pacientes)
INSERT INTO "Cuidador" ("nombre", "telefono", "parentesco", "_id_paciente_origen")
SELECT
    btrim("cuidador_nombre"),
    nullif(btrim(coalesce("cuidador_telefono", '')), ''),
    nullif(btrim(coalesce("cuidador_parentesco", '')), ''),
    "id_paciente"
FROM "Paciente"
WHERE btrim(coalesce("cuidador_nombre", '')) <> ''
   OR btrim(coalesce("cuidador_telefono", '')) <> ''
   OR btrim(coalesce("cuidador_parentesco", '')) <> ''
ORDER BY "id_paciente";

-- 11. Enlazar cada paciente con su cuidador
UPDATE "Paciente" AS p
SET "id_cuidador" = cu."id_cuidador"
FROM "Cuidador" AS cu
WHERE cu."_id_paciente_origen" = p."id_paciente";

-- 12. Quitar la columna temporal
ALTER TABLE "Cuidador" DROP COLUMN "_id_paciente_origen";

-- 13. Ahora que todos tienen comuna, id_comuna pasa a ser obligatorio
ALTER TABLE "Paciente" ALTER COLUMN "id_comuna" SET NOT NULL;

ALTER TABLE "Tutor" ALTER COLUMN "id_comuna" SET NOT NULL;

-- 14. Claves foráneas
ALTER TABLE "Tutor" ADD CONSTRAINT "Tutor_id_comuna_fkey" FOREIGN KEY ("id_comuna") REFERENCES "Comuna"("id_comuna") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Paciente" ADD CONSTRAINT "Paciente_id_cuidador_fkey" FOREIGN KEY ("id_cuidador") REFERENCES "Cuidador"("id_cuidador") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Paciente" ADD CONSTRAINT "Paciente_id_comuna_fkey" FOREIGN KEY ("id_comuna") REFERENCES "Comuna"("id_comuna") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 15. Eliminar las columnas antiguas (los datos ya fueron movidos)
ALTER TABLE "Paciente" DROP COLUMN "comuna",
DROP COLUMN "cuidador_nombre",
DROP COLUMN "cuidador_parentesco",
DROP COLUMN "cuidador_telefono";

ALTER TABLE "Tutor" DROP COLUMN "comuna";
