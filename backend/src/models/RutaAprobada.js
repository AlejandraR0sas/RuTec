/**
 * ARCHIVO: backend/src/models/RutaAprobada.js
 * RESPONSABLE: Antulio (F2)
 * QUÉ HACE: Línea nueva creada por el admin al aprobar solicitudes.
 *           Se traduce a hechos de Prolog en prolog/rutas_aprobadas.pl.
 * REGLAS:
 *  - Los `id` de estaciones siguen la regla del README (snake_case, sin acentos, empiezan con letra).
 *  - Si una estación ya existe en Prolog (ej. cetram), se usa el MISMO id para que Prolog detecte el transbordo.
 */
const { Schema, model } = require('mongoose');

const estacionSchema = new Schema(
  {
    id: { type: String, required: true, match: /^[a-z][a-z0-9_]*$/ },
    nombre: { type: String, required: true, trim: true },
    lat: Number,
    lng: Number,
  },
  { _id: false }
);

const rutaAprobadaSchema = new Schema(
  {
    nombre: { type: String, required: true, trim: true },
    estaciones: { type: [estacionSchema], validate: (v) => v.length >= 2 },
    clave_solicitud: { type: String, required: true },
    aprobada_por: { type: Schema.Types.ObjectId, ref: 'Usuario' },
  },
  { timestamps: { createdAt: 'creada_en', updatedAt: 'actualizada_en' } }
);

module.exports = model('RutaAprobada', rutaAprobadaSchema);
