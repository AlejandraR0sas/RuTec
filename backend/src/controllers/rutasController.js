/**
 * ARCHIVO: backend/src/controllers/rutasController.js
 * RESPONSABLE: COMPARTIDO: recomendacion → Ale (F1); lineas y coordenadas → Osiel (F3)
 * QUÉ HACE: Líneas, coordenadas y recomendación de ruta (le pregunta al sistema experto en Prolog).
 * REGLAS:
 *  - VALIDAR origen/destino con /^[a-z][a-z0-9_]*$/ antes de pasarlos a Prolog.
 *  - Si Prolog dice sin_ruta, responder 200 con puede_solicitar:true (no es un error). Ver docs/API.md.
 *  - Si no llegan hora/minuto/dia, usar la hora actual de México.
 *
 * PENDIENTE:
 *  - [ ] Mezclar en /coordenadas las estaciones de rutas aprobadas (guardan lat/lng en MongoDB).
 */
const prolog = require('../services/prologService');
const coordenadas = require('../data/coordenadas.json');
const { DIAS, ahoraMX } = require('../utils/helpers');
const ConsultaRecomendacion = require('../models/ConsultaRecomendacion');

const ID_VALIDO = /^[a-z][a-z0-9_]*$/;
const MENSAJES = {
  sin_ruta: 'No hay una ruta de MetroRed para ese trayecto.',
  estacion_desconocida: 'Esa estación no existe en el sistema.',
  mismo_origen_destino: 'El origen y el destino son la misma estación.',
};

async function lineas(req, res, next) {
  try {
    res.json(await prolog.lineas());
  } catch (err) {
    next(err);
  }
}

function listarCoordenadas(req, res) {
  const limpias = Object.fromEntries(Object.entries(coordenadas).filter(([k]) => !k.startsWith('_')));
  res.json(limpias);
}

async function recomendacion(req, res, next) {
  try {
    const { origen, destino } = req.body;
    if (!ID_VALIDO.test(origen || '') || !ID_VALIDO.test(destino || ''))
      return res.status(400).json({ error: 'origen y destino deben ser IDs de estación válidos' });

    const ahora = ahoraMX();
    const hora = req.body.hora ?? ahora.hora;
    const minuto = req.body.minuto ?? ahora.minuto;
    const dia = req.body.dia ?? ahora.dia;
    if (!Number.isInteger(hora) || hora < 0 || hora > 23 || !Number.isInteger(minuto) || minuto < 0 || minuto > 59 || !DIAS.includes(dia))
      return res.status(400).json({ error: 'hora (0-23), minuto (0-59) o dia no válidos' });

    const resultado = await prolog.recomendar({ origen, destino, hora, minuto, dia });
    if (!resultado.encontrada) {
      return res.json({
        ...resultado,
        mensaje: MENSAJES[resultado.motivo] || 'No se encontró una ruta.',
        puede_solicitar: resultado.motivo === 'sin_ruta',
      });
    }
    // Contamos recomendaciones exitosas de forma agregada, sin guardar quién consultó.
    try {
      const lineasUnicas = [...new Map((resultado.plan || []).map((tramo) => [
        tramo.linea,
        { id: tramo.linea, nombre: tramo.linea_nombre },
      ])).values()];
      await ConsultaRecomendacion.create({
        origen_id: resultado.origen.id,
        origen_nombre: resultado.origen.nombre,
        destino_id: resultado.destino.id,
        destino_nombre: resultado.destino.nombre,
        lineas: lineasUnicas,
      });
    } catch (errorRegistro) {
      // Un fallo de analítica no debe impedir que la persona reciba su ruta.
      console.error('No se pudo guardar la consulta de recomendación:', errorRegistro.message);
    }
    res.json(resultado);
  } catch (err) {
    next(err);
  }
}

module.exports = { lineas, listarCoordenadas, recomendacion };
