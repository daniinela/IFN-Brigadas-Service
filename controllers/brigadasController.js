// controllers/brigadasController.js
import BrigadasModel from '../models/brigadasModel.js';
import supabase from '../config/database.js';

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
      const brigada = await BrigadasModel.getById(req.params.id);
      
      if (!brigada) {
        return res.status(404).json({ error: 'Brigada no encontrada' });
      }
      
      res.json(brigada);
    } catch (error) {
      console.error('Error en getById:', error);
      res.status(500).json({ error: error.message });
    }
  }


static async create(req, res) {
  try {
    const { conglomerado_id } = req.body;
    
    if (!conglomerado_id) {
      return res.status(400).json({ error: 'conglomerado_id es requerido' });
    }

    // Validar UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(conglomerado_id)) {
      return res.status(400).json({ error: 'conglomerado_id inválido' });
    }

    // Verificar que el conglomerado existe (llamada HTTP)
    try {
      await axios.get(`http://localhost:3003/api/conglomerados/${conglomerado_id}`);
    } catch (error) {
      if (error.response?.status === 404) {
        return res.status(400).json({ error: 'Conglomerado no existe' });
      }
    }

    // Verificar que no exista ya brigada
    const existente = await BrigadasModel.getByConglomerado(conglomerado_id);
    if (existente) {
      return res.status(409).json({ 
        error: 'Ya existe una brigada para este conglomerado' 
      });
    }

    const nuevaBrigada = await BrigadasModel.create({ conglomerado_id });
    res.status(201).json(nuevaBrigada);
  } catch (error) {
    console.error('Error en create:', error);
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

      // Validar estado si viene en updates
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
      
      const existe = await BrigadasModel.getById(id);
      if (!existe) {
        return res.status(404).json({ error: 'Brigada no encontrada' });
      }
      
      await BrigadasModel.delete(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error en delete:', error);
      res.status(500).json({ error: error.message });
    }
  }

static async getByConglomerado(req, res) {
  try {
    const brigada = await BrigadasModel.getByConglomerado(req.params.conglomerado_id);
    
    // ✅ Si no hay brigada, devolver null (no es un error)
    res.json(brigada || null);
    
  } catch (error) {
    console.error('Error en getByConglomerado:', error);
    res.status(500).json({ error: error.message });
  }
}
  static async getByEstado(req, res) {
    try {
      const brigadas = await BrigadasModel.getByEstado(req.params.estado);
      res.json(brigadas);
    } catch (error) {
      console.error('Error en getByEstado:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getConBrigadistas(req, res) {
    try {
      const brigada = await BrigadasModel.getConBrigadistas(req.params.id);
      
      if (!brigada) {
        return res.status(404).json({ error: 'Brigada no encontrada' });
      }
      
      res.json(brigada);
    } catch (error) {
      console.error('Error en getConBrigadistas:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async cambiarEstado(req, res) {
    try {
      const { id } = req.params;
      const { estado } = req.body;
      
      if (!estado) {
        return res.status(400).json({ error: 'estado es requerido' });
      }

      const brigada = await BrigadasModel.cambiarEstado(id, estado);
      res.json(brigada);
    } catch (error) {
      console.error('Error en cambiarEstado:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default BrigadasController;