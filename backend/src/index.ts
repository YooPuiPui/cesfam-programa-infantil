import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import pacienteRoutes from './routes/paciente.routes';
import profesionalRoutes from './routes/profesional.routes';
import tutorRoutes from './routes/tutor.routes';
import controlRoutes from './routes/controlClinico.routes';
import authRoutes from './routes/auth.routes';
import reportesRoutes from './routes/reportes.routes';







const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors({
  origin: ['http://localhost:5173', 'http://146.83.198.35:1650'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Ruta de prueba tipada
app.get('/', (req: Request, res: Response) => {
  res.send('¡Servidor backend en TypeScript listo y operando!');
});

app.use('/api/pacientes', pacienteRoutes);
app.use('/api/profesionales', profesionalRoutes);
app.use('/api/tutores', tutorRoutes);
app.use('/api/control', controlRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reportes', reportesRoutes);



// Iniciar el servidor
const server = app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`➜  Backend: http://localhost:${PORT}/`);
});

// Manejo explícito de errores de arranque del servidor.
// Sin esto, un fallo de bind (ej. puerto ocupado) queda en silencio
// y el proceso muere sin dar pistas de por qué.
server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ El puerto ${PORT} ya está en uso. Cerrando proceso.`);
  } else {
    console.error('❌ Error al iniciar el servidor:', err);
  }
  process.exit(1);
});