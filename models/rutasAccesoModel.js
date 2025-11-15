// brigadas-service/models/rutasAccesoModel.js
import supabase from '../config/database.js';

class RutasAccesoModel {
  
  static async getByBrigada(brigada_id) {
    const { data, error } = await supabase
      .from('rutas_acceso')
      .select(`
        *,
        puntos_referencia (*)
      `)
      .eq('brigada_id', brigada_id)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  static async getById(id) {
    const { data, error } = await supabase
      .from('rutas_acceso')
      .select(`
        *,
        puntos_referencia (*)
      `)
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }

  static async create(ruta) {
    const { data, error } = await supabase
      .from('rutas_acceso')
      .insert([{
        brigada_id: ruta.brigada_id,
        tipo_ruta: ruta.tipo_ruta,
        medio_transporte: ruta.medio_transporte,
        tiempo_acceso: ruta.tiempo_acceso,
        distancia_km: ruta.distancia_km
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async update(id, updates) {
    const { data, error } = await supabase
      .from('rutas_acceso')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async delete(id) {
    const { error } = await supabase
      .from('rutas_acceso')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }
}

export default RutasAccesoModel;