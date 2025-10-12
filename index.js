import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import brigadistasRoutes from './routes/brigadistasRoutes.js';
import brigadasRoutes from './routes/brigadasRoutes.js';
import brigadasbrigadistasRoutes from './routes/brigadasbrigadistasRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/brigadistas', brigadistasRoutes);
app.use('/api/brigadas', brigadasRoutes);
app.use('/api/brigadas-brigadistas', brigadasbrigadistasRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'brigadas-service',
    timestamp: new Date().toISOString(),
  });
});

// Manejo global de errores
app.use((err, req, res, next) => {
  console.error('Error global:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`🚀 Brigadas Service corriendo en http://localhost:${PORT}`);
});
