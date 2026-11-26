/**
 * ARCHIVO: backend/src/middlewares/auth.js
 * RESPONSABLE: Antulio (F2)
 * QUÉ HACE: Protege rutas según la sesión.
 * REGLAS:
 *  - requiereLogin → 401 si no hay sesión válida.
 *  - requiereAdmin → 403 si el rol no es admin.
 *  - requiereEstudiante → 403 si el rol no es estudiante.
 *  - El rol se lee de la base de datos, NUNCA del body.
 */
const Usuario = require('../models/Usuario');

const OCHO_HORAS = 1000 * 60 * 60 * 8;

async function validarSesion(req, res) {
  if (!req.session?.usuario_id) {
    res.status(401).json({
      error: 'Debes iniciar sesión'
    });
    return null;
  }

  const ahora = new Date();

  const usuario = await Usuario.findOneAndUpdate(
    {
      _id: req.session.usuario_id,
      sesion_activa: req.sessionID,
      sesion_expira: { $gt: ahora }
    },
    {
      $set: {
        sesion_expira: new Date(ahora.getTime() + OCHO_HORAS)
      }
    },
    { new: true }
  );

  if (!usuario) {
    res.status(401).json({
      error: 'Tu sesión ha vencido o ya no es válida. Inicia sesión nuevamente.'
    });
    return null;
  }

  return usuario;
}

async function requiereLogin(req, res, next) {
  try {
    const usuario = await validarSesion(req, res);

    if (!usuario) return;

    req.usuario = usuario;
    next();
  } catch (error) {
    next(error);
  }
}

async function requiereAdmin(req, res, next) {
  try {
    const usuario = req.usuario || await validarSesion(req, res);

    if (!usuario) return;

    if (usuario.rol !== 'admin') {
      return res.status(403).json({
        error: 'Solo para administradores'
      });
    }

    req.usuario = usuario;
    next();
  } catch (error) {
    next(error);
  }
}

async function requiereEstudiante(req, res, next) {
  try {
    const usuario = req.usuario || await validarSesion(req, res);

    if (!usuario) return;

    if (usuario.rol !== 'estudiante') {
      return res.status(403).json({
        error: 'Solo estudiantes pueden solicitar rutas'
      });
    }

    req.usuario = usuario;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  requiereLogin,
  requiereAdmin,
  requiereEstudiante
};