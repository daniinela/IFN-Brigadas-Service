// brigadas-service/routes/brigadasRoutes.js
import express from 'express';
import BrigadasExpedicionController from '../controllers/brigadasExpedicionController.js';
import BrigadasRolOperativoController from '../controllers/brigadasRolOperativoController.js';
import RutasAccesoController from '../controllers/rutasAccesoController.js';
import PuntosReferenciaController from '../controllers/puntosReferenciaController.js';
import { 
  verificarToken,
  verificarBrigadista  // 🆕 Nuevo middleware
} from '../middleware/authMiddleware.js';

const router = express.Router();

// ============================================
// BRIGADAS EXPEDICIÓN
// ============================================

router.get('/brigadas/mis-brigadas', 
  verificarToken,
  BrigadasExpedicionController.getMisBrigadas
);

router.get('/brigadas', verificarToken, BrigadasExpedicionController.getAll);
router.get('/brigadas/estado/:estado', verificarToken, BrigadasExpedicionController.getByEstado);
router.get('/brigadas/:id', verificarToken, BrigadasExpedicionController.getById);

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
// 🆕 RUTAS PARA BRIGADISTAS
// ============================================

router.get('/brigadistas/mis-invitaciones', 
  verificarToken,
  verificarBrigadista,  // 🆕 Proteger con middleware
  BrigadasRolOperativoController.getMisInvitaciones
);

router.post('/brigadistas/invitaciones/:id/aceptar', 
  verificarToken,
  verificarBrigadista,  // 🆕 Proteger con middleware
  BrigadasRolOperativoController.aceptarInvitacion
);

router.post('/brigadistas/invitaciones/:id/rechazar', 
  verificarToken,
  verificarBrigadista,  // 🆕 Proteger con middleware
  BrigadasRolOperativoController.rechazarInvitacion
);

// ============================================
// BRIGADAS ROL OPERATIVO (Jefe de Brigada)
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
router.post('/brigadas/:id/enviar-invitaciones', 
  verificarToken,
  BrigadasExpedicionController.enviarInvitaciones
);

// Eliminar miembro
router.delete('/brigadas/miembros/:miembro_id', 
  verificarToken,
  BrigadasExpedicionController.eliminarMiembro
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