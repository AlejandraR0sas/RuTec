/** Guarda una consulta exitosa sin datos que identifiquen a la persona. */
const { Schema, model } = require('mongoose');

const consultaRecomendacionSchema = new Schema({
  origen_id: { type: String, required: true },
  origen_nombre: { type: String, required: true },
  destino_id: { type: String, required: true },
  destino_nombre: { type: String, required: true },
  lineas: [{ id: { type: String, required: true }, nombre: { type: String, required: true } }],
  consultada_en: { type: Date, default: Date.now, index: true },
});

module.exports = model('ConsultaRecomendacion', consultaRecomendacionSchema);
