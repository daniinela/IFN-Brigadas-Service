// brigadas-service/models/brigadasExpedicionModel.js
import supabase from '../config/database.js';
import axios from 'axios';

const CONGLOMERADOS_SERVICE = process.env.CONGLOMERADOS_SERVICE_URL || 'http://localhost:3002';
const UBICACIONES_SERVICE = process.env.GEO_SERVICE_URL || 'http://localhost:3004';

class BrigadasExpedicionModel {
  
  // 🆕 Método auxiliar para enriquecer brigadas con datos del conglomerado
  static async enriquecerConDatosConglomerado(brigada, authHeader) {
    if (!brigada.conglomerado_id) {
      console.warn('⚠️ Brigada sin conglomerado_id:', brigada.id);
      return brigada;
    }

    try {
      console.log('🔗 Consultando conglomerado:', brigada.conglomerado_id);
      
      // 1. Obtener datos del conglomerado
      const congResponse = await axios.get(
        `${CONGLOMERADOS_SERVICE}/api/conglomerados/${brigada.conglomerado_id}`,
        { headers: { 'Authorization': authHeader } }
      );
      
      const conglomerado = congResponse.data;
      console.log('✅ Conglomerado obtenido:', conglomerado.codigo);

      // 2. Obtener datos geográficos si existen IDs
      if (conglomerado.municipio_id || conglomerado.departamento_id || conglomerado.region_id) {
        try {
          const [municipioRes, departamentoRes, regionRes] = await Promise.allSettled([
            conglomerado.municipio_id 
              ? axios.get(`${UBICACIONES_SERVICE}/api/municipios/${conglomerado.municipio_id}`, { headers: { 'Authorization': authHeader } })
              : Promise.resolve(null),
            conglomerado.departamento_id
              ? axios.get(`${UBICACIONES_SERVICE}/api/departamentos/${conglomerado.departamento_id}`, { headers: { 'Authorization': authHeader } })
              : Promise.resolve(null),
            conglomerado.region_id
              ? axios.get(`${UBICACIONES_SERVICE}/api/regiones/${conglomerado.region_id}`, { headers: { 'Authorization': authHeader } })
              : Promise.resolve(null)
          ]);

          conglomerado.municipio = municipioRes.status === 'fulfilled' ? municipioRes.value?.data : null;
          conglomerado.departamento = departamentoRes.status === 'fulfilled' ? departamentoRes.value?.data : null;
          conglomerado.region = regionRes.status === 'fulfilled' ? regionRes.value?.data : null;

          console.log('📍 Ubicación:', {
            municipio: conglomerado.municipio?.nombre,
            departamento: conglomerado.departamento?.nombre,
            region: conglomerado.region?.nombre
          });
        } catch (geoError) {
          console.warn('⚠️ Error obteniendo datos geográficos:', geoError.message);
        }
      }

      brigada.conglomerado = conglomerado;
    } catch (error) {
      console.error('❌ Error enriqueciendo brigada:', error.message);
    }

    return brigada;
  }

