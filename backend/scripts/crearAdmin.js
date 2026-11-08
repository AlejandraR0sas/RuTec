/**
 * ARCHIVO: backend/scripts/crearAdmin.js
 * RESPONSABLE: Persona B (Backend)
 * QUÉ HACE: Crea (o actualiza) el usuario administrador con los datos de .env (ADMIN_*).
 * USO: npm run seed:admin
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Usuario = require('../src/models/Usuario');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const correo = (process.env.ADMIN_CORREO || '').toLowerCase();
    if (!correo || !process.env.ADMIN_PASSWORD) throw new Error('Faltan ADMIN_CORREO o ADMIN_PASSWORD en .env');
    const password_hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
    await Usuario.findOneAndUpdate(
      { correo },
      { nombre: process.env.ADMIN_NOMBRE || 'Administrador', correo, password_hash, rol: 'admin' },
      { upsert: true, new: true }
    );
    console.log(`Administrador listo: ${correo}`);
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
