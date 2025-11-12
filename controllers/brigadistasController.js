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
    const { user_id, municipio_id, titulos, experiencia_laboral } = req.body;
    
    if (!user_id || !municipio_id) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    const existente = await BrigadistasModel.getByUserId(user_id);
    if (existente) {
      return res.status(409).json({ error: 'Usuario ya tiene perfil de brigadista' });
    }

    const nuevoBrigadista = await BrigadistasModel.create({
      user_id,
      municipio_id,
      titulos: titulos || [],
      experiencia_laboral: experiencia_laboral || []
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
// ===== SALA DE ESPERA =====

static async getPendientes(req, res) {
  try {
    const brigadistas = await BrigadistasModel.getPendientes();
    res.json(brigadistas);
  } catch (error) {
    console.error('Error en getPendientes:', error);
    res.status(500).json({ error: error.message });
  }
}

static async aprobar(req, res) {
  try {
    const { id } = req.params;
    const { roles } = req.body;
    const coord_id = req.user?.id;
    
    if (!coord_id) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!Array.isArray(roles) || roles.length === 0) {
      return res.status(400).json({ error: 'Debe asignar al menos un rol' });
    }

    const brigadista = await BrigadistasModel.getById(id);
    if (!brigadista) {
      return res.status(404).json({ error: 'Brigadista no encontrado' });
    }

    if (brigadista.estado_solicitud !== 'pendiente_revision') {
      return res.status(400).json({ 
        error: 'Solo se pueden aprobar solicitudes pendientes'
      });
    }

    // 1. Aprobar
    await BrigadistasModel.aprobar(id, coord_id);

    // 2. Asignar roles
    await BrigadistasSubrolModel.asignar(id, roles, coord_id);

    // 3. Obtener con roles
    const brigadistaActualizado = await BrigadistasModel.getConRoles(id);

    res.json({
      message: 'Brigadista aprobado',
      brigadista: brigadistaActualizado
    });

  } catch (error) {
    console.error('Error en aprobar:', error);
    res.status(500).json({ error: error.message });
  }
}

static async rechazar(req, res) {
  try {
    const { id } = req.params;
    
    const brigadista = await BrigadistasModel.getById(id);
    if (!brigadista) {
      return res.status(404).json({ error: 'Brigadista no encontrado' });
    }

    if (brigadista.estado_solicitud !== 'pendiente_revision') {
      return res.status(400).json({ 
        error: 'Solo se pueden rechazar solicitudes pendientes'
      });
    }

    await BrigadistasModel.rechazar(id);

    res.json({ message: 'Solicitud rechazada' });

  } catch (error) {
    console.error('Error en rechazar:', error);
    res.status(500).json({ error: error.message });
  }
}

static async getConRoles(req, res) {
  try {
    const brigadista = await BrigadistasModel.getConRoles(req.params.id);
    
    if (!brigadista) {
      return res.status(404).json({ error: 'Brigadista no encontrado' });
    }
    
    res.json(brigadista);
  } catch (error) {
    console.error('Error en getConRoles:', error);
    res.status(500).json({ error: error.message });
  }
}
}

export default BrigadistasController;