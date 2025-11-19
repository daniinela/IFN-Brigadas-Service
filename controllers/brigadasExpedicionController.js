// brigadas-service/controllers/brigadasExpedicionController.js
import BrigadasExpedicionModel from '../models/brigadasExpedicionModel.js';
import BrigadasRolOperativoModel from '../models/brigadasRolOperativoModel.js';
import axios from 'axios';

class BrigadasExpedicionController {
  
  static async getAll(req, res) {
    try {
      const brigadas = await BrigadasExpedicionModel.getAll();
      res.json(brigadas);
    } catch (error) {
      console.error('Error en getAll:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const authHeader = req.headers.authorization;
      const brigada = await BrigadasExpedicionModel.getById(req.params.id, authHeader);
      if (!brigada) {
        return res.status(404).json({ error: 'Brigada no encontrada' });
      }
      res.json(brigada);
    } catch (error) {
      console.error('Error en getById:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // COORD_IFN crea la brigada inicial
  static async create(req, res) {
    const token = req.headers.authorization;
    try {
      const { conglomerado_id, jefe_brigada_id, diligenciado_por_id } = req.body;
      const coord_id = req.user?.id;

      console.log('📋 Creando brigada:', { conglomerado_id, jefe_brigada_id, diligenciado_por_id, coord_id });

      if (!coord_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      if (!conglomerado_id || !jefe_brigada_id) {
        return res.status(400).json({ 
          error: 'conglomerado_id y jefe_brigada_id son requeridos' 
        });
      }

      // Validar que el conglomerado existe y está en estado correcto
      let conglomerado;
      try {
        const conglomeradoRes = await axios.get(
          `${process.env.CONGLOMERADOS_SERVICE_URL}/api/conglomerados/${conglomerado_id}`,
          { headers: { Authorization: token } }
        );
        conglomerado = conglomeradoRes.data;
        console.log('✅ Conglomerado obtenido:', conglomerado.codigo, 'Estado:', conglomerado.estado);
      } catch (error) {
        console.error('❌ Error obteniendo conglomerado:', error.message);
        return res.status(404).json({ error: 'Conglomerado no encontrado' });
      }

      if (conglomerado.estado !== 'asignado_a_jefe') {
        return res.status(400).json({ 
          error: 'El conglomerado debe estar en estado asignado_a_jefe',
          estado_actual: conglomerado.estado
        });
      }

      // Validar que el jefe_brigada_id coincide con el del conglomerado
      if (conglomerado.jefe_brigada_asignado_id !== jefe_brigada_id) {
        return res.status(400).json({ 
          error: 'El jefe_brigada_id no coincide con el asignado al conglomerado',
          esperado: conglomerado.jefe_brigada_asignado_id,
          recibido: jefe_brigada_id
        });
      }

      // Verificar que no exista ya una brigada para ese conglomerado
      const brigadaExistente = await BrigadasExpedicionModel.getByConglomerado(conglomerado_id);
      if (brigadaExistente) {
        console.log('⚠️ Ya existe brigada para este conglomerado:', brigadaExistente.id);
        return res.status(409).json({ 
          error: 'Ya existe una brigada para este conglomerado',
          brigada_id: brigadaExistente.id
        });
      }

      // ✅ CORRECCIÓN: Pasar el nombre correcto del campo
      const nuevaBrigada = await BrigadasExpedicionModel.create({
        conglomerado_id,
        jefe_brigada_id,
        diligenciado_por: diligenciado_por_id || coord_id // Usar coord_id como fallback
      });

      console.log('✅ Brigada creada exitosamente:', nuevaBrigada.id);

      res.status(201).json({
        message: 'Brigada creada exitosamente',
        id: nuevaBrigada.id,
        brigada: nuevaBrigada
      });
    } catch (error) {
      console.error('❌ Error en create:', error);
      res.status(500).json({ 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // JEFE_BRIGADA obtiene sus brigadas asignadas
  static async getMisBrigadas(req, res) {
    try {
      const jefe_brigada_id = req.user?.id;
      if (!jefe_brigada_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      // 🆕 Pasar authHeader para enriquecimiento
      const authHeader = req.headers.authorization;
      const brigadas = await BrigadasExpedicionModel.getByJefeBrigada(jefe_brigada_id, authHeader);
      res.json(brigadas);
    } catch (error) {
      console.error('Error en getMisBrigadas:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // JEFE_BRIGADA cambia el estado
  static async cambiarEstado(req, res) {
    try {
      const { id } = req.params;
      const { estado } = req.body;
      const jefe_brigada_id = req.user?.id;

      if (!jefe_brigada_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      if (!estado) {
        return res.status(400).json({ error: 'Estado requerido' });
      }

      const estadosValidos = ['formacion', 'en_transito', 'en_ejecucion', 'completada', 'cancelada'];
      if (!estadosValidos.includes(estado)) {
        return res.status(400).json({ error: 'Estado inválido', estados_validos: estadosValidos });
      }

      const brigada = await BrigadasExpedicionModel.getById(id);
      if (!brigada) {
        return res.status(404).json({ error: 'Brigada no encontrada' });
      }

      if (brigada.jefe_brigada_id !== jefe_brigada_id) {
        return res.status(403).json({ error: 'No tienes permisos para modificar esta brigada' });
      }

      const transicionesValidas = {
        'formacion': ['en_transito', 'cancelada'],
        'en_transito': ['en_ejecucion', 'cancelada'],
        'en_ejecucion': ['completada', 'cancelada'],
        'completada': [],
        'cancelada': []
      };

      if (!transicionesValidas[brigada.estado]?.includes(estado)) {
        return res.status(400).json({ 
          error: `No se puede cambiar de ${brigada.estado} a ${estado}`,
          transiciones_validas: transicionesValidas[brigada.estado]
        });
      }

      const brigadaActualizada = await BrigadasExpedicionModel.cambiarEstado(id, estado);
      res.json({ message: 'Estado actualizado', brigada: brigadaActualizada });
    } catch (error) {
      console.error('Error en cambiarEstado:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // JEFE_BRIGADA registra fechas
  static async registrarFechas(req, res) {
    try {
      const { id } = req.params;
      const { fecha_inicio_campo, fecha_fin_campo } = req.body;
      const jefe_brigada_id = req.user?.id;

      if (!jefe_brigada_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      if (!fecha_inicio_campo || !fecha_fin_campo) {
        return res.status(400).json({ 
          error: 'fecha_inicio_campo y fecha_fin_campo son requeridas' 
        });
      }

      const brigada = await BrigadasExpedicionModel.getById(id);
      if (!brigada) {
        return res.status(404).json({ error: 'Brigada no encontrada' });
      }

      if (brigada.jefe_brigada_id !== jefe_brigada_id) {
        return res.status(403).json({ 
          error: 'No tienes permisos para modificar esta brigada' 
        });
      }

      const brigadaActualizada = await BrigadasExpedicionModel.registrarFechas(
        id,
        fecha_inicio_campo,
        fecha_fin_campo
      );

      res.json({
        message: 'Fechas registradas',
        brigada: brigadaActualizada
      });
    } catch (error) {
      console.error('Error en registrarFechas:', error);
      res.status(500).json({ error: error.message });
    }
  }

// Enviar invitaciones a todos los brigadistas para la brigada
static async enviarInvitaciones(req, res) {
  try {
    const { id } = req.params;
    const jefe_brigada_id = req.user?.id;

    if (!jefe_brigada_id) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    console.log('📧 Enviando invitaciones para brigada:', id);

    // Verificar que la brigada existe y pertenece al jefe
    const brigada = await BrigadasExpedicionModel.getById(id);
    if (!brigada) {
      return res.status(404).json({ error: 'Brigada no encontrada' });
    }

    if (brigada.jefe_brigada_id !== jefe_brigada_id) {
      return res.status(403).json({ 
        error: 'No tienes permisos para modificar esta brigada' 
      });
    }

    // Solo se pueden enviar invitaciones en estado formacion
    if (brigada.estado !== 'formacion') {
      return res.status(400).json({ 
        error: 'Solo se pueden enviar invitaciones en estado formacion',
        estado_actual: brigada.estado
      });
    }

    // Verificar que no se hayan enviado invitaciones previamente
    const miembros = await BrigadasRolOperativoModel.getByBrigada(id);
    const yaEnviadas = miembros.some(m => m.rol_operativo !== 'Jefe' && m.estado_invitacion !== null);
    
    if (yaEnviadas) {
      return res.status(400).json({ 
        error: 'Las invitaciones ya fueron enviadas anteriormente' 
      });
    }

    // Verificar que la brigada tiene los roles mínimos
    const rolesRequeridos = ['Jefe', 'Botanico', 'Tecnico'];
    const rolesPresentes = miembros.map(m => m.rol_operativo);
    const brigadaCompleta = rolesRequeridos.every(rol => rolesPresentes.includes(rol));

    if (!brigadaCompleta) {
      return res.status(400).json({ 
        error: 'La brigada debe tener al menos: Jefe, Botánico y Técnico',
        roles_presentes: rolesPresentes,
        roles_faltantes: rolesRequeridos.filter(r => !rolesPresentes.includes(r))
      });
    }

    // Cambiar estado_invitacion de null a 'pendiente' para todos los brigadistas
    const resultado = await BrigadasRolOperativoModel.enviarInvitaciones(id);

    console.log('✅ Invitaciones enviadas:', resultado);

    res.json({
      success: true,
      message: 'Invitaciones enviadas exitosamente',
      invitaciones_enviadas: resultado.count
    });
  } catch (error) {
    console.error('❌ Error enviando invitaciones:', error);
    res.status(500).json({ 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// Eliminar miembro de la brigada
static async eliminarMiembro(req, res) {
  try {
    const { miembro_id } = req.params;
    const jefe_brigada_id = req.user?.id;

    if (!jefe_brigada_id) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    console.log('🗑️ Eliminando miembro:', miembro_id);

    // Obtener el miembro
    const miembro = await BrigadasRolOperativoModel.getById(miembro_id);
    if (!miembro) {
      return res.status(404).json({ error: 'Miembro no encontrado' });
    }

    // Verificar que es el jefe de la brigada
    const brigada = await BrigadasExpedicionModel.getById(miembro.brigada_id);
    if (!brigada) {
      return res.status(404).json({ error: 'Brigada no encontrada' });
    }

    if (brigada.jefe_brigada_id !== jefe_brigada_id) {
      return res.status(403).json({ 
        error: 'No tienes permisos para modificar esta brigada' 
      });
    }

    // No se puede eliminar el Jefe
    if (miembro.rol_operativo === 'Jefe') {
      return res.status(400).json({ 
        error: 'No se puede eliminar al Jefe de Brigada' 
      });
    }

    // Solo se puede eliminar si NO se han enviado invitaciones
    if (miembro.estado_invitacion !== null) {
      return res.status(400).json({ 
        error: 'No se puede eliminar un miembro después de enviar las invitaciones',
        estado_invitacion: miembro.estado_invitacion
      });
    }

    // Solo se puede eliminar en estado formacion
    if (brigada.estado !== 'formacion') {
      return res.status(400).json({ 
        error: 'Solo se pueden eliminar miembros en estado formacion',
        estado_actual: brigada.estado
      });
    }

    // Eliminar
    await BrigadasRolOperativoModel.delete(miembro_id);

    console.log('✅ Miembro eliminado exitosamente');

    res.json({
      success: true,
      message: 'Miembro eliminado de la brigada'
    });
  } catch (error) {
    console.error('❌ Error eliminando miembro:', error);
    res.status(500).json({ 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
  static async getByEstado(req, res) {
    try {
      const { estado } = req.params;
      const brigadas = await BrigadasExpedicionModel.getByEstado(estado);
      res.json(brigadas);
    } catch (error) {
      console.error('Error en getByEstado:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default BrigadasExpedicionController;