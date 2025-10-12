// controllers/brigadasbrigadistasController.js
// CORREGIDO: Import con nombre nuevo
import BrigadasBrigadistasModel from '../models/brigadasbrigadistasModel.js';

class BrigadasBrigadistasController {
  
  // Invitar brigadista a brigada
  static async invitar(req, res) {
    try {
      const { brigada_id, brigadista_id, fecha_inicio, fecha_fin } = req.body;
      
      if (!brigada_id || !brigadista_id) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
      }

      // Verificar si ya existe la asignación
      const existe = await BrigadasBrigadistasModel.existeAsignacion(brigada_id, brigadista_id);
      if (existe) {
        return res.status(409).json({ error: 'El brigadista ya está asignado a esta brigada' });
      }

      const invitacion = await BrigadasBrigadistasModel.invitar(brigada_id, brigadista_id, {
        fecha_inicio,
        fecha_fin
      });
      
      res.status(201).json(invitacion);
    } catch (error) {
      console.error('Error en invitar:', error);
      
      if (error.code === '23503') {
        return res.status(400).json({ error: 'Brigada o brigadista no existe' });
      }
      
      res.status(500).json({ error: error.message });
    }
  }

  // Brigadista responde invitación
  static async responder(req, res) {
    try {
      const { id } = req.params;
      const { aceptada, motivo_rechazo } = req.body;
      
      if (typeof aceptada !== 'boolean') {
        return res.status(400).json({ error: 'aceptada debe ser true o false' });
      }

      if (!aceptada && !motivo_rechazo) {
        return res.status(400).json({ error: 'motivo_rechazo es requerido al rechazar' });
      }

      const asignacion = await BrigadasBrigadistasModel.getById(id);
      if (!asignacion) {
        return res.status(404).json({ error: 'Invitación no encontrada' });
      }

      if (asignacion.estado_invitacion !== 'pendiente') {
        return res.status(409).json({ error: 'Esta invitación ya fue respondida' });
      }

      const resultado = await BrigadasBrigadistasModel.responderInvitacion(
        id,
        aceptada,
        motivo_rechazo
      );
      
      res.json(resultado);
    } catch (error) {
      console.error('Error en responder:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Desasignar brigadista de brigada
  static async desasignar(req, res) {
    try {
      const { brigada_id, brigadista_id } = req.params;
      
      const existe = await BrigadasBrigadistasModel.existeAsignacion(brigada_id, brigadista_id);
      if (!existe) {
        return res.status(404).json({ error: 'Asignación no encontrada' });
      }
      
      await BrigadasBrigadistasModel.desasignar(brigada_id, brigadista_id);
      res.status(204).send();
    } catch (error) {
      console.error('Error en desasignar:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Obtener asignaciones de una brigada
  static async getByBrigada(req, res) {
    try {
      const asignaciones = await BrigadasBrigadistasModel.getByBrigada(req.params.brigada_id);
      res.json(asignaciones);
    } catch (error) {
      console.error('Error en getByBrigada:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Obtener brigadas de un brigadista
  static async getByBrigadista(req, res) {
    try {
      const asignaciones = await BrigadasBrigadistasModel.getByBrigadista(req.params.brigadista_id);
      res.json(asignaciones);
    } catch (error) {
      console.error('Error en getByBrigadista:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Obtener invitaciones pendientes de un brigadista
  static async getInvitacionesPendientes(req, res) {
    try {
      const invitaciones = await BrigadasBrigadistasModel.getInvitacionesPendientes(
        req.params.brigadista_id
      );
      res.json(invitaciones);
    } catch (error) {
      console.error('Error en getInvitacionesPendientes:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Actualizar fechas de trabajo
  static async actualizarFechas(req, res) {
    try {
      const { id } = req.params;
      const { fecha_inicio, fecha_fin } = req.body;
      
      if (!fecha_inicio || !fecha_fin) {
        return res.status(400).json({ error: 'Ambas fechas son requeridas' });
      }

      const asignacion = await BrigadasBrigadistasModel.actualizarFechas(id, {
        fecha_inicio,
        fecha_fin
      });
      
      res.json(asignacion);
    } catch (error) {
      console.error('Error en actualizarFechas:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default BrigadasBrigadistasController;