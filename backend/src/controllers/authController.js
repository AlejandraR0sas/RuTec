/**
 * ARCHIVO: backend/src/controllers/authController.js
 * RESPONSABLE: Antulio (F2)
 * QUÉ HACE: Registro, login, logout y "quién soy" usando sesiones (MongoDB).
 * REGLAS:
 *  - El registro SIEMPRE crea rol 'estudiante' (ignorar cualquier `rol` que venga en el body).
 *  - Mismo mensaje de error para correo o contraseña incorrectos (no revelar cuál falló).
 *  - Al hacer login se regenera la sesión (evita fijación de sesión).
 *  - Respuestas según docs/API.md.
 */

const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');

const OCHO_HORAS = 1000 * 60 * 60 * 8;

const publico = (usuario) => ({
  id: usuario._id,
  nombre: usuario.nombre,
  correo: usuario.correo,
  rol: usuario.rol
});

// Reclama una sesión nueva para el usuario.
async function activarSesion(usuario, req, res, next, codigo = 200) {
  req.session.regenerate(async (error) => {
    if (error) return next(error);

    const sessionId = req.sessionID;
    const ahora = new Date();
    const expiracion = new Date(ahora.getTime() + OCHO_HORAS);

    try {
      // Solo permite reclamar la sesión si no existe una activa
      // o si la anterior ya venció.
      const actualizado = await Usuario.findOneAndUpdate(
        {
          _id: usuario._id,
          $or: [
            { sesion_activa: null },
            { sesion_activa: { $exists: false } },
            { sesion_expira: null },
            { sesion_expira: { $lte: ahora } }
          ]
        },
        {
          $set: {
            sesion_activa: sessionId,
            sesion_expira: expiracion
          }
        },
        { new: true }
      );

      if (!actualizado) {
        req.session.destroy(() => {});

        return res.status(409).json({
          error: 'Esta cuenta ya tiene una sesión activa'
        });
      }

      req.session.usuario_id = actualizado._id.toString();
      req.session.rol = actualizado.rol;

      req.session.save(async (errorGuardar) => {
        if (errorGuardar) {
          try {
            await Usuario.updateOne(
              {
                _id: actualizado._id,
                sesion_activa: sessionId
              },
              {
                $set: {
                  sesion_activa: null,
                  sesion_expira: null
                }
              }
            );
          } catch (errorLimpieza) {
            console.error('Error al liberar sesión:', errorLimpieza);
          }

          req.session.destroy(() => {});
          return next(errorGuardar);
        }

        res.status(codigo).json({
          usuario: publico(actualizado)
        });
      });
    } catch (error) {
      req.session.destroy(() => {});
      next(error);
    }
  });
}

// REGISTRO
async function registro(req, res, next) {
  try {
    const { nombre, correo, password } = req.body;

    if (
      !nombre ||
      !correo ||
      !password ||
      typeof password !== 'string' ||
      password.length < 8
    ) {
      return res.status(400).json({
        error: 'Nombre, correo y contraseña (mínimo 8 caracteres) son obligatorios'
      });
    }

    const correoNormalizado = String(correo).trim().toLowerCase();

    const password_hash = await bcrypt.hash(password, 10);

    const usuario = await Usuario.create({
      nombre,
      correo: correoNormalizado,
      password_hash,
      rol: 'estudiante',
      sesion_activa: null,
      sesion_expira: null
    });

    await activarSesion(usuario, req, res, next, 201);

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        error: 'Ese correo ya está registrado'
      });
    }

    next(error);
  }
}

// INICIO DE SESIÓN
async function login(req, res, next) {
  try {
    const { correo, password } = req.body;

    const correoNormalizado = String(correo || '')
      .trim()
      .toLowerCase();

    const usuario = await Usuario.findOne({
      correo: correoNormalizado
    });

    if (
      !usuario ||
      !(await bcrypt.compare(
        String(password || ''),
        usuario.password_hash
      ))
    ) {
      return res.status(401).json({
        error: 'Correo o contraseña incorrectos'
      });
    }

    await activarSesion(usuario, req, res, next);

  } catch (error) {
    next(error);
  }
}

// CERRAR SESIÓN
async function logout(req, res, next) {
  try {
    const usuarioId = req.session.usuario_id;
    const sessionId = req.sessionID;

    await Usuario.updateOne(
      {
        _id: usuarioId,
        sesion_activa: sessionId
      },
      {
        $set: {
          sesion_activa: null,
          sesion_expira: null
        }
      }
    );

    req.session.destroy((error) => {
      if (error) return next(error);

      res.clearCookie('rutec.sid');
      res.json({ ok: true });
    });

  } catch (error) {
    next(error);
  }
}

// CONSULTAR USUARIO AUTENTICADO
async function yo(req, res, next) {
  try {
    if (!req.session?.usuario_id) {
      return res.json({ usuario: null });
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
          sesion_expira: new Date(
            ahora.getTime() + OCHO_HORAS
          )
        }
      },
      { new: true }
    );

    if (!usuario) {
      return res.json({ usuario: null });
    }

    res.json({
      usuario: publico(usuario)
    });

  } catch (error) {
    next(error);
  }
}

module.exports = {
  registro,
  login,
  logout,
  yo
};
