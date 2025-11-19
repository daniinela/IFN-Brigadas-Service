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

  // Debe retornar el ID
  static async create(req, res) {
    try {
      const { brigada_id } = req.params;
      const { tipo_ruta, medio_transporte, tiempo_acceso, distancia_km } = req.body;
      const jefe_brigada_id = req.user?.id;

      console.log('📥 Creando ruta:', { brigada_id, tipo_ruta, medio_transporte, tiempo_acceso, distancia_km });

      if (!jefe_brigada_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      // Validar campos requeridos
      if (!tipo_ruta || !medio_transporte || !tiempo_acceso) {
        return res.status(400).json({ 
          error: 'tipo_ruta, medio_transporte y tiempo_acceso son requeridos',
          recibido: { tipo_ruta, medio_transporte, tiempo_acceso }
        });
      }

      // Validar que la brigada existe
      const brigada = await BrigadasExpedicionModel.getById(brigada_id);
      if (!brigada) {
        return res.status(404).json({ error: 'Brigada no encontrada' });
      }

      // Validar permisos
      if (brigada.jefe_brigada_id !== jefe_brigada_id) {
        return res.status(403).json({ 
          error: 'No tienes permisos para modificar esta brigada' 
        });
      }

      // Validar que no exista ya una ruta del mismo tipo
      const rutasExistentes = await RutasAccesoModel.getByBrigada(brigada_id);
      const rutaDuplicada = rutasExistentes.find(r => r.tipo_ruta === tipo_ruta);
      
      if (rutaDuplicada) {
        return res.status(409).json({ 
          error: `Ya existe una ruta de tipo ${tipo_ruta} para esta brigada`,
          ruta_existente_id: rutaDuplicada.id
        });
      }

      // ✅ CREAR LA RUTA
      const nuevaRuta = await RutasAccesoModel.create({
        brigada_id,
        tipo_ruta,
        medio_transporte,
        tiempo_acceso,
        distancia_km: parseFloat(distancia_km) || 0
      });

      console.log('✅ Ruta creada con ID:', nuevaRuta.id);

      // ✅ RETORNAR CON EL ID
      res.status(201).json({
        success: true,
        message: 'Ruta creada exitosamente',
        id: nuevaRuta.id,  // ← ESTO ES LO CRÍTICO
        data: nuevaRuta
      });
    } catch (error) {
      console.error('❌ Error en create ruta:', error);
      res.status(500).json({ 
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
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
        return res.status(404).json({ error: 'Ruta no encontrada' });
      }

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