// brigadas-service/controllers/brigadasExpedicionController.js
import BrigadasExpedicionModel from '../models/brigadasExpedicionModel.js';
import BrigadasRolOperativoModel from '../models/brigadasRolOperativoModel.js';
import axios from 'axios';

class BrigadasExpedicionController {
  
  static async getAll(req, res) {
    try {
      const brigadas = await BrigadasExpedicionModel.getAll();
      res.json(brigadas);
    } catch (error) {
      console.error('Error en getAll:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const brigada = await BrigadasExpedicionModel.getById(req.params.id);
      if (!brigada) {
        return res.status(404).json({ error: 'Brigada no encontrada' });
      }
      res.json(brigada);
    } catch (error) {
      console.error('Error en getById:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // COORD_IFN crea la brigada inicial
  static async create(req, res) {
    const token = req.headers.authorization;
    try {
      const { conglomerado_id, jefe_brigada_id } = req.body;
      const coord_id = req.user?.id;

      if (!coord_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      if (!conglomerado_id || !jefe_brigada_id) {
        return res.status(400).json({ 
          error: 'conglomerado_id y jefe_brigada_id son requeridos' 
        });
      }

      const token = req.headers.authorization;

      // Validar que el conglomerado existe y está en estado correcto
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

      if (conglomerado.estado !== 'asignado_a_jefe') {
        return res.status(400).json({ 
          error: 'El conglomerado debe estar en estado asignado_a_jefe',
          estado_actual: conglomerado.estado
        });
      }

      // Validar que el jefe_brigada_id coincide con el del conglomerado
      if (conglomerado.jefe_brigada_asignado_id !== jefe_brigada_id) {
        return res.status(400).json({ 
          error: 'El jefe_brigada_id no coincide con el asignado al conglomerado' 
        });
      }

      // Verificar que no exista ya una brigada para ese conglomerado
      const brigadaExistente = await BrigadasExpedicionModel.getByConglomerado(conglomerado_id);
      if (brigadaExistente) {
        return res.status(409).json({ 
          error: 'Ya existe una brigada para este conglomerado' 
        });
      }

      const nuevaBrigada = await BrigadasExpedicionModel.create({
        conglomerado_id,
        jefe_brigada_id,
        diligenciado_por: req.body.diligenciado_por_id || jefe_brigada_id
      });

      res.status(201).json({
        message: 'Brigada creada exitosamente',
        brigada: nuevaBrigada
      });
    } catch (error) {
      console.error('Error en create:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // JEFE_BRIGADA obtiene sus brigadas asignadas
  static async getMisBrigadas(req, res) {
    try {
      const jefe_brigada_id = req.user?.id;

      if (!jefe_brigada_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const brigadas = await BrigadasExpedicionModel.getByJefeBrigada(jefe_brigada_id);
      res.json(brigadas);
    } catch (error) {
      console.error('Error en getMisBrigadas:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // JEFE_BRIGADA cambia el estado
  static async cambiarEstado(req, res) {
 const brigadaActualizada = await BrigadasExpedicionModel.cambiarEstado(id, estado);}

  // JEFE_BRIGADA registra fechas
  static async registrarFechas(req, res) {
    try {
      const { id } = req.params;
      const { fecha_inicio_campo, fecha_fin_campo } = req.body;
      const jefe_brigada_id = req.user?.id;

      if (!jefe_brigada_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      if (!fecha_inicio_campo || !fecha_fin_campo) {
        return res.status(400).json({ 
          error: 'fecha_inicio_campo y fecha_fin_campo son requeridas' 
        });
      }

      const brigada = await BrigadasExpedicionModel.getById(id);
      if (!brigada) {
        return res.status(404).json({ error: 'Brigada no encontrada' });
      }

      if (brigada.jefe_brigada_id !== jefe_brigada_id) {
        return res.status(403).json({ 
          error: 'No tienes permisos para modificar esta brigada' 
        });
      }

      const brigadaActualizada = await BrigadasExpedicionModel.registrarFechas(
        id,
        fecha_inicio_campo,
        fecha_fin_campo
      );

      res.json({
        message: 'Fechas registradas',
        brigada: brigadaActualizada
      });
    } catch (error) {
      console.error('Error en registrarFechas:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getByEstado(req, res) {
    try {
      const { estado } = req.params;
      const brigadas = await BrigadasExpedicionModel.getByEstado(estado);
      res.json(brigadas);
    } catch (error) {
      console.error('Error en getByEstado:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default BrigadasExpedicionController;