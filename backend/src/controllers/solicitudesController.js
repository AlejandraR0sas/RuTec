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
const { normalizar } = require('../utils/helpers');
const { calcularZona, distanciaMetros } = require('../utils/geo');
const { lineas, analizarZonas, regenerarRutasAprobadas } = require('../services/prologService');
const coordenadas = require('../data/coordenadas.json');

const ID_VALIDO = /^[a-z][a-z0-9_]*$/;

async function crear(req, res, next) {
  try {
    const { origen, origen_lat, origen_lng, destino_id, comentario } = req.body || {};
    if (typeof origen !== 'string' || !origen.trim())
      return res.status(400).json({ error: 'El origen es obligatorio' });
    if (!Number.isFinite(origen_lat) || !Number.isFinite(origen_lng) ||
        origen_lat < 21.9 || origen_lat > 22.4 || origen_lng < -101.3 || origen_lng > -100.6)
      return res.status(400).json({ error: 'Las coordenadas deben estar dentro del área de San Luis Potosí' });
    if (!ID_VALIDO.test(destino_id || ''))
      return res.status(400).json({ error: 'destino_id debe ser un ID de estación válido' });

    const catalogo = await lineas();
    const destinoEstacion = catalogo.flatMap((linea) => linea.estaciones || []).find((estacion) => estacion.id === destino_id);
    if (!destinoEstacion)
      return res.status(400).json({ error: 'destino_id no existe en el catálogo de estaciones' });

    const origenLimpio = origen.trim();
    const zona = calcularZona(origen_lat, origen_lng);
    const solicitud = await Solicitud.create({
      usuario: req.session.usuario_id,
      origen: origenLimpio,
      destino: destinoEstacion.nombre,
      origen_lat,
      origen_lng,
      zona,
      destino_id,
      demo: false,
      comentario,
      clave: `${zona}->${destino_id}`,
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

const COORDENADA_MINIMA = { lat: 21.9, lng: -101.3 };
const COORDENADA_MAXIMA = { lat: 22.4, lng: -100.6 };

function coordenadaEnSanLuis(lat, lng) {
  return Number.isFinite(lat) && Number.isFinite(lng) &&
    lat >= COORDENADA_MINIMA.lat && lat <= COORDENADA_MAXIMA.lat &&
    lng >= COORDENADA_MINIMA.lng && lng <= COORDENADA_MAXIMA.lng;
}

async function listarZonasAdmin(req, res, next) {
  try {
    const [catalogo, rutasAprobadas, grupos] = await Promise.all([
      lineas(),
      RutaAprobada.find({}, 'estaciones').lean(),
      Solicitud.aggregate([
        {
          $match: {
            estado: 'pendiente',
            zona: { $type: 'string' },
            destino_id: { $type: 'string' },
            origen_lat: { $type: 'number', $gte: COORDENADA_MINIMA.lat, $lte: COORDENADA_MAXIMA.lat },
            origen_lng: { $type: 'number', $gte: COORDENADA_MINIMA.lng, $lte: COORDENADA_MAXIMA.lng },
          },
        },
        {
          $group: {
            _id: '$clave',
            zona: { $first: '$zona' },
            destino_id: { $first: '$destino_id' },
            destino_nombre: { $first: '$destino' },
            total: { $sum: 1 },
            lat: { $avg: '$origen_lat' },
            lng: { $avg: '$origen_lng' },
            origenes: { $addToSet: '$origen' },
          },
        },
        { $sort: { total: -1 } },
      ]),
    ]);

    const nombresPorId = new Map();
    const idsPorNombre = new Map();
    catalogo.forEach((linea) => (linea.estaciones || []).forEach((estacion) => {
      nombresPorId.set(estacion.id, estacion.nombre);
      idsPorNombre.set(normalizar(estacion.nombre), estacion.id);
    }));

    const estacionesPorId = new Map();
    function agregarEstacion(id, nombre, punto) {
      if (!ID_VALIDO.test(id || '') || !coordenadaEnSanLuis(punto?.lat, punto?.lng)) return;
      if (!estacionesPorId.has(id)) {
        estacionesPorId.set(id, {
          id,
          nombre: nombre || nombresPorId.get(id) || id,
          lat: punto.lat,
          lng: punto.lng,
        });
      }
    }

    Object.entries(coordenadas).forEach(([clave, punto]) => {
      if (clave.startsWith('_')) return;
      const id = ID_VALIDO.test(clave) ? clave : idsPorNombre.get(normalizar(clave));
      if (id) agregarEstacion(id, nombresPorId.get(id) || clave, punto);
    });

    rutasAprobadas.forEach((ruta) => (ruta.estaciones || []).forEach((estacion) => {
      agregarEstacion(estacion.id, estacion.nombre, estacion);
    }));

    if (estacionesPorId.size === 0) {
      console.warn('No se pueden analizar zonas: no hay coordenadas activas de estaciones.');
      return res.json([]);
    }
    if (grupos.length === 0) return res.json([]);

    const gruposConDistancia = grupos.map((grupo) => {
      let cercana = null;
      let distanciaMinima = Infinity;
      estacionesPorId.forEach((estacion) => {
        const distancia = distanciaMetros(grupo.lat, grupo.lng, estacion.lat, estacion.lng);
        if (distancia < distanciaMinima) {
          distanciaMinima = distancia;
          cercana = estacion;
        }
      });
      return {
        ...grupo,
        distancia_m: Math.round(distanciaMinima),
        estacion_cercana: cercana,
      };
    });

    const analisis = await analizarZonas(gruposConDistancia.map((grupo) => ({
      zona: grupo.zona,
      total: grupo.total,
      distancia_m: grupo.distancia_m,
      estacion_cercana_id: grupo.estacion_cercana.id,
      destino_id: grupo.destino_id,
    })));

    if (!Array.isArray(analisis) || analisis.length !== gruposConDistancia.length)
      throw new Error('Prolog devolvió un análisis de zonas incompleto');

    const prioridades = { alta: 0, media: 1, baja: 2 };
    const respuesta = gruposConDistancia.map((grupo, indice) => ({
      clave: grupo._id,
      zona: grupo.zona,
      destino_id: grupo.destino_id,
      destino_nombre: grupo.destino_nombre,
      total: grupo.total,
      lat: grupo.lat,
      lng: grupo.lng,
      ejemplos_origen: grupo.origenes.slice(0, 3),
      estacion_cercana: { id: grupo.estacion_cercana.id, nombre: grupo.estacion_cercana.nombre },
      distancia_m: grupo.distancia_m,
      accion: analisis[indice].accion,
      prioridad: analisis[indice].prioridad,
      razones: analisis[indice].razones,
    }));

    respuesta.sort((a, b) => prioridades[a.prioridad] - prioridades[b.prioridad] || b.total - a.total);
    res.json(respuesta);
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

module.exports = { crear, listarAdmin, listarZonasAdmin, aprobar, rechazar, estadisticasAdmin };
