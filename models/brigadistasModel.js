// models/brigadistasModel.js
import supabase from '../config/database.js';

class BrigadistasModel {
  
  static async getAll() {
    const { data, error } = await supabase
      .from('brigadistas')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async getById(id) {
    const { data, error } = await supabase
      .from('brigadistas')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }

  static async getByUserId(user_id) {
    const { data, error } = await supabase
      .from('brigadistas')
      .select('*')
      .eq('user_id', user_id)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }

static async create(brigadista) {
  const { data, error } = await supabase
    .from('brigadistas')
    .insert([{
      user_id: brigadista.user_id,
      municipio_id: brigadista.municipio_id,
      titulos: brigadista.titulos || [],
      experiencia_laboral: brigadista.experiencia_laboral || [],
      disponibilidad: brigadista.disponibilidad || []
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

 static async update(id, updates) {
  const { data, error } = await supabase
    .from('brigadistas')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

  static async delete(id) {
    const { error } = await supabase
      .from('brigadistas')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }

  static async getByMunicipio(municipio) {
    const { data, error } = await supabase
      .from('brigadistas')
      .select('*')
      .eq('municipio', municipio);
    
    if (error) throw error;
    return data || [];
  }
//Nuevo para mis departamentos
static async getByDepartamento(departamento_id) {
  const { data: municipios } = await supabase
    .from('municipios')
    .select('id')
    .eq('departamento_id', departamento_id);
  
  if (!municipios || municipios.length === 0) return [];
  
  const municipios_ids = municipios.map(m => m.id);
  
  const { data, error } = await supabase
    .from('brigadistas')
    .select('*')
    .in('municipio_id', municipios_ids)
    .eq('activo', true)
    .eq('estado_solicitud', 'aprobado');
  
  if (error) throw error;
  return data || [];
}

  static async getByRol(rol) {
    const { data, error } = await supabase
      .from('brigadistas')
      .select('*')
      .eq('rol', rol);
    
    if (error) throw error;
    return data || [];
  }

  // ✅ CORREGIDO: brigadas_brigadistas (con 's')
  static async tieneAsignacionActiva(id) {
    const { data, error } = await supabase
      .from('brigadas_brigadistas')  // ← AQUÍ
      .select('brigada_id, brigadas(estado)')
      .eq('brigadista_id', id)
      .eq('estado_invitacion', 'aceptada');
    
    if (error) throw error;
    
    return data && data.some(asig => 
      asig.brigadas?.estado === 'activa' || 
      asig.brigadas?.estado === 'formacion'
    );
  }

  static async verificarTitulos(id, titulosVerificados) {
    const { data, error } = await supabase
      .from('brigadistas')
      .update({
        titulos: titulosVerificados,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async actualizarDisponibilidad(id, disponibilidad) {
    const { data, error } = await supabase
      .from('brigadistas')
      .update({
        disponibilidad: disponibilidad,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getDisponiblesPorMunicipio(municipio) {
    const { data, error } = await supabase
      .from('brigadistas')
      .select('*')
      .eq('municipio', municipio);
    
    if (error) throw error;
    return data || [];
  }


  static async getConDetalles(id) {
    const { data, error } = await supabase
      .from('brigadistas')
      .select(`
        *,
        brigadas_brigadistas (  
          brigada_id,
          estado_invitacion,
          fecha_inicio_trabajo,
          fecha_fin_trabajo,
          brigadas (
            id,
            conglomerado_id,
            estado
          )
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }
}

export default BrigadistasModel;