// brigadas-service/models/brigadasExpedicionModel.js
import supabase from '../config/database.js';
import axios from 'axios';

const CONGLOMERADOS_SERVICE_URL = process.env.CONGLOMERADOS_SERVICE_URL || 'http://localhost:3002';

class BrigadasExpedicionModel {
  
  static async getAll() {
    const { data, error } = await supabase
      .from('brigadas_expedicion')
      .select(`
        *,
        brigadas_rol_operativo (
          id, usuario_id, rol_operativo
        ),
        rutas_acceso (
          id, tipo_ruta, medio_transporte, distancia_km
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async getById(id) {
    const { data, error } = await supabase
      .from('brigadas_expedicion')
      .select(`
        *,
        brigadas_rol_operativo (
          id, usuario_id, rol_operativo, created_at
        ),
        rutas_acceso (
          *,
          puntos_referencia (*)
        )
      `)
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }

  static async create(brigada) {
    // Usar diligenciado_por_id en lugar de diligenciado_por
    const { data, error } = await supabase
      .from('brigadas_expedicion')
      .insert([{
        conglomerado_id: brigada.conglomerado_id,
        jefe_brigada_id: brigada.jefe_brigada_id,
        estado: 'formacion',
        diligenciado_por_id: brigada.diligenciado_por_id || brigada.jefe_brigada_id
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async update(id, updates) {
    const { data, error } = await supabase
      .from('brigadas_expedicion')
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

  // NUEVO: Cambiar estado con sincronización automática al conglomerado
  static async cambiarEstado(id, nuevoEstado) {
    // 1. Obtener la brigada para saber el conglomerado_id
    const brigada = await this.getById(id);
    if (!brigada) throw new Error('Brigada no encontrada');

    // 2. Actualizar estado de la brigada
    const { data, error } = await supabase
      .from('brigadas_expedicion')
      .update({ 
        estado: nuevoEstado,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // 3. SINCRONIZACIÓN: Actualizar estado del conglomerado según la lógica IFN
    const estadoConglomerado = this._mapearEstadoBrigadaAConglomerado(nuevoEstado);
    
    if (estadoConglomerado) {
      try {
        await axios.patch(
          `${CONGLOMERADOS_SERVICE_URL}/api/conglomerados/${brigada.conglomerado_id}/estado`,
          { estado: estadoConglomerado },
          { 
            headers: { 
              'Content-Type': 'application/json',
              // Pasar el token de autorización del request original
              'Authorization': this._getAuthHeader()
            }
          }
        );
      } catch (err) {
        console.error('Error sincronizando estado del conglomerado:', err.message);
        // NO revertimos la brigada, solo logueamos el error
        // En un sistema más robusto, usarías un evento/cola
      }
    }

    return data;
  }

  // Mapeo según documento IFN
  static _mapearEstadoBrigadaAConglomerado(estadoBrigada) {
    const mapeo = {
      'en_transito': 'en_ejecucion',     // Cuando sale a campo
      'en_ejecucion': null,               // Sin cambio
      'completada': 'finalizado_campo',   // Cuando termina exitosamente
      'cancelada': 'no_establecido'       // Cuando no pudo establecer
    };
    return mapeo[estadoBrigada];
  }

  // Helper para obtener el header de autorización (lo seteas desde el controller)
  static _authHeader = null;
  static _getAuthHeader() {
    return this._authHeader;
  }
  static setAuthHeader(header) {
    this._authHeader = header;
  }

  static async getByJefeBrigada(jefe_brigada_id) {
    const { data, error } = await supabase
      .from('brigadas_expedicion')
      .select(`
        *,
        brigadas_rol_operativo (
          id, usuario_id, rol_operativo
        )
      `)
      .eq('jefe_brigada_id', jefe_brigada_id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async getByConglomerado(conglomerado_id) {
    const { data, error } = await supabase
      .from('brigadas_expedicion')
      .select('*')
      .eq('conglomerado_id', conglomerado_id)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }

  static async getByEstado(estado) {
    const { data, error } = await supabase
      .from('brigadas_expedicion')
      .select(`
        *,
        brigadas_rol_operativo (
          id, usuario_id, rol_operativo
        )
      `)
      .eq('estado', estado)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async registrarFechas(id, fecha_inicio, fecha_fin) {
    const { data, error } = await supabase
      .from('brigadas_expedicion')
      .update({ 
        fecha_inicio_campo: fecha_inicio,
        fecha_fin_campo: fecha_fin,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export default BrigadasExpedicionModel;