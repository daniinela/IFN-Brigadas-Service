// brigadas-service/controllers/puntosReferenciaController.js
import PuntosReferenciaModel from '../models/puntosReferenciaModel.js';
import RutasAccesoModel from '../models/rutasAccesoModel.js';
import BrigadasExpedicionModel from '../models/brigadasExpedicionModel.js';

class PuntosReferenciaController {
  
  static async getByRuta(req, res) {
    try {
      const { ruta_id } = req.params;
      const puntos = await PuntosReferenciaModel.getByRuta(ruta_id);
      res.json(puntos);
    } catch (error) {
      console.error('Error en getByRuta:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async create(req, res) {
    try {
      const { 
        ruta_id, 
        nombre_punto, 
        latitud, 
        longitud, 
        error_gps_m
      } = req.body;
      const jefe_brigada_id = req.user?.id;

      console.log('📥 Creando punto de referencia:', { 
        ruta_id, nombre_punto, latitud, longitud, error_gps_m 
      });

      if (!jefe_brigada_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      // ✅ Validación corregida
      if (!ruta_id || !nombre_punto || !latitud || !longitud) {
        return res.status(400).json({ 
          error: 'ruta_id, nombre_punto, latitud y longitud son obligatorios',
          recibido: { ruta_id, nombre_punto, latitud, longitud, error_gps_m }
        });
      }

      // Validar que la ruta existe
      const ruta = await RutasAccesoModel.getById(ruta_id);
      if (!ruta) {
        return res.status(404).json({ error: 'Ruta no encontrada' });
      }

      // Validar permisos del jefe de brigada
      const brigada = await BrigadasExpedicionModel.getById(ruta.brigada_id);
      if (brigada.jefe_brigada_id !== jefe_brigada_id) {
        return res.status(403).json({ 
          error: 'No tienes permisos para modificar esta ruta' 
        });
      }

      // ✅ Crear punto con conversión explícita
      const nuevoPunto = await PuntosReferenciaModel.create({
        ruta_id,
        nombre_punto: nombre_punto.trim(),
        latitud: String(latitud),
        longitud: String(longitud),
        error_gps_m: parseFloat(error_gps_m) || 0
      });

      console.log('✅ Punto creado:', nuevoPunto.id);

      res.status(201).json({
        success: true,
        message: 'Punto de referencia registrado',
        punto: nuevoPunto
      });
    } catch (error) {
      console.error('❌ Error en create punto:', error);
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

      const punto = await PuntosReferenciaModel.getById(id);
      if (!punto) {
        return res.status(404).json({ error: 'Punto no encontrado' });
      }

      const ruta = await RutasAccesoModel.getById(punto.ruta_id);
      const brigada = await BrigadasExpedicionModel.getById(ruta.brigada_id);

      if (brigada.jefe_brigada_id !== jefe_brigada_id) {
        return res.status(403).json({ 
          error: 'No tienes permisos para modificar este punto' 
        });
      }

      const puntoActualizado = await PuntosReferenciaModel.update(id, updates);
      res.json(puntoActualizado);
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

      const punto = await PuntosReferenciaModel.getById(id);
      if (!punto) {
        return res.status(404).json({ error: 'Punto no encontrado' });
      }

      const ruta = await RutasAccesoModel.getById(punto.ruta_id);
      const brigada = await BrigadasExpedicionModel.getById(ruta.brigada_id);

      if (brigada.jefe_brigada_id !== jefe_brigada_id) {
        return res.status(403).json({ 
          error: 'No tienes permisos para eliminar este punto' 
        });
      }

      await PuntosReferenciaModel.delete(id);
      res.json({ message: 'Punto eliminado' });
    } catch (error) {
      console.error('Error en delete:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default PuntosReferenciaController;