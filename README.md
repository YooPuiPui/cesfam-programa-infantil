# CESFAM Programa Infantil

Sistema de gestión clínica para el **Programa Infantil** del CESFAM Santa Sabina. Permite administrar pacientes, tutores y profesionales, registrar controles clínicos (peso, talla, IMC), gestionar talleres NANEAS y sus inscripciones, generar reportes de evolución, e importar datos desde planillas Excel — todo bajo una arquitectura de contenedores (Frontend, Backend y Base de Datos).

## Tabla de contenidos
* [Descripción General](#descripción-general)
  * [Backend](#backend)
  * [Frontend](#frontend)
* [Arquitectura del Proyecto](#arquitectura-del-proyecto)
  * [Estructura del Backend](#estructura-del-backend)
  * [Estructura del Frontend](#estructura-del-frontend)
* [Tecnologías](#tecnologías)
  * [PostgreSQL](#postgresql)
  * [Prisma ORM](#prisma-orm)
  * [Express.js](#expressjs)
  * [React](#react)
  * [Node.js](#nodejs)
  * [Docker](#docker)
  * [Otros Recursos y Librerías](#otros-recursos-y-librerías)

## Descripción General 

`cesfam-programa-infantil` es el sistema de gestión clínica desarrollado como proyecto de título para el Programa Infantil del CESFAM Santa Sabina. Digitaliza el seguimiento de los niños y niñas inscritos en el programa, reemplazando registros manuales por una plataforma centralizada para el equipo de salud.

### Backend

El Backend implementa las siguientes funcionalidades principales:

- **Autenticación**: Uso de JWT (`jsonwebtoken`) y `bcrypt` para el inicio de sesión seguro de los profesionales.
- **Gestión de Pacientes**: CRUD completo de pacientes, incluyendo diagnósticos, credencial de discapacidad, programa de salud mental y datos del cuidador.
- **Gestión de Tutores**: Registro y administración de los tutores asociados a cada paciente.
- **Gestión de Profesionales**: Administración de los usuarios del equipo de salud que usan el sistema.
- **Controles Clínicos**: Registro de controles con validaciones clínicas por edad (peso solo bajo 2 años, IMC solo desde los 2 años).
- **Talleres NANEAS**: Administración de talleres, sus sesiones y las inscripciones de pacientes.
- **Reportes**: Generación de reportes de evolución (peso/talla) y caracterización de la población atendida.
- **Importación desde Excel**: Carga masiva de pacientes desde planillas Excel, con un modo de simulación (*dry-run*) antes de escribir los datos reales.

### Frontend

El Frontend proporciona una interfaz de usuario pensada para el equipo del CESFAM, con las siguientes secciones:

- **Inicio de Sesión**: Autenticación del personal de salud.
- **Dashboard**: Panel principal con la información relevante del programa.
- **Pacientes**: Listado, ficha, creación y edición de pacientes.
- **Controles**: Registro y visualización de controles clínicos por paciente.
- **Agenda**: Programación y seguimiento de citas y controles.
- **Talleres**: Gestión de talleres NANEAS e inscripciones.
- **Reportes**: Gráficos de evolución de peso/talla y estadísticas del programa.

## Arquitectura del Proyecto

El proyecto está dividido en tres servicios independientes: **Backend**, **Frontend** y **Base de Datos**, orquestados mediante Docker Compose.

### Estructura del Backend

```bash
├── backend
│   ├── src
│   │   ├── config
│   │   │   └── prisma.ts
│   │   ├── controllers
│   │   │   ├── auth.controller.ts
│   │   │   ├── controlClinico.controller.ts
│   │   │   ├── importacion.controller.ts
│   │   │   ├── inscripcionTaller.controller.ts
│   │   │   ├── paciente.controller.ts
│   │   │   ├── profesional.controller.ts
│   │   │   ├── reportes.controller.ts
│   │   │   ├── sesionTaller.controller.ts
│   │   │   ├── taller.controller.ts
│   │   │   └── tutor.controller.ts
│   │   ├── middlewares
│   │   │   └── authMiddleware.ts
│   │   ├── routes
│   │   │   ├── auth.routes.ts
│   │   │   ├── controlClinico.routes.ts
│   │   │   ├── importacion.routes.ts
│   │   │   ├── inscripcionTaller.routes.ts
│   │   │   ├── paciente.routes.ts
│   │   │   ├── profesional.routes.ts
│   │   │   ├── reportes.routes.ts
│   │   │   ├── sesionTaller.routes.ts
│   │   │   ├── taller.routes.ts
│   │   │   └── tutor.routes.ts
│   │   ├── services
│   │   │   ├── controlClinico.service.ts
│   │   │   ├── importacion.service.ts
│   │   │   ├── inscripcionTaller.service.ts
│   │   │   ├── paciente.service.ts
│   │   │   ├── profesional.service.ts
│   │   │   ├── reportes.service.ts
│   │   │   ├── sesionTaller.service.ts
│   │   │   ├── taller.service.ts
│   │   │   └── tutor.service.ts
│   │   ├── utils
│   │   │   └── fechaChile.ts
│   │   └── index.ts
│   ├── prisma
│   │   ├── migrations
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   └── normalizar-diagnosticos.ts
│   ├── Dockerfile
│   ├── docker-entrypoint.sh
│   ├── package-lock.json
│   └── package.json
```

### Estructura del Frontend

```bash
├── frontend
│   ├── public
│   │   ├── favicon.svg
│   │   └── icons.svg
│   ├── src
│   │   ├── assets
│   │   ├── components
│   │   │   ├── agenda
│   │   │   ├── controles
│   │   │   ├── dashboard
│   │   │   ├── layout
│   │   │   ├── login
│   │   │   ├── pacientes
│   │   │   ├── reportes
│   │   │   └── talleres
│   │   ├── service
│   │   ├── types
│   │   ├── utils
│   │   ├── validation
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   ├── Dockerfile
│   ├── eslint.config.js
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.js
```

## Tecnologías

Este proyecto utiliza el stack **PERN** (PostgreSQL, Express, React, Node.js), junto con TypeScript y Docker:

### PostgreSQL

- **Descripción**: Sistema de gestión de bases de datos relacional y objeto.
- **Uso en el Proyecto**: Almacena pacientes, tutores, profesionales, controles clínicos, talleres e inscripciones.
- **Enlace**: [PostgreSQL](https://www.postgresql.org/)

### Prisma ORM

- **Descripción**: ORM de nueva generación para Node.js y TypeScript.
- **Uso en el Proyecto**: Gestiona el esquema de la base de datos, las migraciones y las consultas del Backend.
- **Enlace**: [Prisma](https://www.prisma.io/)

### Express.js

- **Descripción**: Framework minimalista para Node.js que facilita la creación de aplicaciones web y APIs.
- **Uso en el Proyecto**: Construye la API REST del Backend, gestionando rutas y solicitudes HTTP.
- **Enlace**: [Express.js](https://expressjs.com/)

### React

- **Descripción**: Biblioteca de JavaScript para construir interfaces de usuario.
- **Uso en el Proyecto**: Construye la interfaz del Frontend con Vite y TypeScript, proporcionando una experiencia interactiva para el equipo de salud.
- **Enlace**: [React](https://reactjs.org/)

### Node.js

- **Descripción**: Entorno de ejecución para JavaScript en el lado del servidor.
- **Uso en el Proyecto**: Ejecuta el código del Backend y maneja la lógica del servidor.
- **Enlace**: [Node.js](https://nodejs.org/)

### Docker

- **Descripción**: Plataforma de contenedores para empaquetar y ejecutar aplicaciones de forma aislada.
- **Uso en el Proyecto**: Cada servicio (base de datos, backend y frontend) corre en su propio contenedor, orquestados con Docker Compose.
- **Enlace**: [Docker](https://www.docker.com/)

### Otros Recursos y Librerías

- **jsonwebtoken**: Generación y verificación de JWT para la autenticación.
  - **Enlace**: [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken)
- **bcrypt**: Hashing de contraseñas.
  - **Enlace**: [bcrypt](https://www.npmjs.com/package/bcrypt)
- **multer**: Manejo de subida de archivos (planillas Excel) en el Backend.
  - **Enlace**: [multer](https://www.npmjs.com/package/multer)
- **xlsx**: Lectura y procesamiento de planillas Excel para la importación de pacientes.
  - **Enlace**: [xlsx](https://www.npmjs.com/package/xlsx)
- **React Hook Form + Zod**: Manejo y validación de formularios en el Frontend.
  - **Enlace**: [React Hook Form](https://react-hook-form.com/) · [Zod](https://zod.dev/)
- **Recharts**: Gráficos de evolución (peso/talla) y reportes visuales.
  - **Enlace**: [Recharts](https://recharts.org/)
- **Tailwind CSS**: Framework de utilidades CSS para el diseño de la interfaz.
  - **Enlace**: [Tailwind CSS](https://tailwindcss.com/)
- **Lucide React**: Set de iconos utilizado en el Frontend.
  - **Enlace**: [Lucide](https://lucide.dev/)

Estas tecnologías y herramientas forman la base de la aplicación y permiten su funcionamiento de forma correcta.

⌨️ con ❤️ por [@YooPuiPui](https://github.com/YooPuiPui)
