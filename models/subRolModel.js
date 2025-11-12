// models/subRolModel.js
import supabase from '../config/database.js';

class SubRolModel {
  
  static async getAll() {
    const { data, error } = await supabase
      .from('sub_rol')
      .select('*')
      .order('nombre', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  static async getById(id) {
    const { data, error } = await supabase
      .from('sub_rol')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }

  static async getByCodigo(codigo) {
    const { data, error } = await supabase
      .from('sub_rol')
      .select('*')
      .eq('codigo', codigo)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }
}

export default SubRolModel;