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

  // 🆕 NUEVO: Obtener conglomerados disponibles para coordinador de brigadas
  static async getConglomeradosDisponibles(req, res) {
    try {
      const coord_id = req.user?.id;

      if (!coord_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      // Obtener cuenta_rol del coordinador (desde microservicio usuarios)
      const token = req.headers.authorization;
      const cuentaRolRes = await axios.get(
        `${process.env.USUARIOS_SERVICE_URL}/api/cuentas-rol/usuario/${coord_id}`,
        { headers: { Authorization: token } }
      );

      const cuentasRol = cuentaRolRes.data;
      const cuentaCoordBrigadas = cuentasRol.find(
        cr => cr.roles_sistema.codigo === 'coord_brigadas' && cr.activo
      );

      if (!cuentaCoordBrigadas) {
        return res.status(403).json({ 
          error: 'Usuario no es coordinador de brigadas' 
        });
      }

      const { municipio_id, departamento_id } = cuentaCoordBrigadas;

      // Obtener conglomerados del microservicio de conglomerados
      let conglomeradosRes;

      if (municipio_id) {
        // Prioridad 1: Conglomerados del municipio específico
        conglomeradosRes = await axios.get(
          `${process.env.CONGLOMERADOS_SERVICE_URL}/api/conglomerados/municipio/${municipio_id}`,
          { headers: { Authorization: token } }
        );
      } else if (departamento_id) {
        // Prioridad 2: Conglomerados del departamento completo
        conglomeradosRes = await axios.get(
          `${process.env.CONGLOMERADOS_SERVICE_URL}/api/conglomerados/departamento/${departamento_id}`,
          { headers: { Authorization: token } }
        );
      } else {
        return res.status(400).json({ 
          error: 'Coordinador sin municipio ni departamento asignado' 
        });
      }

      res.json({
        conglomerados: conglomeradosRes.data,
        zona: municipio_id ? 'municipio' : 'departamento'
      });
    } catch (error) {
      console.error('Error en getConglomeradosDisponibles:', error);
      
      if (error.response) {
        return res.status(error.response.status).json({ 
          error: error.response.data.error || 'Error en microservicio'
        });
      }
      
      res.status(500).json({ error: error.message });
    }
  }

  // ✅ MODIFICADO: Crear brigada con protección de colisión
  static async create(req, res) {
    try {
      const { conglomerado_id } = req.body;
      
      if (!conglomerado_id) {
        return res.status(400).json({ error: 'conglomerado_id requerido' });
      }

      // Verificar que el conglomerado esté aprobado
      const token = req.headers.authorization;
      const conglomeradoRes = await axios.get(
        `${process.env.CONGLOMERADOS_SERVICE_URL}/api/conglomerados/${conglomerado_id}`,
        { headers: { Authorization: token } }
      );

      const conglomerado = conglomeradoRes.data;

      if (conglomerado.estado !== 'aprobado') {
        return res.status(400).json({ 
          error: 'Solo se pueden crear brigadas para conglomerados aprobados',
          estado_actual: conglomerado.estado
        });
      }

      if (conglomerado.tiene_brigada) {
        return res.status(409).json({ 
          error: 'Este conglomerado ya tiene una brigada asignada'
        });
      }

      // Crear brigada (constraint UNIQUE protege contra colisión)
      const brigada = await BrigadasModel.create({ conglomerado_id });

      // Marcar conglomerado como con brigada
      await axios.put(
        `${process.env.CONGLOMERADOS_SERVICE_URL}/api/conglomerados/${conglomerado_id}/marcar-con-brigada`,
        {},
        { headers: { Authorization: token } }
      );

      res.status(201).json(brigada);
    } catch (error) {
      console.error('Error en create:', error);

      // Error de UNIQUE constraint (23505)
      if (error.code === '23505') {
        return res.status(409).json({ 
          error: 'Este conglomerado ya tiene una brigada asignada',
          message: 'Otro coordinador creó la brigada primero'
        });
      }

      if (error.response) {
        return res.status(error.response.status).json({ 
          error: error.response.data.error || 'Error en microservicio'
        });
      }

      res.status(500).json({ error: error.message });
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
          return res.status(400).json({ error: 'Estado inválido' });
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

      // Solo se pueden eliminar brigadas en formación o canceladas
      if (!['formacion', 'cancelada'].includes(brigada.estado)) {
        return res.status(400).json({ 
          error: 'Solo se pueden eliminar brigadas en formación o canceladas',
          estado_actual: brigada.estado
        });
      }
      
      await BrigadasModel.delete(id);
      
      res.json({ 
        message: 'Brigada eliminada exitosamente',
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
        return res.status(400).json({ error: 'Estado inválido' });
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

  // 🆕 NUEVO: Obtener brigadistas cercanos a un conglomerado
  static async getBrigadistasCercanos(req, res) {
    try {
      const { conglomerado_id, radio_km = 100 } = req.query;

      if (!conglomerado_id) {
        return res.status(400).json({ error: 'conglomerado_id requerido' });
      }

      // Obtener conglomerado
      const token = req.headers.authorization;
      const conglomeradoRes = await axios.get(
        `${process.env.CONGLOMERADOS_SERVICE_URL}/api/conglomerados/${conglomerado_id}`,
        { headers: { Authorization: token } }
      );

      const conglomerado = conglomeradoRes.data;

      // Obtener brigadistas del mismo departamento
      const brigadistas = await BrigadistasModel.getByDepartamento(
        conglomerado.departamento_id
      );

      // Calcular distancias (usando municipios como referencia)
      // TODO: Implementar cálculo real de distancia con haversine

      res.json({
        conglomerado_id,
        brigadistas,
        nota: 'Distancia calculada entre municipios (implementar haversine)'
      });
    } catch (error) {
      console.error('Error en getBrigadistasCercanos:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default BrigadasController;