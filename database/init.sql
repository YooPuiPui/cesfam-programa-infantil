-- Crear tabla de pacientes (ejemplo básico)
CREATE TABLE pacientes (
    id SERIAL PRIMARY KEY,
    rut VARCHAR(12) UNIQUE NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de controles (ejemplo básico)
CREATE TABLE controles (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER REFERENCES pacientes(id),
    tipo_control VARCHAR(50) NOT NULL,
    peso DECIMAL(5,2),
    talla DECIMAL(5,2),
    fecha_control DATE NOT NULL
);

-- Insertar datos de prueba
INSERT INTO pacientes (rut, nombres, apellidos, fecha_nacimiento) VALUES
('23456789-0', 'Lucas', 'Pérez Soto', '2022-05-15'),
('24567890-1', 'Martina', 'González Ríos', '2023-01-10');

INSERT INTO controles (paciente_id, tipo_control, peso, talla, fecha_control) VALUES
(1, 'Control 1 Año', 10.5, 75.2, '2023-05-16'),
(2, 'Control 2 Meses', 5.2, 58.0, '2023-03-12');