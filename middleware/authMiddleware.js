//esto de aca es par verificar los tokens, la cosa es q 
//yo no la hago manual con la libreria jwt sino q utilizo supabase para esto
//ya q en supabase me autentica los usuarios y eso entonces me genera esos tokens alla
//entonces aca solo uso a supabase pa eso

// brigadas-service/middleware/authMiddleware.js
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabaseUrl = process.env.SUPABASE_AUTH_URL;
const supabaseKey = process.env.SUPABASE_AUTH_KEY;
const USUARIOS_SERVICE_URL = process.env.USUARIOS_SERVICE_URL || 'http://localhost:3000';

console.log('🔍 Verificando Supabase AUTH config (brigadas-service):');
console.log('URL:', supabaseUrl ? '✅' : '❌');
console.log('Key:', supabaseKey ? '✅' : '❌');
console.log('Usuarios Service:', USUARIOS_SERVICE_URL);

const supabase = createClient(supabaseUrl, supabaseKey);

// ✅ 1. VERIFICAR TOKEN
export async function verificarToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'No autorizado: Token no proporcionado'
      });
    }

    const token = authHeader.replace('Bearer ', '');

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error) {
      console.error('❌ Error validando token:', error.message);
      return res.status(401).json({
        error: 'Token inválido o expirado'
      });
    }

    if (!user) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    // ✅ Adjuntar usuario al request
    req.user = user;
    req.userId = user.id;
    req.userEmail = user.email;

    next();
  } catch (error) {
    console.error('❌ Error verificando token:', error);
    return res.status(401).json({ error: 'Error al verificar autenticación' });
  }
}

// ✅ 2. VERIFICAR ADMIN (Coord Brigadas o Super Admin)
export async function verificarAdmin(req, res, next) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const token = req.headers.authorization;

    // 🔥 Llamar a usuarios-service para verificar roles
    let cuentasRolRes;
    try {
      cuentasRolRes = await axios.get(
        `${USUARIOS_SERVICE_URL}/api/usuarios/cuentas-rol/usuario/${userId}`,
        { headers: { Authorization: token } }
      );
    } catch (error) {
      console.error('❌ Error consultando usuarios-service:', error.message);
      
      if (error.response?.status === 404) {
        return res.status(403).json({ 
          error: 'Usuario sin roles asignados' 
        });
      }
      
      return res.status(500).json({ 
        error: 'Error al verificar permisos',
        detalles: error.message 
      });
    }

    const cuentasRol = cuentasRolRes.data;

    // Buscar cuenta activa con rol admin
    const esAdmin = cuentasRol.some(
      cuenta => 
        cuenta.activo && 
        (cuenta.roles_sistema?.codigo === 'super_admin' || 
         cuenta.roles_sistema?.codigo === 'coord_brigadas')
    );

    if (!esAdmin) {
      return res.status(403).json({
        error: 'Se requiere rol de coordinador o super admin',
        roles_actuales: cuentasRol
          .filter(c => c.activo)
          .map(c => c.roles_sistema?.codigo)
      });
    }

    // ✅ Adjuntar roles al request
    req.userRoles = cuentasRol
      .filter(c => c.activo)
      .map(c => ({
        codigo: c.roles_sistema?.codigo,
        nombre: c.roles_sistema?.nombre,
        departamento_id: c.departamento_id,
        municipio_id: c.municipio_id
      }));

    next();
  } catch (error) {
    console.error('❌ Error en verificarAdmin:', error);
    res.status(500).json({ 
      error: 'Error al verificar permisos',
      detalles: error.message 
    });
  }
}

