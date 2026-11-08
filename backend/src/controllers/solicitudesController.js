/**
 * ARCHIVO: backend/src/controllers/solicitudesController.js
 * RESPONSABLE: Persona B (Backend)
 * QUÉ HACE: Solicitudes de rutas nuevas (usuarios) y su gestión (administrador).
 * REGLAS:
 *  - Crear solicitud: solo usuarios logueados; 1 por usuario por trayecto (409 si repite).
 *  - Listar/aprobar/rechazar: solo admin (middleware requiereAdmin en las rutas).
 *  - Al aprobar: validar estaciones (IDs válidos, mínimo 2), crear RutaAprobada,
 *    marcar las solicitudes de esa clave como 'aprobada' y regenerar rutas_aprobadas.pl.
 *  - `sugerida` = total >= UMBRAL_SOLICITUDES (.env).
 */
const Solicitud = require('../models/Solicitud');
const RutaAprobada = require('../models/RutaAprobada');
const { claveTrayecto } = require('../utils/helpers');
const { regenerarRutasAprobadas } = require('../services/prologService');

const ID_VALIDO = /^[a-z][a-z0-9_]*$/;

async function crear(req, res, next) {
  try {
    const { origen, destino, comentario } = req.body;
    if (!origen || !destino) return res.status(400).json({ error: 'origen y destino son obligatorios' });
    const solicitud = await Solicitud.create({
      usuario: req.session.usuario_id,
      origen,
      destino,
      comentario,
      clave: claveTrayecto(origen, destino),
    });
    res.status(201).json({ solicitud });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Ya solicitaste este trayecto' });
    next(err);
  }
}

async function listarAdmin(req, res, next) {
  try {
    const umbral = Number(process.env.UMBRAL_SOLICITUDES) || 10;
    const grupos = await Solicitud.aggregate([
      { $match: { estado: 'pendiente' } },
      {
        $group: {
          _id: '$clave',
          origen: { $first: '$origen' },
          destino: { $first: '$destino' },
          total: { $sum: 1 },
          ultima: { $max: '$creada_en' },
        },
      },
      { $sort: { total: -1 } },
    ]);
    res.json(grupos.map((g) => ({ clave: g._id, origen: g.origen, destino: g.destino, total: g.total, ultima: g.ultima, sugerida: g.total >= umbral })));
  } catch (err) {
    next(err);
  }
}

async function aprobar(req, res, next) {
  try {
    const clave = req.params.clave;
    const { nombre_linea, estaciones } = req.body;
    const validas =
      Array.isArray(estaciones) && estaciones.length >= 2 && estaciones.every((e) => ID_VALIDO.test(e.id || '') && e.nombre);
    if (!nombre_linea || !validas)
      return res.status(400).json({ error: 'Se necesita nombre_linea y al menos 2 estaciones con id válido y nombre' });

    const ruta = await RutaAprobada.create({
      nombre: nombre_linea,
      estaciones,
      clave_solicitud: clave,
      aprobada_por: req.session.usuario_id,
    });
    await Solicitud.updateMany({ clave, estado: 'pendiente' }, { estado: 'aprobada' });
    await regenerarRutasAprobadas();
    res.json({ ruta });
  } catch (err) {
    next(err);
  }
}

async function rechazar(req, res, next) {
  try {
    await Solicitud.updateMany({ clave: req.params.clave, estado: 'pendiente' }, { estado: 'rechazada' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { crear, listarAdmin, aprobar, rechazar };
