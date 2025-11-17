// brigadas-service/routes/brigadasRoutes.js
// VERSIÓN TEMPORAL: sin verificación de roles para debugging
import express from 'express';
import BrigadasExpedicionController from '../controllers/brigadasExpedicionController.js';
import BrigadasRolOperativoController from '../controllers/brigadasRolOperativoController.js';
import RutasAccesoController from '../controllers/rutasAccesoController.js';
import PuntosReferenciaController from '../controllers/puntosReferenciaController.js';
import { verificarToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// ============================================
// BRIGADAS EXPEDICIÓN
// ============================================

// TEMPORAL: Solo verificar token, sin verificar roles
router.get('/brigadas/mis-brigadas', 
  verificarToken,  // <-- Solo token, sin verificarJefeBrigada
  BrigadasExpedicionController.getMisBrigadas
);

// Públicas (autenticadas)
router.get('/brigadas', verificarToken, BrigadasExpedicionController.getAll);
router.get('/brigadas/estado/:estado', verificarToken, BrigadasExpedicionController.getByEstado);
router.get('/brigadas/:id', verificarToken, BrigadasExpedicionController.getById);

// COORD_IFN - Crear brigada inicial
router.post('/brigadas', 
  verificarToken, 
  BrigadasExpedicionController.create
);

router.put('/brigadas/:id/estado', 
  verificarToken, 
  BrigadasExpedicionController.cambiarEstado
);

router.put('/brigadas/:id/fechas', 
  verificarToken, 
  BrigadasExpedicionController.registrarFechas
);

// ============================================
// BRIGADAS ROL OPERATIVO
// ============================================

router.get('/brigadas/:brigada_id/personal', 
  verificarToken, 
  BrigadasRolOperativoController.getByBrigada
);

router.post('/brigadas/:brigada_id/miembros', 
  verificarToken, 
  BrigadasRolOperativoController.create
);

router.delete('/brigadas/personal/:id', 
  verificarToken, 
  BrigadasRolOperativoController.delete
);

// ============================================
// RUTAS ACCESO
// ============================================

router.get('/brigadas/:brigada_id/rutas', 
  verificarToken, 
  RutasAccesoController.getByBrigada
);

router.post('/brigadas/:brigada_id/rutas', 
  verificarToken, 
  RutasAccesoController.create
);

router.put('/rutas/:id', 
  verificarToken, 
  RutasAccesoController.update
);

router.delete('/rutas/:id', 
  verificarToken, 
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
  PuntosReferenciaController.create
);

router.put('/puntos-referencia/:id', 
  verificarToken, 
  PuntosReferenciaController.update
);

router.delete('/puntos-referencia/:id', 
  verificarToken, 
  PuntosReferenciaController.delete
);

export default router;