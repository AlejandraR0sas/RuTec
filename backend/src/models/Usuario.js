/**
 * ARCHIVO: backend/src/models/Usuario.js
 * RESPONSABLE: Antulio (F2)
 * QUÉ HACE: Modelo de usuario (estudiante o admin).
 * REGLAS:
 *  - Campos en snake_case. Nunca guardar la contraseña en texto plano: solo password_hash (bcrypt).
 *  - `rol` solo puede ser 'estudiante' o 'admin'.
 */
const { Schema, model } = require('mongoose');

const usuarioSchema = new Schema(
  {
    nombre: { type: String, required: true, trim: true },
    correo: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
    rol: { type: String, enum: ['estudiante', 'admin'], default: 'estudiante' },
  },
  { timestamps: { createdAt: 'creado_en', updatedAt: 'actualizado_en' } }
);

module.exports = model('Usuario', usuarioSchema);
