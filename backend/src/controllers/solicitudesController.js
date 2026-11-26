/**
 * ARCHIVO: backend/src/controllers/solicitudesController.js
 * RESPONSABLE: Antulio (F2)
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
const Usuario = require('../models/Usuario');
const ConsultaRecomendacion = require('../models/ConsultaRecomendacion');
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

async function estadisticasAdmin(req, res, next) {
  try {
    const desde = new Date();
    desde.setDate(desde.getDate() - 30);
    const filtroPeriodo = { consultada_en: { $gte: desde } };

    const [usuarios, pendientes, porEstado, rutas, lineas, consultasHora, recientes] = await Promise.all([
      Usuario.countDocuments(),
      Solicitud.countDocuments({ estado: 'pendiente' }),
      Solicitud.aggregate([{ $group: { _id: '$estado', total: { $sum: 1 } } }]),
      ConsultaRecomendacion.aggregate([
        { $match: filtroPeriodo },
        { $group: { _id: { origen_id: '$origen_id', destino_id: '$destino_id', origen_nombre: '$origen_nombre', destino_nombre: '$destino_nombre' }, total: { $sum: 1 } } },
        { $sort: { total: -1 } }, { $limit: 1 },
      ]),
      ConsultaRecomendacion.aggregate([
        { $match: filtroPeriodo }, { $unwind: '$lineas' },
        { $group: { _id: '$lineas.id', nombre: { $first: '$lineas.nombre' }, total: { $sum: 1 } } },
        { $sort: { total: -1 } }, { $limit: 1 },
      ]),
      ConsultaRecomendacion.aggregate([
        { $match: filtroPeriodo },
        { $group: { _id: { $hour: { date: '$consultada_en', timezone: 'America/Mexico_City' } }, total: { $sum: 1 } } },
      ]),
      Solicitud.find().sort({ creada_en: -1 }).limit(8).populate('usuario', 'nombre').lean(),
    ]);

    const estados = { pendientes: 0, aprobadas: 0, rechazadas: 0 };
    porEstado.forEach(({ _id, total }) => {
      const clave = { pendiente: 'pendientes', aprobada: 'aprobadas', rechazada: 'rechazadas' }[_id];
      if (clave) estados[clave] = total;
    });

    const horas = Array.from({ length: 24 }, (_, hora) => ({ hora, total: 0 }));
    consultasHora.forEach(({ _id, total }) => { horas[_id].total = total; });
    const ruta = rutas[0];
    const linea = lineas[0];

    res.json({
      periodo_dias: 30,
      usuarios_registrados: usuarios,
      solicitudes_pendientes: pendientes,
      ruta_mas_consultada: ruta ? { ...ruta._id, total: ruta.total } : null,
      linea_mas_recomendada: linea ? { id: linea._id, nombre: linea.nombre, total: linea.total } : null,
      consultas_por_hora: horas,
      solicitudes_por_estado: estados,
      solicitudes_recientes: recientes.map((solicitud) => ({
        id: String(solicitud._id),
        estudiante: solicitud.usuario?.nombre || 'Cuenta no disponible',
        origen: solicitud.origen,
        destino: solicitud.destino,
        creada_en: solicitud.creada_en,
        estado: solicitud.estado,
      })),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { crear, listarAdmin, aprobar, rechazar, estadisticasAdmin };
