/**
 * ARCHIVO: backend/src/config/db.js
 * RESPONSABLE: Antulio (F2)
 * QUÉ HACE: Conexión a MongoDB con Mongoose.
 * REGLAS: la URI sale SIEMPRE de process.env.MONGO_URI, nunca escrita en el código.
 */
const mongoose = require('mongoose');

async function conectarDB() {
  if (!process.env.MONGO_URI) throw new Error('Falta MONGO_URI en .env');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB conectado');
}

module.exports = { conectarDB };
