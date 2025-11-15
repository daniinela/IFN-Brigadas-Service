//esto de aca es par verificar los tokens, la cosa es q 
//yo no la hago manual con la libreria jwt sino q utilizo supabase para esto
//ya q en supabase me autentica los usuarios y eso entonces me genera esos tokens alla
//entonces aca solo uso a supabase pa eso

// brigadas-service/middleware/authMiddleware.js
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function verificarToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    req.user = user;
    req.userId = user.id;
    next();
  } catch (error) {
    console.error('Error verificando token:', error);
    return res.status(401).json({ error: 'Error de autenticación' });
  }
}

export async function verificarCoordIFN(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const token = req.headers.authorization;
    const rolesRes = await axios.get(
      `${process.env.USUARIOS_SERVICE_URL}/api/cuentas-rol/usuario/${userId}`,
      { headers: { Authorization: token } }
    );

    const tieneRol = rolesRes.data.some(
      cr => cr.roles_sistema?.codigo === 'COORD_IFN' && cr.activo
    );

    if (!tieneRol) {
      return res.status(403).json({ error: 'Se requiere rol COORD_IFN' });
    }

    next();
  } catch (error) {
    console.error('Error verificando COORD_IFN:', error);
    res.status(500).json({ error: 'Error verificando permisos' });
  }
}

export async function verificarJefeBrigada(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const token = req.headers.authorization;
    const rolesRes = await axios.get(
      `${process.env.USUARIOS_SERVICE_URL}/api/cuentas-rol/usuario/${userId}`,
      { headers: { Authorization: token } }
    );

    const tieneRol = rolesRes.data.some(
      cr => cr.roles_sistema?.codigo === 'JEFE_BRIGADA' && cr.activo
    );

    if (!tieneRol) {
      return res.status(403).json({ error: 'Se requiere rol JEFE_BRIGADA' });
    }

    next();
  } catch (error) {
    console.error('Error verificando JEFE_BRIGADA:', error);
    res.status(500).json({ error: 'Error verificando permisos' });
  }
}