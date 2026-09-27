<div align="center">

# 🏥 CESFAM Programa Infantil

### Sistema de Gestión Clínica

Plataforma para la gestión del **Programa Infantil** del CESFAM Santa Sabina — control de pacientes, controles de salud, agenda, talleres NANEAS y reportes de evolución (peso/talla) — construida como una arquitectura de contenedores independientes para Frontend, Backend y Base de Datos.

![Node.js](https://img.shields.io/badge/Node.js-Express%205-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)

</div>

---

## 🛠️ Tecnologías

<table>
<tr>
<td valign="top" width="33%">

### Backend
- Node.js + Express 5
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT (`jsonwebtoken`) — autenticación
- bcrypt — hash de contraseñas
- Faker — datos de prueba / seed

</td>
<td valign="top" width="33%">

### Frontend
- React 19 + Vite
- TypeScript
- Tailwind CSS
- React Router
- React Hook Form + Zod
- Recharts — gráficos de evolución
- Lucide React — iconografía

</td>
<td valign="top" width="33%">

### Infraestructura
- Docker + Docker Compose
- Contenedores independientes para base de datos, backend y frontend
- Ubuntu 22.04 como imagen base

</td>
</tr>
</table>

---

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
│
├── frontend/
│   ├── src/
│   │   ├── components/   # agenda, controles, pacientes, reportes, dashboard, login, layout
│   │   ├── service/
│   │   ├── validation/
│   │   ├── types/
│   │   └── utils/
│   └── Dockerfile
│
├── database/
│   ├── init.sql
│   └── Dockerfile
│
├── docker-compose.yml
└── .env.example
```

---

<div align="center">

*Proyecto de título — Universidad del Bío-Bío, sede Concepción · CESFAM Santa Sabina*

</div>
