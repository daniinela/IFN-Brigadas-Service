// brigadas-service/controllers/brigadasController.js
import BrigadasModel from '../models/brigadasModel.js';
import BrigadistasModel from '../models/brigadistasModel.js';
import axios from 'axios';

class BrigadasController {
  
  static async getAll(req, res) {
    try {
      const brigadas = await BrigadasModel.getAll();
      res.json(brigadas);
    } catch (error) {
      console.error('Error en getAll:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const brigada = await BrigadasModel.getConBrigadistas(req.params.id);
      
      if (!brigada) {
        return res.status(404).json({ error: 'Brigada no encontrada' });
      }
      
      res.json(brigada);
    } catch (error) {
      console.error('Error en getById:', error);
      res.status(500).json({ error: error.message });
    }
  }
static async cancelar(req, res) {
    try {
      const { id } = req.params;
      const { motivo } = req.body;
      const coord_id = req.user?.id;
      
      if (!coord_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      if (!motivo || motivo.trim() === '') {
        return res.status(400).json({ error: 'Motivo de cancelación requerido' });
      }
      
      const brigada = await BrigadasModel.getById(id);
      
      if (!brigada) {
        return res.status(404).json({ error: 'Brigada no encontrada' });
      }

      // Solo se pueden cancelar si están en formación o activas
      if (!['formacion', 'activa'].includes(brigada.estado)) {
        return res.status(400).json({ 
          error: 'Solo se pueden cancelar brigadas en formación o activas',
          estado_actual: brigada.estado
        });
      }
      
      const resultado = await BrigadasModel.cancelar(id, motivo, coord_id);
      
      // Desmarcar conglomerado
      if (brigada.conglomerado_id) {
        try {
          const token = req.headers.authorization;
          await axios.put(
            `${process.env.CONGLOMERADOS_SERVICE_URL}/api/conglomerados/${brigada.conglomerado_id}`,
            { tiene_brigada: false },
            { headers: { Authorization: token } }
          );
        } catch (error) {
          console.error('⚠️ Error desmarcando conglomerado:', error.message);
        }
      }
      
      res.json({ 
        message: 'Brigada cancelada exitosamente',
        brigada: resultado
      });
    } catch (error) {
      console.error('Error en cancelar:', error);
      res.status(500).json({ error: error.message });
    }
  }
  static async getConBrigadistas(req, res) {
    try {
      const { id } = req.params;
      const brigada = await BrigadasModel.getConBrigadistas(id);
      
      if (!brigada) {
        return res.status(404).json({ error: 'Brigada no encontrada' });
      }
      
      res.json(brigada);
    } catch (error) {
      console.error('Error en getConBrigadistas:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // ✅ CORREGIDO: Obtener conglomerados disponibles para coordinador de brigadas
  static async getConglomeradosDisponibles(req, res) {
    try {
      const coord_id = req.user?.id;

      if (!coord_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const token = req.headers.authorization;

      // 1️⃣ Obtener cuenta_rol del coordinador desde usuarios-service
      let cuentaRolRes;
      try {
        cuentaRolRes = await axios.get(
          `${process.env.USUARIOS_SERVICE_URL}/api/cuentas-rol/usuario/${coord_id}`,
          { headers: { Authorization: token } }
        );
      } catch (error) {
        console.error('❌ Error consultando usuarios-service:', error.message);
        return res.status(500).json({ 
          error: 'Error al verificar permisos del coordinador',
          detalles: 'No se pudo conectar con usuarios-service'
        });
      }

      const cuentasRol = cuentaRolRes.data;
      
      // Buscar cuenta activa con rol coord_brigadas
      const cuentaCoordBrigadas = cuentasRol.find(
        cr => cr.roles_sistema?.codigo === 'coord_brigadas' && cr.activo
      );

      if (!cuentaCoordBrigadas) {
        return res.status(403).json({ 
          error: 'Usuario no es coordinador de brigadas',
          roles_encontrados: cuentasRol.map(cr => cr.roles_sistema?.codigo)
        });
      }

      const { municipio_id, departamento_id } = cuentaCoordBrigadas;

      // 2️⃣ Obtener conglomerados desde conglomerados-service
      let conglomerados = [];
      let zona = '';

      try {
        if (municipio_id) {
          // ✅ Prioridad 1: Conglomerados del municipio específico
          const conglomeradosRes = await axios.get(
            `${process.env.CONGLOMERADOS_SERVICE_URL}/api/conglomerados/municipio/${municipio_id}`,
            { headers: { Authorization: token } }
          );
          conglomerados = conglomeradosRes.data;
          zona = 'municipio';
          
        } else if (departamento_id) {
          // ✅ Prioridad 2: Conglomerados del departamento completo
          const conglomeradosRes = await axios.get(
            `${process.env.CONGLOMERADOS_SERVICE_URL}/api/conglomerados/departamento/${departamento_id}`,
            { headers: { Authorization: token } }
          );
          conglomerados = conglomeradosRes.data;
          zona = 'departamento';
          
        } else {
          return res.status(400).json({ 
            error: 'Coordinador sin municipio ni departamento asignado',
            cuenta_rol: cuentaCoordBrigadas
          });
        }
      } catch (error) {
        console.error('❌ Error consultando conglomerados-service:', error.message);
        
        // Si el endpoint devuelve 404, es porque no hay conglomerados
        if (error.response?.status === 404) {
          return res.json({
            conglomerados: [],
            zona,
            mensaje: 'No hay conglomerados disponibles en esta zona'
          });
        }
        
        return res.status(500).json({ 
          error: 'Error al obtener conglomerados',
          detalles: error.response?.data?.error || error.message
        });
      }

      res.json({
        conglomerados,
        zona,
        total: conglomerados.length,
        municipio_id: municipio_id || null,
        departamento_id: departamento_id || null
      });

    } catch (error) {
      console.error('Error en getConglomeradosDisponibles:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        detalles: error.message 
      });
    }
  }

  // ✅ CORREGIDO: Crear brigada con protección de colisión mejorada
  static async create(req, res) {
    try {
      const { conglomerado_id } = req.body;
      const coord_id = req.user?.id;
      
      if (!coord_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      if (!conglomerado_id) {
        return res.status(400).json({ error: 'conglomerado_id requerido' });
      }

      const token = req.headers.authorization;

      // 1️⃣ Verificar que el conglomerado existe y está aprobado
      let conglomerado;
      try {
        const conglomeradoRes = await axios.get(
          `${process.env.CONGLOMERADOS_SERVICE_URL}/api/conglomerados/${conglomerado_id}`,
          { headers: { Authorization: token } }
        );
        conglomerado = conglomeradoRes.data;
      } catch (error) {
        if (error.response?.status === 404) {
          return res.status(404).json({ error: 'Conglomerado no encontrado' });
        }
        throw error;
      }

      // 2️⃣ Validar estado del conglomerado
      if (conglomerado.estado !== 'aprobado') {
        return res.status(400).json({ 
          error: 'Solo se pueden crear brigadas para conglomerados aprobados',
          estado_actual: conglomerado.estado
        });
      }

      if (conglomerado.tiene_brigada) {
        return res.status(409).json({ 
          error: 'Este conglomerado ya tiene una brigada asignada',
          conglomerado_codigo: conglomerado.codigo
        });
      }

      // 3️⃣ Verificar que el coordinador tiene permiso sobre este conglomerado
      const cuentaRolRes = await axios.get(
        `${process.env.USUARIOS_SERVICE_URL}/api/cuentas-rol/usuario/${coord_id}`,
        { headers: { Authorization: token } }
      );

      const cuentaCoordBrigadas = cuentaRolRes.data.find(
        cr => cr.roles_sistema?.codigo === 'coord_brigadas' && cr.activo
      );

      if (!cuentaCoordBrigadas) {
        return res.status(403).json({ error: 'Usuario no es coordinador de brigadas' });
      }

      // Verificar que el conglomerado está en su zona
      const { municipio_id, departamento_id } = cuentaCoordBrigadas;
      const conglomeradoEnZona = 
        (municipio_id && conglomerado.municipio_id === municipio_id) ||
        (departamento_id && conglomerado.departamento_id === departamento_id);

      if (!conglomeradoEnZona) {
        return res.status(403).json({ 
          error: 'Este conglomerado no está en tu zona asignada',
          tu_zona: municipio_id ? 'municipio' : 'departamento',
          conglomerado_municipio: conglomerado.municipio_id,
          conglomerado_departamento: conglomerado.departamento_id
        });
      }

      // 4️⃣ Crear brigada (UNIQUE constraint protege contra colisiones)
      let brigada;
      try {
        brigada = await BrigadasModel.create({ 
          conglomerado_id,
          creado_por_coord_id: coord_id  // Guardar quién creó la brigada
        });
      } catch (error) {
        // ✅ Error de UNIQUE constraint (23505)
        if (error.code === '23505') {
          return res.status(409).json({ 
            error: 'Este conglomerado ya tiene una brigada asignada',
            mensaje: 'Otro coordinador creó la brigada primero',
            conglomerado_codigo: conglomerado.codigo
          });
        }
        throw error;
      }

      // 5️⃣ Marcar conglomerado como con brigada
      try {
        await axios.put(
          `${process.env.CONGLOMERADOS_SERVICE_URL}/api/conglomerados/${conglomerado_id}/marcar-con-brigada`,
          {},
          { headers: { Authorization: token } }
        );
      } catch (error) {
        console.error('⚠️ Error marcando conglomerado:', error.message);
        // No falla la creación si falla el marcado
      }

      res.status(201).json({
        message: 'Brigada creada exitosamente',
        brigada: {
          ...brigada,
          conglomerado: {
            codigo: conglomerado.codigo,
            municipio_id: conglomerado.municipio_id,
            departamento_id: conglomerado.departamento_id
          }
        }
      });

    } catch (error) {
      console.error('Error en create:', error);

      // Manejar errores de microservicios
      if (error.response) {
        return res.status(error.response.status).json({ 
          error: error.response.data?.error || 'Error en microservicio',
          detalles: error.response.data
        });
      }

      res.status(500).json({ 
        error: 'Error interno al crear brigada',
        detalles: error.message 
      });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const existe = await BrigadasModel.getById(id);
      if (!existe) {
        return res.status(404).json({ error: 'Brigada no encontrada' });
      }

      if (updates.estado) {
        const estadosValidos = ['formacion', 'activa', 'completada', 'cancelada'];
        if (!estadosValidos.includes(updates.estado)) {
          return res.status(400).json({ 
            error: 'Estado inválido',
            estados_validos: estadosValidos
          });
        }
      }
      
      const brigada = await BrigadasModel.update(id, updates);
      res.json(brigada);
    } catch (error) {
      console.error('Error en update:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      const brigada = await BrigadasModel.getById(id);
      
      if (!brigada) {
        return res.status(404).json({ error: 'Brigada no encontrada' });
      }

      // Solo se pueden eliminar brigadas ya canceladas
      if (brigada.estado !== 'cancelada') {
        return res.status(400).json({ 
          error: 'Solo se pueden eliminar brigadas canceladas',
          estado_actual: brigada.estado,
          sugerencia: 'Primero cancela la brigada con POST /:id/cancelar'
        });
      }

      await BrigadasModel.delete(id);
      
      res.json({ 
        message: 'Brigada eliminada permanentemente',
        id: id
      });
    } catch (error) {
      console.error('Error en delete:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getByConglomerado(req, res) {
    try {
      const { conglomerado_id } = req.params;
      const brigada = await BrigadasModel.getByConglomerado(conglomerado_id);
      
      if (!brigada) {
        return res.status(404).json({ 
          message: 'No hay brigada para este conglomerado' 
        });
      }
      
      res.json(brigada);
    } catch (error) {
      console.error('Error en getByConglomerado:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getByEstado(req, res) {
    try {
      const { estado } = req.params;
      
      const estadosValidos = ['formacion', 'activa', 'completada', 'cancelada'];
      if (!estadosValidos.includes(estado)) {
        return res.status(400).json({ 
          error: 'Estado inválido',
          estados_validos: estadosValidos
        });
      }
      
      const brigadas = await BrigadasModel.getByEstado(estado);
      res.json(brigadas);
    } catch (error) {
      console.error('Error en getByEstado:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async cambiarEstado(req, res) {
    try {
      const { id } = req.params;
      const { estado } = req.body;
      
      if (!estado) {
        return res.status(400).json({ error: 'Estado requerido' });
      }

      const estadosValidos = ['formacion', 'activa', 'completada', 'cancelada'];
      if (!estadosValidos.includes(estado)) {
        return res.status(400).json({ 
          error: 'Estado inválido',
          estados_validos: estadosValidos
        });
      }
      
      const existe = await BrigadasModel.getById(id);
      if (!existe) {
        return res.status(404).json({ error: 'Brigada no encontrada' });
      }
      
      const brigada = await BrigadasModel.cambiarEstado(id, estado);
      res.json(brigada);
    } catch (error) {
      console.error('Error en cambiarEstado:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // ✅ MEJORADO: Obtener brigadistas cercanos a un conglomerado
  static async getBrigadistasCercanos(req, res) {
    try {
      const { conglomerado_id, radio_km = 100 } = req.query;

      if (!conglomerado_id) {
        return res.status(400).json({ error: 'conglomerado_id requerido' });
      }

      const token = req.headers.authorization;

      // 1️⃣ Obtener conglomerado con ubicación
      let conglomerado;
      try {
        const conglomeradoRes = await axios.get(
          `${process.env.CONGLOMERADOS_SERVICE_URL}/api/conglomerados/${conglomerado_id}`,
          { headers: { Authorization: token } }
        );
        conglomerado = conglomeradoRes.data;
      } catch (error) {
        return res.status(404).json({ error: 'Conglomerado no encontrado' });
      }

      if (!conglomerado.departamento_id) {
        return res.status(400).json({ 
          error: 'Conglomerado sin ubicación asignada',
          estado: conglomerado.estado
        });
      }

      // 2️⃣ Obtener brigadistas del mismo departamento
      const brigadistas = await BrigadistasModel.getByDepartamento(
        conglomerado.departamento_id
      );

      // 3️⃣ TODO: Calcular distancias reales con haversine
      // Por ahora retornar todos del departamento
      const brigadistasOrdenados = brigadistas.map(b => ({
        ...b,
        distancia_km: null,  // TODO: Implementar cálculo
        mismo_municipio: b.municipio_id === conglomerado.municipio_id
      }));

      res.json({
        conglomerado_id,
        conglomerado_municipio: conglomerado.municipio_id,
        brigadistas: brigadistasOrdenados,
        total: brigadistasOrdenados.length,
        nota: 'Distancia real pendiente de implementar (haversine)'
      });

    } catch (error) {
      console.error('Error en getBrigadistasCercanos:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default BrigadasController;