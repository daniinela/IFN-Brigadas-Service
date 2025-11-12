// routes/index.js - RUTAS UNIFICADAS DEL SERVICIO DE BRIGADAS
import express from 'express';
import BrigadistasController from '../controllers/brigadistasController.js';
import BrigadasController from '../controllers/brigadasController.js';
import BrigadasBrigadistasController from '../controllers/brigadasbrigadistasController.js';
import SubRolController from '../controllers/subRolController.js';
import BrigadistasSubrolController from '../controllers/brigadistasSubrolController.js';
import { verificarToken, verificarAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// ============================================
// RUTAS DE BRIGADISTAS
// ============================================

// Gestión de solicitudes (sala de espera)
router.get('/brigadistas/pendientes', verificarToken, verificarAdmin, BrigadistasController.getPendientes);
router.post('/brigadistas/:id/aprobar', verificarToken, verificarAdmin, BrigadistasController.aprobar);
router.post('/brigadistas/:id/rechazar', verificarToken, verificarAdmin, BrigadistasController.rechazar);
router.get('/brigadistas/:id/con-roles', verificarToken, BrigadistasController.getConRoles);

// Filtros específicos (ANTES de /:id)
router.get('/brigadistas/municipio/:municipio', verificarToken, BrigadistasController.getByMunicipio);
router.get('/brigadistas/rol/:rol', verificarToken, BrigadistasController.getByRol);
router.get('/brigadistas/disponibles', verificarToken, BrigadistasController.getDisponibles);
router.get('/brigadistas/user/:user_id', verificarToken, BrigadistasController.getByUserId);
router.get('/brigadistas/detalles/:id', verificarToken, BrigadistasController.getConDetalles);

// CRUD básico
router.get('/brigadistas', verificarToken, BrigadistasController.getAll);
router.get('/brigadistas/:id', verificarToken, BrigadistasController.getById);
router.post('/brigadistas/registro/nuevo', BrigadistasController.create); // Sin auth (registro público)
router.post('/brigadistas', verificarToken, verificarAdmin, BrigadistasController.create);
router.put('/brigadistas/:id', verificarToken, verificarAdmin, BrigadistasController.update);
router.delete('/brigadistas/:id', verificarToken, verificarAdmin, BrigadistasController.delete);

// Actualización de perfiles
router.put('/brigadistas/:id/verificar-titulos', verificarToken, verificarAdmin, BrigadistasController.verificarTitulos);
router.put('/brigadistas/:id/disponibilidad', verificarToken, BrigadistasController.actualizarDisponibilidad);

// ============================================
// RUTAS DE BRIGADAS
// ============================================

// Operaciones específicas (ANTES de /:id)
router.get('/brigadas/conglomerado/:conglomerado_id', verificarToken, BrigadasController.getByConglomerado);
router.get('/brigadas/estado/:estado', verificarToken, BrigadasController.getByEstado);
router.get('/brigadas/:id/brigadistas', verificarToken, BrigadasController.getConBrigadistas);
router.put('/brigadas/:id/estado', verificarToken, verificarAdmin, BrigadasController.cambiarEstado);
router.post('/brigadas/:id/cancelar', verificarToken, verificarAdmin, BrigadasController.cancelar);
router.get('/brigadas/conglomerados-disponibles', verificarToken, verificarAdmin, BrigadasController.getConglomeradosDisponibles);
router.get('/brigadas/brigadistas-cercanos', verificarToken, BrigadasController.getBrigadistasCercanos);

// CRUD básico
router.get('/brigadas', verificarToken, BrigadasController.getAll);
router.get('/brigadas/:id', verificarToken, BrigadasController.getById);
router.post('/brigadas', verificarToken, verificarAdmin, BrigadasController.create);
router.put('/brigadas/:id', verificarToken, verificarAdmin, BrigadasController.update);
router.delete('/brigadas/:id', verificarToken, verificarAdmin, BrigadasController.delete);

// ============================================
// RUTAS DE BRIGADAS_BRIGADISTAS
// ============================================

router.post('/brigadas-brigadistas/invitar', verificarToken, verificarAdmin, BrigadasBrigadistasController.invitar);
router.put('/brigadas-brigadistas/:id/responder', verificarToken, BrigadasBrigadistasController.responder);
router.delete('/brigadas-brigadistas/:brigada_id/:brigadista_id', verificarToken, verificarAdmin, BrigadasBrigadistasController.desasignar);
router.put('/brigadas-brigadistas/:id/fechas', verificarToken, verificarAdmin, BrigadasBrigadistasController.actualizarFechas);
router.get('/brigadas-brigadistas/brigada/:brigada_id', verificarToken, BrigadasBrigadistasController.getByBrigada);
router.get('/brigadas-brigadistas/brigadista/:brigadista_id', verificarToken, BrigadasBrigadistasController.getByBrigadista);
router.get('/brigadas-brigadistas/brigadista/:brigadista_id/pendientes', verificarToken, BrigadasBrigadistasController.getInvitacionesPendientes);

// ============================================
// RUTAS DE SUB_ROL (Catálogo)
// ============================================

router.get('/sub-rol', verificarToken, SubRolController.getAll);
router.get('/sub-rol/:id', verificarToken, SubRolController.getById);
router.get('/sub-rol/codigo/:codigo', verificarToken, SubRolController.getByCodigo);

// ============================================
// RUTAS DE BRIGADISTAS_SUBROL (Asignaciones)
// ============================================

router.post('/brigadistas-subrol/asignar', verificarToken, verificarAdmin, BrigadistasSubrolController.asignar);
router.get('/brigadistas-subrol/brigadista/:brigadista_id', verificarToken, BrigadistasSubrolController.getByBrigadista);
router.get('/brigadistas-subrol/subrol/:subrol_id', verificarToken, BrigadistasSubrolController.getBySubrol);
router.get('/brigadistas-subrol/verificar/:brigadista_id/:codigo', verificarToken, BrigadistasSubrolController.verificar);
router.put('/brigadistas-subrol/desactivar/:brigadista_id/:subrol_id', verificarToken, verificarAdmin, BrigadistasSubrolController.desactivar);
router.put('/brigadistas-subrol/activar/:brigadista_id/:subrol_id', verificarToken, verificarAdmin, BrigadistasSubrolController.activar);
router.delete('/brigadistas-subrol/:brigadista_id/:subrol_id', verificarToken, verificarAdmin, BrigadistasSubrolController.eliminar);

export default router;