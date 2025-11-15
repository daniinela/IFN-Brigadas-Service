// brigadas-service/routes/brigadasRoutes.js
import express from 'express';
import BrigadasExpedicionController from '../controllers/brigadasExpedicionController.js';
import BrigadasRolOperativoController from '../controllers/brigadasRolOperativoController.js';
import RutasAccesoController from '../controllers/rutasAccesoController.js';
import PuntosReferenciaController from '../controllers/puntosReferenciaController.js';
import { 
  verificarToken, 
  verificarCoordIFN,
  verificarJefeBrigada
} from '../middleware/authMiddleware.js';

const router = express.Router();

// ============================================
// BRIGADAS EXPEDICIÓN
// ============================================

// Públicas (autenticadas)
router.get('/expediciones', verificarToken, BrigadasExpedicionController.getAll);
router.get('/expediciones/:id', verificarToken, BrigadasExpedicionController.getById);
router.get('/expediciones/estado/:estado', verificarToken, BrigadasExpedicionController.getByEstado);

// COORD_IFN - Crear brigada inicial
router.post('/expediciones', 
  verificarToken, 
  verificarCoordIFN, 
  BrigadasExpedicionController.create
);

// JEFE_BRIGADA - Sus brigadas
router.get('/expediciones/mis-brigadas', 
  verificarToken, 
  verificarJefeBrigada, 
  BrigadasExpedicionController.getMisBrigadas
);

router.put('/expediciones/:id/estado', 
  verificarToken, 
  verificarJefeBrigada, 
  BrigadasExpedicionController.cambiarEstado
);

router.put('/expediciones/:id/fechas', 
  verificarToken, 
  verificarJefeBrigada, 
  BrigadasExpedicionController.registrarFechas
);

// ============================================
// BRIGADAS ROL OPERATIVO
// ============================================

router.get('/expediciones/:brigada_id/personal', 
  verificarToken, 
  BrigadasRolOperativoController.getByBrigada
);

router.post('/expediciones/personal', 
  verificarToken, 
  verificarJefeBrigada, 
  BrigadasRolOperativoController.create
);

router.delete('/expediciones/personal/:id', 
  verificarToken, 
  verificarJefeBrigada, 
  BrigadasRolOperativoController.delete
);

// ============================================
// RUTAS ACCESO
// ============================================

router.get('/expediciones/:brigada_id/rutas', 
  verificarToken, 
  RutasAccesoController.getByBrigada
);

router.post('/rutas', 
  verificarToken, 
  verificarJefeBrigada, 
  RutasAccesoController.create
);

router.put('/rutas/:id', 
  verificarToken, 
  verificarJefeBrigada, 
  RutasAccesoController.update
);

router.delete('/rutas/:id', 
  verificarToken, 
  verificarJefeBrigada, 
  RutasAccesoController.delete
);

// ============================================
// PUNTOS REFERENCIA
// ============================================

router.get('/rutas/:ruta_id/puntos', 
  verificarToken, 
  PuntosReferenciaController.getByRuta
);

router.post('/puntos-referencia', 
  verificarToken, 
  verificarJefeBrigada, 
  PuntosReferenciaController.create
);

router.put('/puntos-referencia/:id', 
  verificarToken, 
  verificarJefeBrigada, 
  PuntosReferenciaController.update
);

router.delete('/puntos-referencia/:id', 
  verificarToken, 
  verificarJefeBrigada, 
  PuntosReferenciaController.delete
);

export default router;