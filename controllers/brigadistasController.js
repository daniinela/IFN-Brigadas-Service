// controllers/brigadistasController.js
import BrigadistasModel from '../models/brigadistasModel.js';
import supabase from '../config/database.js';

//AGREGAR LAS FUNCIONES QUE FALTAN
const getAll = async (req, res) => {
  try {
    const brigadistas = await BrigadistasModel.getAll();
    res.json(brigadistas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const brigadista = await BrigadistasModel.getById(req.params.id);
    res.json(brigadista);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const create = async (req, res) => {
  try {
    const nuevoBrigadista = await BrigadistasModel.create(req.body);
    res.status(201).json(nuevoBrigadista);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const brigadista = await BrigadistasModel.update(req.params.id, req.body);
    res.json(brigadista);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteBrigadista = async (req, res) => {
  try {
    await BrigadistasModel.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Función para crear brigadista desde frontend
const createBrigadista = async (req, res) => {
  try {
    const { user_id, nombre_completo, municipio, titulos, experiencia_laboral, rol } = req.body;
    
    // Verificar que el usuario exista en el microservicio de usuarios
    const {  usuario, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', user_id)
      .single();
    
    if (userError || !usuario) {
      return res.status(400).json({ error: 'Usuario no encontrado en el sistema de usuarios' });
    }
    
    const nuevoBrigadista = await BrigadistasModel.create({
      user_id,
      nombre_completo,
      municipio,
      titulos: titulos || [],
      experiencia_laboral: experiencia_laboral || [],
      rol: rol || 'brigadista'
    });
    
    res.status(201).json(nuevoBrigadista);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// EXPORTAR TODO CORRECTAMENTE
export default {
  getAll,
  getById,
  create,
  update,
  delete: deleteBrigadista,
  createBrigadista
};