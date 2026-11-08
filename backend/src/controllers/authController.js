/**
 * ARCHIVO: backend/src/controllers/authController.js
 * RESPONSABLE: Persona B (Backend)
 * QUÉ HACE: Registro, login, logout y "quién soy" usando sesiones (MongoDB).
 * REGLAS:
 *  - El registro SIEMPRE crea rol 'estudiante' (ignorar cualquier `rol` que venga en el body).
 *  - Mismo mensaje de error para correo o contraseña incorrectos (no revelar cuál falló).
 *  - Al hacer login se regenera la sesión (evita fijación de sesión).
 *  - Respuestas según docs/API.md.
 */
const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');

const publico = (u) => ({ id: u._id, nombre: u.nombre, correo: u.correo, rol: u.rol });

async function registro(req, res, next) {
  try {
    const { nombre, correo, password } = req.body;
    if (!nombre || !correo || !password || password.length < 8)
      return res.status(400).json({ error: 'Nombre, correo y contraseña (mínimo 8 caracteres) son obligatorios' });
    if (await Usuario.findOne({ correo: String(correo).toLowerCase() }))
      return res.status(409).json({ error: 'Ese correo ya está registrado' });

    const password_hash = await bcrypt.hash(password, 10);
    const usuario = await Usuario.create({ nombre, correo, password_hash, rol: 'estudiante' });
    req.session.usuario_id = usuario._id.toString();
    req.session.rol = usuario.rol;
    res.status(201).json({ usuario: publico(usuario) });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { correo, password } = req.body;
    const usuario = await Usuario.findOne({ correo: String(correo || '').toLowerCase() });
    const valido = usuario && (await bcrypt.compare(String(password || ''), usuario.password_hash));
    if (!valido) return res.status(401).json({ error: 'Correo o contraseña incorrectos' });

    req.session.regenerate((err) => {
      if (err) return next(err);
      req.session.usuario_id = usuario._id.toString();
      req.session.rol = usuario.rol;
      res.json({ usuario: publico(usuario) });
    });
  } catch (err) {
    next(err);
  }
}

function logout(req, res, next) {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('rutec.sid');
    res.json({ ok: true });
  });
}

async function yo(req, res, next) {
  try {
    if (!req.session.usuario_id) return res.json({ usuario: null });
    const usuario = await Usuario.findById(req.session.usuario_id);
    res.json({ usuario: usuario ? publico(usuario) : null });
  } catch (err) {
    next(err);
  }
}

module.exports = { registro, login, logout, yo };
