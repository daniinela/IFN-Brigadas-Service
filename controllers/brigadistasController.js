// controllers/brigadistasController.js
import BrigadistasModel from '../models/brigadistasModel.js';
import supabase from '../config/database.js';

class BrigadistasController {
  
  static async getAll(req, res) {
    try {
      const brigadistas = await BrigadistasModel.getAll();
      res.json(brigadistas);
    } catch (error) {
      console.error('Error en getAll:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const brigadista = await BrigadistasModel.getById(req.params.id);
      
      if (!brigadista) {
        return res.status(404).json({ error: 'Brigadista no encontrado' });
      }
      
      res.json(brigadista);
    } catch (error) {
      console.error('Error en getById:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getByUserId(req, res) {
    try {
      const brigadista = await BrigadistasModel.getByUserId(req.params.user_id);
      
      if (!brigadista) {
        return res.status(404).json({ error: 'Brigadista no encontrado' });
      }
      
      res.json(brigadista);
    } catch (error) {
      console.error('Error en getByUserId:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async create(req, res) {
    try {
      const { user_id, municipio, titulos, experiencia_laboral, rol } = req.body;
      
      if (!user_id || !municipio || !rol) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
      }

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(user_id)) {
        return res.status(400).json({ error: 'ID de usuario inválido' });
      }

      const rolesValidos = ['jefe', 'botanico', 'tecnico', 'coinvestigador'];
      if (!rolesValidos.includes(rol)) {
        return res.status(400).json({ error: 'Rol inválido' });
      }

      const existente = await BrigadistasModel.getByUserId(user_id);
      if (existente) {
        return res.status(409).json({ error: 'Usuario ya tiene perfil de brigadista' });
      }

      const nuevoBrigadista = await BrigadistasModel.create({
        user_id,
        municipio,
        titulos: titulos || [],
        experiencia_laboral: experiencia_laboral || [],
        rol
      });
      
      res.status(201).json(nuevoBrigadista);
    } catch (error) {
      console.error('Error en create:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const existe = await BrigadistasModel.getById(id);
      if (!existe) {
        return res.status(404).json({ error: 'Brigadista no encontrado' });
      }

      if (updates.rol) {
        const rolesValidos = ['jefe', 'botanico', 'tecnico', 'coinvestigador'];
        if (!rolesValidos.includes(updates.rol)) {
          return res.status(400).json({ error: 'Rol inválido' });
        }
      }
      
      const brigadista = await BrigadistasModel.update(id, updates);
      res.json(brigadista);
    } catch (error) {
      console.error('Error en update:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      const brigadista = await BrigadistasModel.getById(id);
      if (!brigadista) {
        return res.status(404).json({ error: 'Brigadista no encontrado' });
      }
      
      const tieneAsignacionActiva = await BrigadistasModel.tieneAsignacionActiva(id);
      if (tieneAsignacionActiva) {
        return res.status(409).json({ 
          error: 'No se puede eliminar: brigadista asignado a brigada activa' 
        });
      }

      await BrigadistasModel.delete(id);
      res.json({ 
        message: 'Brigadista eliminado exitosamente',
        id: id
      });
    } catch (error) {
      console.error('Error en delete:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getByMunicipio(req, res) {
    try {
      const brigadistas = await BrigadistasModel.getByMunicipio(req.params.municipio);
      res.json(brigadistas);
    } catch (error) {
      console.error('Error en getByMunicipio:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getByRol(req, res) {
    try {
      const brigadistas = await BrigadistasModel.getByRol(req.params.rol);
      res.json(brigadistas);
    } catch (error) {
      console.error('Error en getByRol:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async verificarTitulos(req, res) {
    try {
      const { id } = req.params;
      const { titulos } = req.body;
      
      if (!Array.isArray(titulos)) {
        return res.status(400).json({ error: 'Formato inválido' });
      }

      const brigadista = await BrigadistasModel.verificarTitulos(id, titulos);
      res.json(brigadista);
    } catch (error) {
      console.error('Error en verificarTitulos:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async actualizarDisponibilidad(req, res) {
    try {
      const { id } = req.params;
      const { disponibilidad } = req.body;
      
      if (!Array.isArray(disponibilidad)) {
        return res.status(400).json({ error: 'disponibilidad debe ser un array' });
      }

      const brigadista = await BrigadistasModel.actualizarDisponibilidad(id, disponibilidad);
      res.json(brigadista);
    } catch (error) {
      console.error('Error en actualizarDisponibilidad:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getDisponibles(req, res) {
    try {
      const { municipio } = req.query;
      
      if (!municipio) {
        return res.status(400).json({ error: 'municipio es requerido' });
      }
      
      const brigadistas = await BrigadistasModel.getDisponiblesPorMunicipio(municipio);
      res.json(brigadistas);
    } catch (error) {
      console.error('Error en getDisponibles:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getConDetalles(req, res) {
    try {
      const brigadista = await BrigadistasModel.getConDetalles(req.params.id);
      
      if (!brigadista) {
        return res.status(404).json({ error: 'Brigadista no encontrado' });
      }
      
      res.json(brigadista);
    } catch (error) {
      console.error('Error en getConDetalles:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default BrigadistasController;