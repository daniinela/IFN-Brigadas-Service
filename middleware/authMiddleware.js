//esto de aca es par verificar los tokens, la cosa es q 
//yo no la hago manual con la libreria jwt sino q utilizo supabase para esto
//ya q en supabase me autentica los usuarios y eso entonces me genera esos tokens alla
//entonces aca solo uso a supabase pa eso

// brigadas-service/middleware/authMiddleware.js
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabase = createClient(
  process.env.SUPABASE_AUTH_URL,
  process.env.SUPABASE_AUTH_ANON_KEY
);

console.log('🔍 Verificando Supabase config (brigadas-service):');
console.log('AUTH URL:', process.env.SUPABASE_AUTH_URL ? '✅' : '❌');
console.log('AUTH ANON Key:', process.env.SUPABASE_AUTH_ANON_KEY ? '✅' : '❌');

export async function verificarToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    console.log('🔐 Auth Header recibido:', authHeader ? 'Presente' : 'Ausente');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Token no proporcionado o formato incorrecto');
      return res.status(401).json({ 
        error: 'Token no proporcionado',
        details: 'Se requiere header Authorization con Bearer token'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('🔍 Verificando token con Supabase...');
    
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error) {
      console.log('❌ Error de Supabase:', error.message);
      return res.status(401).json({ 
        error: 'Token inválido',
        details: error.message 
      });
    }

    if (!user) {
      console.log('❌ Usuario no encontrado');
      return res.status(401).json({ error: 'Token inválido' });
    }

    console.log('✅ Token válido para usuario:', user.id);
    
    req.user = user;
    req.userId = user.id;
    next();
  } catch (error) {
    console.error('💥 Error verificando token:', error);
    return res.status(401).json({ 
      error: 'Error de autenticación',
      details: error.message 
    });
  }
}

export async function verificarCoordIFN(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    console.log('🔍 Verificando rol COORD_IFN para usuario:', userId);

    const token = req.headers.authorization;
    
    try {
      const rolesRes = await axios.get(
        `${process.env.USUARIOS_SERVICE_URL}/api/cuentas-rol/usuario/${userId}`,
        { headers: { Authorization: token } }
      );

      console.log('📋 Roles encontrados:', rolesRes.data);

      const tieneRol = rolesRes.data.some(
        cr => cr.roles_sistema?.codigo === 'COORD_IFN' && cr.activo
      );

      if (!tieneRol) {
        console.log('❌ Usuario no tiene rol COORD_IFN');
        return res.status(403).json({ 
          error: 'Se requiere rol COORD_IFN',
          roles_disponibles: rolesRes.data.map(r => r.roles_sistema?.codigo)
        });
      }

      console.log('✅ Usuario tiene rol COORD_IFN');
      next();
    } catch (axiosError) {
      console.error('💥 Error consultando roles:', axiosError.message);
      
      if (axiosError.response?.status === 404) {
        return res.status(403).json({ 
          error: 'Usuario sin roles asignados' 
        });
      }
      
      throw axiosError;
    }
  } catch (error) {
    console.error('💥 Error verificando COORD_IFN:', error);
    res.status(500).json({ 
      error: 'Error verificando permisos',
      details: error.message 
    });
  }
}

export async function verificarJefeBrigada(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    console.log('🔍 Verificando rol JEFE_BRIGADA para usuario:', userId);

    const token = req.headers.authorization;
    
    try {
      const rolesRes = await axios.get(
        `${process.env.USUARIOS_SERVICE_URL}/api/cuentas-rol/usuario/${userId}`,
        { headers: { Authorization: token } }
      );

      console.log('📋 Roles encontrados:', rolesRes.data);

      const tieneRol = rolesRes.data.some(
        cr => cr.roles_sistema?.codigo === 'JEFE_BRIGADA' && cr.activo
      );

      if (!tieneRol) {
        console.log('❌ Usuario no tiene rol JEFE_BRIGADA');
        return res.status(403).json({ 
          error: 'Se requiere rol JEFE_BRIGADA',
          roles_disponibles: rolesRes.data.map(r => r.roles_sistema?.codigo)
        });
      }

      console.log('✅ Usuario tiene rol JEFE_BRIGADA');
      next();
    } catch (axiosError) {
      console.error('💥 Error consultando roles:', axiosError.message);
      
      if (axiosError.response?.status === 404) {
        return res.status(403).json({ 
          error: 'Usuario sin roles asignados' 
        });
      }
      
      throw axiosError;
    }
  } catch (error) {
    console.error('💥 Error verificando JEFE_BRIGADA:', error);
    res.status(500).json({ 
      error: 'Error verificando permisos',
      details: error.message 
    });
  }
}

export async function verificarBrigadista(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    console.log('🔍 Verificando roles de brigadista para usuario:', userId);

    const token = req.headers.authorization;
    
    try {
      const rolesRes = await axios.get(
        `${process.env.USUARIOS_SERVICE_URL}/api/cuentas-rol/usuario/${userId}`,
        { headers: { Authorization: token } }
      );

      console.log('📋 Roles encontrados:', rolesRes.data);

      const ROLES_BRIGADISTA = ['BOTANICO', 'TECNICO_AUX', 'COINVESTIGADOR'];
      
      const esBrigadista = rolesRes.data.some(
        cr => ROLES_BRIGADISTA.includes(cr.roles_sistema?.codigo) && cr.activo
      );

      if (!esBrigadista) {
        console.log('❌ Usuario no es brigadista');
        return res.status(403).json({ 
          error: 'Se requiere rol de Brigadista (Botánico, Técnico Auxiliar o Coinvestigador)',
          roles_disponibles: rolesRes.data.map(r => r.roles_sistema?.codigo)
        });
      }

      console.log('✅ Usuario es brigadista');
      next();
    } catch (axiosError) {
      console.error('💥 Error consultando roles:', axiosError.message);
      
      if (axiosError.response?.status === 404) {
        return res.status(403).json({ 
          error: 'Usuario sin roles asignados' 
        });
      }
      
      throw axiosError;
    }
  } catch (error) {
    console.error('💥 Error verificando brigadista:', error);
    res.status(500).json({ 
      error: 'Error verificando permisos',
      details: error.message 
    });
  }
}