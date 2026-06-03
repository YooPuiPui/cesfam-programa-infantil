import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import pacienteRoutes from './routes/paciente.routes';
import profesionalRoutes from './routes/profesional.routes';
import tutorRoutes from './routes/tutor.routes';


const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Ruta de prueba tipada
app.get('/', (req: Request, res: Response) => {
  res.send('¡Servidor backend en TypeScript listo y operando!');
});

app.use('/api/pacientes', pacienteRoutes);
app.use('/api/profesionales', profesionalRoutes);
app.use('/api/tutores', tutorRoutes);

// Iniciar el servidor
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`➜  Backend: http://localhost:${PORT}/`);
});