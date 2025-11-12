// models/brigadistasSubrolModel.js
import supabase from '../config/database.js';

class BrigadistasSubrolModel {
  
  // Asignar múltiples roles a un brigadista
  static async asignar(brigadista_id, subroles_ids, asignado_por) {
      const registros = subroles_ids.map(subrol_id => ({
        brigadista_id,
        subrol_id,
        asignado_por,
        activo: true
      }));

    const { data, error } = await supabase
      .from('brigadistas_subrol')
      .insert(registros)
      .select(`
        *,
        sub_rol (
          id,
          codigo,
          nombre,
          descripcion
        )
      `);
    
    if (error) throw error;
    return data || [];
  }

  // Obtener roles de un brigadista
  static async getByBrigadista(brigadista_id) {
    const { data, error } = await supabase
      .from('brigadistas_subrol')
      .select(`
        id,
        activo,
        fecha_asignacion,
        sub_rol (
          id,
          codigo,
          nombre,
          descripcion
        )
      `)
      .eq('brigadista_id', brigadista_id)
      .eq('activo', true);
    
    if (error) throw error;
    return data || [];
  }

  // Obtener brigadistas con un rol específico
  static async getBySubrol(subrol_id) {
    const { data, error } = await supabase
      .from('brigadistas_subrol')
      .select(`
        *,
        brigadistas (
          id,
          user_id,
          municipio_id,
          activo,
          estado_solicitud
        )
      `)
      .eq('subrol_id', subrol_id)
      .eq('activo', true);
    
    if (error) throw error;
    return data || [];
  }

  // Desactivar un rol
  static async desactivar(brigadista_id, subrol_id) {
    const { data, error } = await supabase
      .from('brigadistas_subrol')
      .update({ activo: false })
      .eq('brigadista_id', brigadista_id)
      .eq('subrol_id', subrol_id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Activar un rol
  static async activar(brigadista_id, subrol_id) {
    const { data, error } = await supabase
      .from('brigadistas_subrol')
      .update({ activo: true })
      .eq('brigadista_id', brigadista_id)
      .eq('subrol_id', subrol_id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Verificar si tiene un rol específico
  static async tieneRol(brigadista_id, subrol_codigo) {
    const { data, error } = await supabase
      .from('brigadistas_subrol')
      .select('id, sub_rol!inner(codigo)')
      .eq('brigadista_id', brigadista_id)
      .eq('activo', true)
      .eq('sub_rol.codigo', subrol_codigo)
      .maybeSingle();
    
    if (error) throw error;
    return data !== null;
  }

  // Eliminar permanentemente
  static async eliminar(brigadista_id, subrol_id) {
    const { error } = await supabase
      .from('brigadistas_subrol')
      .delete()
      .eq('brigadista_id', brigadista_id)
      .eq('subrol_id', subrol_id);
    
    if (error) throw error;
    return true;
  }
}

export default BrigadistasSubrolModel;