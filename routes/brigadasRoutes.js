// routes/brigadasRoutes.js
import express from 'express';
import BrigadasController from '../controllers/brigadasController.js';

const router = express.Router();

// Rutas específicas primero
router.get('/conglomerado/:conglomerado_id', BrigadasController.getByConglomerado);
router.get('/estado/:estado', BrigadasController.getByEstado);
router.get('/:id/brigadistas', BrigadasController.getConBrigadistas);
router.put('/:id/estado', BrigadasController.cambiarEstado);

// Rutas CRUD
router.get('/', BrigadasController.getAll);
router.get('/:id', BrigadasController.getById);
router.post('/', BrigadasController.create);
router.put('/:id', BrigadasController.update);
router.delete('/:id', BrigadasController.delete);

export default router;