import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import brigadistasRoutes from './routes/brigadistasRoutes.js';
import brigadasRoutes from './routes/brigadasRoutes.js';
import brigadasbrigadistasRoutes from './routes/brigadasbrigadistasRoutes.js';
import supabase from './config/database.js'; 

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// HEALTH CHECK MEJORADO (con verificación de BD)
app.get('/health', async (req, res) => {
  try {
    // Verificar conexión a Supabase
    const { data, error } = await supabase
      .from('brigadas')
      .select('count')
      .limit(1);

    if (error) throw error;

    res.json({
      status: 'OK',
      service: 'brigadas-service',
      timestamp: new Date().toISOString(),
      database: 'connected',
      port: PORT
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      service: 'brigadas-service', 
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// HEALTH CHECK SIMPLE (para el gateway)
app.get('/health/simple', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'brigadas-service',
    timestamp: new Date().toISOString()
  });
});

// Rutas
app.use('/api/brigadistas', brigadistasRoutes);
app.use('/api/brigadas', brigadasRoutes);
app.use('/api/brigadas-brigadistas', brigadasbrigadistasRoutes);

// Manejo global de errores
app.use((err, req, res, next) => {
  console.error('Error global:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`Brigadas Service corriendo en http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
});