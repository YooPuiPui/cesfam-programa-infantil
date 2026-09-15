# Sistema de Gestión Clínica - CESFAM Programa Infantil

Sistema de gestión del Programa Infantil del CESFAM Santa Sabina: control de pacientes, controles de salud, agenda, talleres NANEAS y reportes de evolución (peso/talla), desplegado como una arquitectura de contenedores (Frontend, Backend y Base de Datos).

## 🛠️ Tecnologías

**Backend**
- Node.js + Express 5
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT (jsonwebtoken) para autenticación
- bcrypt para hash de contraseñas
- Faker (datos de prueba / seed)

**Frontend**
- React 19 + Vite
- TypeScript
- Tailwind CSS
- React Router
- React Hook Form + Zod (formularios y validación)
- Recharts (gráficos de evolución)
- Lucide React (iconografía)

**Infraestructura**
- Docker + Docker Compose (contenedores independientes para base de datos, backend y frontend)
- Ubuntu 22.04 como imagen base de los contenedores

## 📁 Estructura del proyecto

```
cesfam-programa-infantil/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── routes/
│   │   ├── middlewares/
│   │   ├── config/
│   │   └── utils/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/   # agenda, controles, pacientes, reportes, dashboard, login, layout
│   │   ├── service/
│   │   ├── validation/
│   │   ├── types/
│   │   └── utils/
│   └── Dockerfile
├── database/
│   ├── init.sql
│   └── Dockerfile
├── docker-compose.yml
└── .env.example
```