// ✅ 3. VERIFICAR BRIGADISTA
export async function verificarBrigadista(req, res, next) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const token = req.headers.authorization;

    let cuentasRolRes;
    try {
      cuentasRolRes = await axios.get(
        `${USUARIOS_SERVICE_URL}/api/usuarios/cuentas-rol/usuario/${userId}`,
        { headers: { Authorization: token } }
      );
    } catch (error) {
      if (error.response?.status === 404) {
        return res.status(403).json({ 
          error: 'Usuario sin roles asignados' 
        });
      }
      
      return res.status(500).json({ 
        error: 'Error al verificar permisos',
        detalles: error.message 
      });
    }

    const cuentasRol = cuentasRolRes.data;

    const esBrigadista = cuentasRol.some(
      cuenta => 
        cuenta.activo && 
        (cuenta.roles_sistema?.codigo === 'brigadista' ||
         cuenta.roles_sistema?.codigo === 'coord_brigadas' ||
         cuenta.roles_sistema?.codigo === 'super_admin')
    );

    if (!esBrigadista) {
      return res.status(403).json({
        error: 'Se requiere rol de brigadista o superior',
        roles_actuales: cuentasRol
          .filter(c => c.activo)
          .map(c => c.roles_sistema?.codigo)
      });
    }

    req.userRoles = cuentasRol
      .filter(c => c.activo)
      .map(c => c.roles_sistema?.codigo);

    next();
  } catch (error) {
    console.error('❌ Error en verificarBrigadista:', error);
    res.status(500).json({ 
      error: 'Error al verificar permisos',
      detalles: error.message 
    });
  }
}

// ✅ 4. VERIFICAR PRIVILEGIO ESPECÍFICO
export function verificarPrivilegio(codigoPrivilegio) {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const token = req.headers.authorization;

      // 🔥 Llamar a usuarios-service para verificar privilegios
      let privilegiosRes;
      try {
        privilegiosRes = await axios.get(
          `${USUARIOS_SERVICE_URL}/api/usuarios/${userId}/privilegios`,
          { headers: { Authorization: token } }
        );
      } catch (error) {
        console.error('❌ Error obteniendo privilegios:', error.message);
        
        if (error.response?.status === 404) {
          return res.status(403).json({ 
            error: 'Usuario sin privilegios asignados' 
          });
        }
        
        return res.status(500).json({ 
          error: 'Error al verificar privilegios',
          detalles: error.message 
        });
      }

      const privilegios = privilegiosRes.data;

      const tienePrivilegio = privilegios.some(
        p => p.codigo === codigoPrivilegio
      );

      if (!tienePrivilegio) {
        return res.status(403).json({
          error: `Se requiere el privilegio: ${codigoPrivilegio}`,
          privilegios_actuales: privilegios.map(p => p.codigo),
          mensaje: 'Contacta al administrador para solicitar este permiso'
        });
      }

      next();
    } catch (error) {
      console.error('❌ Error en verificarPrivilegio:', error);
      res.status(500).json({ 
        error: 'Error al verificar privilegios',
        detalles: error.message 
      });
    }
  };
}

// ✅ 5. VERIFICAR COORD BRIGADAS (específico)
export async function verificarCoordBrigadas(req, res, next) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const token = req.headers.authorization;

    let cuentasRolRes;
    try {
      cuentasRolRes = await axios.get(
        `${USUARIOS_SERVICE_URL}/api/usuarios/cuentas-rol/usuario/${userId}`,
        { headers: { Authorization: token } }
      );
    } catch (error) {
      if (error.response?.status === 404) {
        return res.status(403).json({ 
          error: 'Usuario sin roles asignados' 
        });
      }
      
      return res.status(500).json({ 
        error: 'Error al verificar permisos',
        detalles: error.message 
      });
    }

    const cuentasRol = cuentasRolRes.data;

    const esCoordBrigadas = cuentasRol.some(
      cuenta => 
        cuenta.activo && 
        (cuenta.roles_sistema?.codigo === 'coord_brigadas' ||
         cuenta.roles_sistema?.codigo === 'super_admin')
    );

    if (!esCoordBrigadas) {
      return res.status(403).json({
        error: 'Se requiere rol de coordinador de brigadas',
        roles_actuales: cuentasRol
          .filter(c => c.activo)
          .map(c => c.roles_sistema?.codigo)
      });
    }

    req.userRoles = cuentasRol
      .filter(c => c.activo)
      .map(c => ({
        codigo: c.roles_sistema?.codigo,
        departamento_id: c.departamento_id,
        municipio_id: c.municipio_id
      }));

    next();
  } catch (error) {
    console.error('❌ Error en verificarCoordBrigadas:', error);
    res.status(500).json({ 
      error: 'Error al verificar permisos',
      detalles: error.message 
    });
  }
}