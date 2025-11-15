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

  static async create(asignacion) {
    const { data, error } = await supabase
      .from('brigadas_rol_operativo')
      .insert([{
        brigada_id: asignacion.brigada_id,
        usuario_id: asignacion.usuario_id,
        rol_operativo: asignacion.rol_operativo
      }])
      .select()
      .single();
    
    if (error) throw error;
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

  static async existeRol(brigada_id, rol_operativo) {
    const { data, error } = await supabase
      .from('brigadas_rol_operativo')
      .select('id')
      .eq('brigada_id', brigada_id)
      .eq('rol_operativo', rol_operativo)
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
      .eq('rol_operativo', rol_operativo);
    
    if (error) throw error;
    return count || 0;
  }
}

export default BrigadasRolOperativoModel;