// models/brigadasbrigadistasModel.js
import supabase from '../config/database.js';

class BrigadasBrigadistasModel {
  
  // Invitar brigadista a brigada
  static async invitar(brigada_id, brigadista_id, fechas = {}) {
    const { data, error } = await supabase
      .from('brigadas_brigadistas')
      .insert([{
        id: crypto.randomUUID(),
        brigada_id,
        brigadista_id,
        estado_invitacion: 'pendiente',
        fecha_invitacion: new Date().toISOString(),
        fecha_inicio_trabajo: fechas.fecha_inicio || null,
        fecha_fin_trabajo: fechas.fecha_fin || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Brigadista responde invitación
  static async responderInvitacion(id, aceptada, motivo_rechazo = null) {
    const { data, error } = await supabase
      .from('brigadas_brigadistas')
      .update({
        estado_invitacion: aceptada ? 'aceptada' : 'rechazada',
        fecha_respuesta: new Date().toISOString(),
        motivo_rechazo: motivo_rechazo || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Desasignar brigadista de brigada
  static async desasignar(brigada_id, brigadista_id) {
    const { error } = await supabase
      .from('brigadas_brigadistas')
      .delete()
      .eq('brigada_id', brigada_id)
      .eq('brigadista_id', brigadista_id);
    
    if (error) throw error;
    return true;
  }

  // Obtener asignaciones de una brigada
  static async getByBrigada(brigada_id) {
    const { data, error } = await supabase
      .from('brigadas_brigadistas')
      .select(`
        *,
        brigadistas (
          id,
          user_id,
          municipio,
          titulos,
          experiencia_laboral,
          rol
        )
      `)
      .eq('brigada_id', brigada_id);
    
    if (error) throw error;
    return data || [];
  }

  // Obtener brigadas de un brigadista
  static async getByBrigadista(brigadista_id) {
    const { data, error } = await supabase
      .from('brigadas_brigadistas')
      .select(`
        *,
        brigadas (
          id,
          conglomerado_id,
          estado
        )
      `)
      .eq('brigadista_id', brigadista_id);
    
    if (error) throw error;
    return data || [];
  }

  // Obtener invitaciones pendientes de un brigadista
  static async getInvitacionesPendientes(brigadista_id) {
    const { data, error } = await supabase
      .from('brigadas_brigadistas')
      .select(`
        *,
        brigadas (
          id,
          conglomerado_id,
          estado
        )
      `)
      .eq('brigadista_id', brigadista_id)
      .eq('estado_invitacion', 'pendiente');
    
    if (error) throw error;
    return data || [];
  }

  // Verificar si existe asignación
  static async existeAsignacion(brigada_id, brigadista_id) {
    const { data, error } = await supabase
      .from('brigadas_brigadistas')
      .select('id')
      .eq('brigada_id', brigada_id)
      .eq('brigadista_id', brigadista_id)
      .maybeSingle();
    
    if (error) throw error;
    return data !== null;
  }

  // Obtener por ID
  static async getById(id) {
    const { data, error } = await supabase
      .from('brigadas_brigadistas')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }

  // Actualizar fechas de trabajo
  static async actualizarFechas(id, fechas) {
    const { data, error } = await supabase
      .from('brigadas_brigadistas')
      .update({
        fecha_inicio_trabajo: fechas.fecha_inicio,
        fecha_fin_trabajo: fechas.fecha_fin,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}

export default BrigadasBrigadistasModel;