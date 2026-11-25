-- Corrige la escritura de tres condiciones del catálogo. Solo cambia el nombre: se conservan el id,
-- el código CIE-10 y los pacientes enlazados.
-- Se puede ejecutar más de una vez. Si el nombre nuevo ya existe, esa fila no se toca.

UPDATE "Diagnostico" SET "nombre" = 'Asma'
WHERE "nombre" = 'ASMA'
  AND NOT EXISTS (SELECT 1 FROM "Diagnostico" WHERE "nombre" = 'Asma');

UPDATE "Diagnostico" SET "nombre" = 'Parálisis Cerebral'
WHERE "nombre" = 'PARALISIS CEREBRAL'
  AND NOT EXISTS (SELECT 1 FROM "Diagnostico" WHERE "nombre" = 'Parálisis Cerebral');

UPDATE "Diagnostico" SET "nombre" = 'Trastornos Generalizados del Desarrollo'
WHERE "nombre" = 'TRASTORNOS GENERALIZADOS DEL DESARROLLO'
  AND NOT EXISTS (SELECT 1 FROM "Diagnostico" WHERE "nombre" = 'Trastornos Generalizados del Desarrollo');
