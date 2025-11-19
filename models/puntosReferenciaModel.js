// brigadas-service/models/puntosReferenciaModel.js
import supabase from '../config/database.js';

class PuntosReferenciaModel {
  
  static async getByRuta(ruta_id) {
    const { data, error } = await supabase
      .from('puntos_referencia')
      .select('*')
      .eq('ruta_id', ruta_id)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  static async create(punto) {
    const { data, error } = await supabase
      .from('puntos_referencia')
      .insert([{
        ruta_id: punto.ruta_id,
        nombre_punto: punto.nombre_punto,
        latitud: punto.latitud,
        longitud: punto.longitud,
        error_gps_m: punto.error_gps_m
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
static async getById(id) {
    const { data, error } = await supabase
      .from('puntos_referencia')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }
  static async update(id, updates) {
    const { data, error } = await supabase
      .from('puntos_referencia')
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
      .from('puntos_referencia')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }
}

export default PuntosReferenciaModel;