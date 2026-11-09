/**
 * ARCHIVO: backend/src/models/Solicitud.js
 * RESPONSABLE: Antulio (F2)
 * QUÉ HACE: Solicitud de una ruta que no existe.
 * REGLAS:
 *  - `clave` = origen y destino normalizados (utils/helpers.js → claveTrayecto). Sirve para AGRUPAR solicitudes iguales.
 *  - Un usuario solo puede pedir el mismo trayecto una vez (índice único usuario + clave).
 *
 * PENDIENTE:
 *  - [ ] Mejorar el agrupado: hoy es por texto; considerar elegir colonia/estación de una lista o redondear coordenadas.
 */
const { Schema, model } = require('mongoose');

const solicitudSchema = new Schema(
  {
    usuario: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
    origen: { type: String, required: true, trim: true },
    destino: { type: String, required: true, trim: true },
    clave: { type: String, required: true, index: true },
    comentario: { type: String, trim: true, default: '' },
    estado: { type: String, enum: ['pendiente', 'aprobada', 'rechazada'], default: 'pendiente' },
  },
  { timestamps: { createdAt: 'creada_en', updatedAt: 'actualizada_en' } }
);

solicitudSchema.index({ usuario: 1, clave: 1 }, { unique: true });

module.exports = model('Solicitud', solicitudSchema);
