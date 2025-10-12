// brigadistas-service/routes/brigadistasRoutes.js
import express from 'express';
import BrigadistasController from '../controllers/brigadistasController.js';
import { verificarToken, verificarAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// ===== LECTURA (cualquier usuario autenticado) =====
router.get('/', verificarToken, BrigadistasController.getAll);
router.get('/:id', verificarToken, BrigadistasController.getById);
router.get('/user/:user_id', verificarToken, BrigadistasController.getByUserId);
router.get('/detalles/:id', verificarToken, BrigadistasController.getConDetalles);

// ===== CREAR BRIGADISTA =====
// ✅ Ruta sin protección para el registro (el usuario crea su propio perfil)
router.post('/registro/nuevo', BrigadistasController.create);

// ✅ Ruta con protección para admin que crea brigadistas de otros
router.post('/', verificarToken, verificarAdmin, BrigadistasController.create);

// ===== MODIFICACIÓN (solo admin) =====
router.put('/:id', verificarToken, verificarAdmin, BrigadistasController.update);
router.delete('/:id', verificarToken, verificarAdmin, BrigadistasController.delete);
router.put('/:id/verificar-titulos', verificarToken, verificarAdmin, BrigadistasController.verificarTitulos);

// ===== DISPONIBILIDAD (cualquier usuario autenticado) =====
// Un brigadista puede actualizar su propia disponibilidad
router.put('/:id/disponibilidad', verificarToken, BrigadistasController.actualizarDisponibilidad);

export default router;