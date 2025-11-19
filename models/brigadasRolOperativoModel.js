// brigadas-service/models/brigadasRolOperativoModel.js
import supabase from '../config/database.js';

class BrigadasRolOperativoModel {
  
  static async getByBrigada(brigada_id) {
    const { data, error } = await supabase
      .from('brigadas_rol_operativo')
      .select('*')
      .eq('brigada_id', brigada_id)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  // NUEVO: Obtener invitaciones de un usuario específico
  static async getByUsuario(usuario_id, filtros = {}) {
    let query = supabase
      .from('brigadas_rol_operativo')
      .select(`
        *,
        brigadas_expedicion (
          id,
          conglomerado_id,
          estado,
          fecha_inicio_campo,
          fecha_fin_campo,
          jefe_brigada_id
        )
      `)
      .eq('usuario_id', usuario_id);

    // Filtrar por estado de invitación si se especifica
    if (filtros.estado_invitacion) {
      query = query.eq('estado_invitacion', filtros.estado_invitacion);
    }

    // Filtrar por estado de brigada si se especifica
    if (filtros.estado_brigada) {
      query = query.eq('brigadas_expedicion.estado', filtros.estado_brigada);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async create(asignacion) {
    const { data, error } = await supabase
      .from('brigadas_rol_operativo')
      .insert([{
        brigada_id: asignacion.brigada_id,
        usuario_id: asignacion.usuario_id,
        rol_operativo: asignacion.rol_operativo,
        estado_invitacion: 'pendiente' // Por defecto pendiente
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async responderInvitacion(id, respuesta, motivo_rechazo = null) {
    const updates = {
      estado_invitacion: respuesta,
      fecha_respuesta: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (respuesta === 'rechazada' && motivo_rechazo) {
      updates.motivo_rechazo = motivo_rechazo;
    }

    const { data, error } = await supabase
      .from('brigadas_rol_operativo')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        brigadas_expedicion (*)
      `)
      .single();
    
    if (error) throw error;
      if (data) {
    const BrigadasExpedicionModel = (await import('./brigadasExpedicionModel.js')).default;
    await BrigadasExpedicionModel.verificarYCambiarEstado(data.brigada_id);
  }
  
    return data;
  }

  static async delete(id) {
    const { error } = await supabase
      .from('brigadas_rol_operativo')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }
// Agregar este método al archivo brigadasRolOperativoModel.js

// 🆕 NUEVO: Enviar invitaciones (cambiar estado_invitacion de null a 'pendiente')
static async enviarInvitaciones(brigada_id) {
  console.log('📧 Enviando invitaciones para brigada:', brigada_id);
  
  const { data, error, count } = await supabase
    .from('brigadas_rol_operativo')
    .update({ 
      estado_invitacion: 'pendiente',
      updated_at: new Date().toISOString()
    })
    .eq('brigada_id', brigada_id)
    .is('estado_invitacion', null) // Solo actualizar los que tienen null
    .neq('rol_operativo', 'Jefe') // Excluir al Jefe
    .select();
  
  if (error) {
    console.error('❌ Error enviando invitaciones:', error);
    throw error;
  }
  
  console.log(`✅ ${data?.length || 0} invitaciones enviadas`);
  
  return {
    success: true,
    count: data?.length || 0,
    data
  };
}
  static async existeRol(brigada_id, rol_operativo) {
    const { data, error } = await supabase
      .from('brigadas_rol_operativo')
      .select('id')
      .eq('brigada_id', brigada_id)
      .eq('rol_operativo', rol_operativo)
      .eq('estado_invitacion', 'aceptada') // Solo contar aceptadas
      .maybeSingle();
    
    if (error) throw error;
    return !!data;
  }

  static async existeUsuario(brigada_id, usuario_id) {
    const { data, error } = await supabase
      .from('brigadas_rol_operativo')
      .select('id')
      .eq('brigada_id', brigada_id)
      .eq('usuario_id', usuario_id)
      .maybeSingle();
    
    if (error) throw error;
    return !!data;
  }

  static async contarPorRol(brigada_id, rol_operativo) {
    const { count, error } = await supabase
      .from('brigadas_rol_operativo')
      .select('*', { count: 'exact', head: true })
      .eq('brigada_id', brigada_id)
      .eq('rol_operativo', rol_operativo)
      .eq('estado_invitacion', 'aceptada'); // Solo contar aceptadas
    
    if (error) throw error;
    return count || 0;
  }

  // NUEVO: Obtener por ID
  static async getById(id) {
    const { data, error } = await supabase
      .from('brigadas_rol_operativo')
      .select(`
        *,
        brigadas_expedicion (*)
      `)
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }
}

export default BrigadasRolOperativoModel;