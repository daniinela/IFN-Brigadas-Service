// controllers/subRolController.js
import SubRolModel from '../models/subRolModel.js';

class SubRolController {
  
  static async getAll(req, res) {
    try {
      const subroles = await SubRolModel.getAll();
      res.json(subroles);
    } catch (error) {
      console.error('Error en getAll:', error);
      res.status(500).json({ error: error.message });
    }
  }
  static async getById(req, res) {
    try {
      const subrol = await SubRolModel.getById(req.params.id);
      
      if (!subrol) {
        return res.status(404).json({ error: 'Subrol no encontrado' });
      }
      res.json(subrol);
    } catch (error) {
      console.error('Error en getById:', error);
      res.status(500).json({ error: error.message });
    }
  }
  static async getByCodigo(req, res) {
    try {
      const subrol = await SubRolModel.getByCodigo(req.params.codigo);
      
      if (!subrol) {
        return res.status(404).json({ error: 'Subrol no encontrado' });
      }
      res.json(subrol);
    } catch (error) {console.error('Error en getByCodigo:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default SubRolController;