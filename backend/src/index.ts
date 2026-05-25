import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Ruta de prueba tipada
app.get('/', (req: Request, res: Response) => {
  res.send('¡Servidor backend en TypeScript listo y operando!');
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`➜  Backend: http://localhost:${PORT}/`);
});