  static async getAll() {
    const { data, error } = await supabase
      .from('brigadas_expedicion')
      .select(`
        *,
        brigadas_rol_operativo (
          id,
          usuario_id,
          rol_operativo,
          estado_invitacion,
          fecha_respuesta,
          motivo_rechazo,
          created_at
        ),
        rutas_acceso (
          id,
          tipo_ruta,
          medio_transporte,
          tiempo_acceso,
          distancia_km,
          puntos_referencia (*)
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async getById(id, authHeader) {
    const { data, error } = await supabase
      .from('brigadas_expedicion')
      .select(`
        *,
        brigadas_rol_operativo (
          id,
          usuario_id,
          rol_operativo,
          estado_invitacion,
          fecha_respuesta,
          motivo_rechazo,
          created_at
        ),
        rutas_acceso (
          id,
          tipo_ruta,
          medio_transporte,
          tiempo_acceso,
          distancia_km,
          created_at,
          puntos_referencia (
            id,
            nombre_punto,
            latitud,
            longitud,
            error_gps_m,
            created_at
          )
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    // 🆕 Enriquecer con datos del conglomerado
    if (data && authHeader) {
      return await this.enriquecerConDatosConglomerado(data, authHeader);
    }
    
    return data;
  }

  // ✅ MÉTODO FALTANTE - Obtener brigada por conglomerado_id
  static async getByConglomerado(conglomerado_id) {
    console.log('🔍 Buscando brigada para conglomerado:', conglomerado_id);
    
    const { data, error } = await supabase
      .from('brigadas_expedicion')
      .select('*')
      .eq('conglomerado_id', conglomerado_id)
      .maybeSingle();
    
    if (error) {
      console.error('❌ Error buscando brigada:', error);
      throw error;
    }
    
    if (data) {
      console.log('✅ Brigada encontrada:', data.id);
    } else {
      console.log('ℹ️ No existe brigada para este conglomerado');
    }
    
    return data;
  }

  static async getByJefeBrigada(jefe_brigada_id, authHeader) {
    console.log('📊 Buscando brigadas del jefe:', jefe_brigada_id);
    
    const { data, error } = await supabase
      .from('brigadas_expedicion')
      .select(`
        *,
        brigadas_rol_operativo (
          id,
          usuario_id,
          rol_operativo,
          estado_invitacion,
          fecha_respuesta,
          created_at
        ),
        rutas_acceso (
          id,
          tipo_ruta,
          medio_transporte,
          tiempo_acceso,
          distancia_km
        )
      `)
      .eq('jefe_brigada_id', jefe_brigada_id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error en query:', error);
      throw error;
    }
    
    console.log(`✅ ${data?.length || 0} brigadas encontradas`);

    // 🆕 Enriquecer TODAS las brigadas con datos del conglomerado
    if (data && data.length > 0 && authHeader) {
      const brigadasEnriquecidas = await Promise.all(
        data.map(brigada => this.enriquecerConDatosConglomerado(brigada, authHeader))
      );
      return brigadasEnriquecidas;
    }
    
    return data || [];
  }

  static async getByEstado(estado) {
    const { data, error } = await supabase
      .from('brigadas_expedicion')
      .select(`
        *,
        brigadas_rol_operativo (*)
      `)
      .eq('estado', estado)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async create(brigada) {
    const { data, error } = await supabase
      .from('brigadas_expedicion')
      .insert([{
        conglomerado_id: brigada.conglomerado_id,
        jefe_brigada_id: brigada.jefe_brigada_id,
        diligenciado_por: brigada.diligenciado_por,
        estado: 'formacion'
      }])
      .select()
      .single();
    
    if (error) throw error;

    // 🆕 Crear automáticamente el registro del Jefe en brigadas_rol_operativo
    if (data) {
      const { error: rolError } = await supabase
        .from('brigadas_rol_operativo')
        .insert([{
          brigada_id: data.id,
          usuario_id: brigada.jefe_brigada_id,
          rol_operativo: 'Jefe',
          estado_invitacion: 'aceptada', // El jefe no necesita aceptar
          fecha_respuesta: new Date().toISOString()
        }]);

      if (rolError) {
        console.error('⚠️ Error creando rol de Jefe:', rolError);
      }
    }

    return data;
  }

  static async cambiarEstado(id, nuevoEstado) {
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
    return data;
  }

  // 🆕 Verificar si la brigada está completa y cambiar estado automáticamente
  static async verificarYCambiarEstado(brigada_id) {
    try {
      console.log('🔍 Verificando estado de brigada:', brigada_id);

      // Obtener todos los miembros
      const { data: miembros, error } = await supabase
        .from('brigadas_rol_operativo')
        .select('*')
        .eq('brigada_id', brigada_id);

      if (error) throw error;

      // Verificar roles requeridos
      const rolesRequeridos = ['Jefe', 'Botanico', 'Tecnico'];
      const rolesPresentes = miembros.map(m => m.rol_operativo);
      const tieneRolesMinimos = rolesRequeridos.every(rol => rolesPresentes.includes(rol));

      // Verificar que todos han aceptado
      const todosAceptaron = miembros.every(m => m.estado_invitacion === 'aceptada');

      console.log('📊 Estado verificación:', {
        tieneRolesMinimos,
        todosAceptaron,
        totalMiembros: miembros.length
      });

      // Si cumple condiciones, cambiar a en_transito
      if (tieneRolesMinimos && todosAceptaron) {
        await this.cambiarEstado(brigada_id, 'en_transito');
        console.log('✅ Brigada cambiada a EN_TRANSITO automáticamente');
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Error verificando estado:', error);
      return false;
    }
  }

  static async registrarFechas(id, fecha_inicio_campo, fecha_fin_campo) {
    const { data, error } = await supabase
      .from('brigadas_expedicion')
      .update({
        fecha_inicio_campo,
        fecha_fin_campo,
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