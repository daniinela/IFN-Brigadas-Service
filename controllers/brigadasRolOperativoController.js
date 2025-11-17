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

  // JEFE_BRIGADA asigna miembros a su brigada
  static async create(req, res) {
    try {
      // Acepta brigada_id desde params o body
      const brigada_id = req.params.brigada_id || req.body.brigada_id;
      const { usuario_id, rol_operativo } = req.body;
      const jefe_brigada_id = req.user?.id;

      if (!jefe_brigada_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      if (!brigada_id || !usuario_id || !rol_operativo) {
        return res.status(400).json({ 
          error: 'brigada_id, usuario_id y rol_operativo son requeridos' 
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

      // Validar que el usuario es el jefe de esta brigada
      if (brigada.jefe_brigada_id !== jefe_brigada_id) {
        return res.status(403).json({ 
          error: 'No tienes permisos para modificar esta brigada' 
        });
      }

      // Validar que la brigada está en formación
      if (brigada.estado !== 'formacion') {
        return res.status(400).json({ 
          error: 'Solo se pueden asignar miembros en estado formacion',
          estado_actual: brigada.estado
        });
      }

      // Validar que el rol no esté ya asignado (solo un Jefe, un Botanico, etc.)
      const rolExiste = await BrigadasRolOperativoModel.existeRol(brigada_id, rol_operativo);
      if (rolExiste) {
        return res.status(409).json({ 
          error: `El rol ${rol_operativo} ya está asignado en esta brigada` 
        });
      }

      // Validar que el usuario no esté ya en la brigada
      const usuarioExiste = await BrigadasRolOperativoModel.existeUsuario(brigada_id, usuario_id);
      if (usuarioExiste) {
        return res.status(409).json({ 
          error: 'Este usuario ya está asignado a la brigada' 
        });
      }

      // Validar que el usuario existe y está aprobado
      const token = req.headers.authorization;
      try {
        const usuarioRes = await axios.get(
          `${process.env.USUARIOS_SERVICE_URL}/api/usuarios/${usuario_id}`,
          { headers: { Authorization: token } }
        );

        const usuario = usuarioRes.data;
        if (usuario.estado_aprobacion !== 'aprobado') {
          return res.status(400).json({ 
            error: 'El usuario debe estar aprobado' 
          });
        }
      } catch (error) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const asignacion = await BrigadasRolOperativoModel.create({
        brigada_id,
        usuario_id,
        rol_operativo
      });

      res.status(201).json({
        message: 'Miembro asignado a la brigada',
        asignacion
      });
    } catch (error) {
      console.error('Error en create:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // JEFE_BRIGADA elimina miembro
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const jefe_brigada_id = req.user?.id;

      if (!jefe_brigada_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      // Obtener la asignación para validar
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