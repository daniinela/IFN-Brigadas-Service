// brigadas-service/controllers/brigadasRolOperativoController.js
import BrigadasRolOperativoModel from '../models/brigadasRolOperativoModel.js';
import BrigadasExpedicionModel from '../models/brigadasExpedicionModel.js';
import axios from 'axios';

class BrigadasRolOperativoController {
  
  static async getByBrigada(req, res) {
    try {
      const { brigada_id } = req.params;
      const roles = await BrigadasRolOperativoModel.getByBrigada(brigada_id);
      res.json(roles);
    } catch (error) {
      console.error('Error en getByBrigada:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // NUEVO: Brigadista obtiene sus invitaciones/asignaciones
  static async getMisInvitaciones(req, res) {
    try {
      const usuario_id = req.user?.id;

      if (!usuario_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const { estado } = req.query; // Filtrar por estado si se pasa

      const filtros = {};
      if (estado) {
        filtros.estado_invitacion = estado;
      }

      const invitaciones = await BrigadasRolOperativoModel.getByUsuario(usuario_id, filtros);
      
      res.json({
        success: true,
        data: invitaciones,
        total: invitaciones.length
      });
    } catch (error) {
      console.error('Error en getMisInvitaciones:', error);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  // NUEVO: Brigadista acepta invitación
  static async aceptarInvitacion(req, res) {
    try {
      const { id } = req.params;
      const usuario_id = req.user?.id;

      if (!usuario_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      // Validar que la invitación existe y pertenece al usuario
      const invitacion = await BrigadasRolOperativoModel.getById(id);
      
      if (!invitacion) {
        return res.status(404).json({ error: 'Invitación no encontrada' });
      }

      if (invitacion.usuario_id !== usuario_id) {
        return res.status(403).json({ 
          error: 'No tienes permisos para responder esta invitación' 
        });
      }

      if (invitacion.estado_invitacion !== 'pendiente') {
        return res.status(400).json({ 
          error: `La invitación ya fue ${invitacion.estado_invitacion}`,
          estado_actual: invitacion.estado_invitacion
        });
      }

      const invitacionAceptada = await BrigadasRolOperativoModel.responderInvitacion(id, 'aceptada');

      res.json({
        success: true,
        message: 'Invitación aceptada exitosamente',
        data: invitacionAceptada
      });
    } catch (error) {
      console.error('Error en aceptarInvitacion:', error);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  // NUEVO: Brigadista rechaza invitación
  static async rechazarInvitacion(req, res) {
    try {
      const { id } = req.params;
      const { motivo } = req.body;
      const usuario_id = req.user?.id;

      if (!usuario_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      if (!motivo || motivo.trim().length < 10) {
        return res.status(400).json({ 
          error: 'Debes proporcionar un motivo de al menos 10 caracteres' 
        });
      }

      // Validar que la invitación existe y pertenece al usuario
      const invitacion = await BrigadasRolOperativoModel.getById(id);
      
      if (!invitacion) {
        return res.status(404).json({ error: 'Invitación no encontrada' });
      }

      if (invitacion.usuario_id !== usuario_id) {
        return res.status(403).json({ 
          error: 'No tienes permisos para responder esta invitación' 
        });
      }

      if (invitacion.estado_invitacion !== 'pendiente') {
        return res.status(400).json({ 
          error: `La invitación ya fue ${invitacion.estado_invitacion}`,
          estado_actual: invitacion.estado_invitacion
        });
      }

      const invitacionRechazada = await BrigadasRolOperativoModel.responderInvitacion(
        id, 
        'rechazada', 
        motivo.trim()
      );

      res.json({
        success: true,
        message: 'Invitación rechazada',
        data: invitacionRechazada
      });
    } catch (error) {
      console.error('Error en rechazarInvitacion:', error);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  // JEFE_BRIGADA asigna miembros a su brigada
static async create(req, res) {
  try {
    console.log('🔍 === INICIO CREATE MIEMBRO ===');
    console.log('📦 req.params:', req.params);
    console.log('📦 req.body:', req.body);
    console.log('👤 req.user:', req.user);
    
    const brigada_id = req.params.brigada_id || req.body.brigada_id;
    const { usuario_id, rol_operativo } = req.body;
    const jefe_brigada_id = req.user?.id;

    console.log('✅ Valores extraídos:', { brigada_id, usuario_id, rol_operativo, jefe_brigada_id });

    if (!jefe_brigada_id) {
      console.log('❌ Usuario no autenticado');
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!brigada_id || !usuario_id || !rol_operativo) {
      console.log('❌ Faltan campos requeridos:', { brigada_id, usuario_id, rol_operativo });
      return res.status(400).json({ 
        error: 'brigada_id, usuario_id y rol_operativo son requeridos',
        recibido: { brigada_id, usuario_id, rol_operativo }
      });
    }

      const rolesValidos = ['Jefe', 'Botanico', 'Tecnico', 'Coinvestigador'];
      if (!rolesValidos.includes(rol_operativo)) {
        return res.status(400).json({ 
          error: 'rol_operativo inválido',
          roles_validos: rolesValidos
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

      if (brigada.estado !== 'formacion') {
        return res.status(400).json({ 
          error: 'Solo se pueden asignar miembros en estado formacion',
          estado_actual: brigada.estado
        });
      }

      const rolExiste = await BrigadasRolOperativoModel.existeRol(brigada_id, rol_operativo);
      if (rolExiste) {
        return res.status(409).json({ 
          error: `El rol ${rol_operativo} ya está asignado en esta brigada` 
        });
      }

      const usuarioExiste = await BrigadasRolOperativoModel.existeUsuario(brigada_id, usuario_id);
      if (usuarioExiste) {
        return res.status(409).json({ 
          error: 'Este usuario ya está asignado a la brigada' 
        });
      }

      const token = req.headers.authorization;
      try {
        const usuarioRes = await axios.get(
          `${process.env.USUARIOS_SERVICE_URL}/api/usuarios/${usuario_id}`,
          { headers: { Authorization: token } }
        );

        const usuario = usuarioRes.data;
        /*
        if (usuario.estado_aprobacion !== 'aprobado') {
          return res.status(400).json({ 
            error: 'El usuario debe estar aprobado' 
          });
        }
          */
      } catch (error) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const asignacion = await BrigadasRolOperativoModel.create({
        brigada_id,
        usuario_id,
        rol_operativo
      });

      res.status(201).json({
        success: true,
        message: 'Invitación enviada al brigadista',
        data: asignacion
      });
    } catch (error) {
      console.error('Error en create:', error);
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

      const asignaciones = await BrigadasRolOperativoModel.getByBrigada(req.body.brigada_id);
      const asignacion = asignaciones.find(a => a.id === id);

      if (!asignacion) {
        return res.status(404).json({ error: 'Asignación no encontrada' });
      }

      const brigada = await BrigadasExpedicionModel.getById(asignacion.brigada_id);
      if (brigada.jefe_brigada_id !== jefe_brigada_id) {
        return res.status(403).json({ 
          error: 'No tienes permisos para modificar esta brigada' 
        });
      }

      if (brigada.estado !== 'formacion') {
        return res.status(400).json({ 
          error: 'Solo se pueden eliminar miembros en estado formacion' 
        });
      }

      await BrigadasRolOperativoModel.delete(id);

      res.json({ message: 'Miembro eliminado de la brigada' });
    } catch (error) {
      console.error('Error en delete:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default BrigadasRolOperativoController;