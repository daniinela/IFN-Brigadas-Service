// brigadas-service/models/ubicacionesModel.js
import { createClient } from '@supabase/supabase-js';

const ubicacionesClient = createClient(
  process.env.SUPABASE_UBICACIONES_URL,
  process.env.SUPABASE_UBICACIONES_KEY
);

class UbicacionesModel {
  static async getMunicipioById(id) {
    const { data, error } = await ubicacionesClient
      .from('municipios')
      .select(`
        *,
        departamentos (id, nombre, codigo, region_id)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getMunicipiosByDepartamento(departamento_id) {
    const { data, error } = await ubicacionesClient
      .from('municipios')
      .select('id, nombre, codigo')
      .eq('departamento_id', departamento_id);
    
    if (error) throw error;
    return data || [];
  }

  static async getAllDepartamentos() {
    const { data, error } = await ubicacionesClient
      .from('departamentos')
      .select('id, nombre, codigo, region_id');
    
    if (error) throw error;
    return data || [];
  }
}

export default UbicacionesModel;