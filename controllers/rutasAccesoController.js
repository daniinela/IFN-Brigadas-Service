// brigadas-service/controllers/rutasAccesoController.js
import RutasAccesoModel from '../models/rutasAccesoModel.js';
import BrigadasExpedicionModel from '../models/brigadasExpedicionModel.js';

class RutasAccesoController {
  
  static async getByBrigada(req, res) {
    try {
      const { brigada_id } = req.params;
      const rutas = await RutasAccesoModel.getByBrigada(brigada_id);
      res.json(rutas);
    } catch (error) {
      console.error('Error en getByBrigada:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async create(req, res) {
    try {
      const { 
        brigada_id, tipo_ruta, medio_transporte,
        tiempo_acceso, distancia_km
      } = req.body;
      const jefe_brigada_id = req.user?.id;

      if (!jefe_brigada_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      if (!brigada_id || !tipo_ruta || !medio_transporte || !tiempo_acceso || !distancia_km) {
        return res.status(400).json({ 
          error: 'Todos los campos son requeridos' 
        });
      }

      const tiposValidos = ['campamento', 'conglomerado'];
      if (!tiposValidos.includes(tipo_ruta)) {
        return res.status(400).json({ 
          error: 'tipo_ruta debe ser campamento o conglomerado' 
        });
      }

      // Validar formato HH:MM
      if (!/^\d{2}:\d{2}$/.test(tiempo_acceso)) {
        return res.status(400).json({ 
          error: 'tiempo_acceso debe estar en formato HH:MM' 
        });
      }

      const brigada = await BrigadasExpedicionModel.getById(brigada_id);
      if (!brigada) {
        return res.status(404).json({ error: 'Brigada no encontrada' });
      }

      if (brigada.jefe_brigada_id !== jefe_brigada_id) {
        return res.status(403).json({ 
          error: 'No tienes permisos para modificar esta brigada' 
        });
      }

      const nuevaRuta = await RutasAccesoModel.create({
        brigada_id,
        tipo_ruta,
        medio_transporte,
        tiempo_acceso,
        distancia_km
      });

      res.status(201).json({
        message: 'Ruta creada',
        ruta: nuevaRuta
      });
    } catch (error) {
      console.error('Error en create:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const jefe_brigada_id = req.user?.id;

      if (!jefe_brigada_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const ruta = await RutasAccesoModel.getById(id);
      if (!ruta) {
        return res.status(404).json({ error: 'Ruta no encontrada' });}
        const brigada = await BrigadasExpedicionModel.getById(ruta.brigada_id);
      if (brigada.jefe_brigada_id !== jefe_brigada_id) {
        return res.status(403).json({ 
          error: 'No tienes permisos para modificar esta ruta' 
        });
      }

      const rutaActualizada = await RutasAccesoModel.update(id, updates);
      res.json(rutaActualizada);
    } catch (error) {
      console.error('Error en update:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      const jefe_brigada_id = req.user?.id;

      if (!jefe_brigada_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const ruta = await RutasAccesoModel.getById(id);
      if (!ruta) {
        return res.status(404).json({ error: 'Ruta no encontrada' });
      }

      const brigada = await BrigadasExpedicionModel.getById(ruta.brigada_id);
      if (brigada.jefe_brigada_id !== jefe_brigada_id) {
        return res.status(403).json({ 
          error: 'No tienes permisos para eliminar esta ruta' 
        });
      }

      await RutasAccesoModel.delete(id);
      res.json({ message: 'Ruta eliminada' });
    } catch (error) {
      console.error('Error en delete:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default RutasAccesoController;