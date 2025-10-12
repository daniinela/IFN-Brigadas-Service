// models/brigadasModel.js
import supabase from '../config/database.js';

class BrigadasModel {
  
  static async getAll() {
    const { data, error } = await supabase
      .from('brigadas')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async getById(id) {
    const { data, error } = await supabase
      .from('brigadas')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }

  static async create(brigada) {
    const { data, error } = await supabase
      .from('brigadas')
      .insert([{
        id: crypto.randomUUID(),
        conglomerado_id: brigada.conglomerado_id,
        estado: 'formacion', // Siempre empieza en formación
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async update(id, updates) {
    const { data, error } = await supabase
      .from('brigadas')
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
      .from('brigadas')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }

  static async getByConglomerado(conglomerado_id) {
    const { data, error } = await supabase
      .from('brigadas')
      .select('*')
      .eq('conglomerado_id', conglomerado_id)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }

  static async getByEstado(estado) {
    const { data, error } = await supabase
      .from('brigadas')
      .select('*')
      .eq('estado', estado);
    
    if (error) throw error;
    return data || [];
  }

  // Obtener brigada con brigadistas (consulta optimizada)
  static async getConBrigadistas(id) {
    // 1. Obtener brigada
    const brigada = await this.getById(id);
    if (!brigada) return null;

    // 2. Obtener asignaciones
    const { data: asignaciones, error: asignacionesError } = await supabase
      .from('brigadas_brigadistas')
      .select('*')
      .eq('brigada_id', id);
    
    if (asignacionesError) throw asignacionesError;

    // 3. Obtener datos de brigadistas (en lotes)
    const brigadistaIds = asignaciones.map(a => a.brigadista_id);
    if (brigadistaIds.length === 0) {
      return { ...brigada, brigadistas: [] };
    }

    const { data: brigadistas, error: brigadistasError } = await supabase
      .from('brigadistas')
      .select('*')
      .in('id', brigadistaIds);
    
    if (brigadistasError) throw brigadistasError;

    // 4. Combinar datos
    const brigadaConBrigadistas = {
      ...brigada,
      brigadistas: brigadistas.map(b => ({
        ...b,
        asignacion: asignaciones.find(a => a.brigadista_id === b.id)
      }))
    };

    return brigadaConBrigadistas;
  }

  // Cambiar estado de brigada
  static async cambiarEstado(id, nuevoEstado) {
    const estadosValidos = ['formacion', 'activa', 'completada', 'cancelada'];
    if (!estadosValidos.includes(nuevoEstado)) {
      throw new Error('Estado inválido');
    }

    const { data, error } = await supabase
      .from('brigadas')
      .update({
        estado: nuevoEstado,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}

export default BrigadasModel;