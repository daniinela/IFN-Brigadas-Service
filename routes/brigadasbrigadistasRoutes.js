// routes/brigadasbrigadistasRoutes.js
import express from 'express';
// CORREGIDO: Import con nombre nuevo
import BrigadasBrigadistasController from '../controllers/brigadasbrigadistasController.js';

const router = express.Router();

// Rutas de gestión de asignaciones
router.post('/invitar', BrigadasBrigadistasController.invitar);
router.put('/:id/responder', BrigadasBrigadistasController.responder);
router.delete('/:brigada_id/:brigadista_id', BrigadasBrigadistasController.desasignar);
router.put('/:id/fechas', BrigadasBrigadistasController.actualizarFechas);

// Rutas de consulta
router.get('/brigada/:brigada_id', BrigadasBrigadistasController.getByBrigada);
router.get('/brigadista/:brigadista_id', BrigadasBrigadistasController.getByBrigadista);
router.get('/brigadista/:brigadista_id/pendientes', BrigadasBrigadistasController.getInvitacionesPendientes);

export default router;