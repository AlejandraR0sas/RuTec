/**
 * ARCHIVO: backend/src/server.js
 * RESPONSABLE: Antulio (F2)
 * QUÉ HACE: Arranca el servidor: carga .env, conecta a MongoDB y levanta Express.
 *
 * REGLAS:
 *  - Aquí solo va el arranque. La configuración de Express vive en app.js.
 *  - Si MongoDB no conecta, el proceso termina con mensaje claro (no seguir sin base de datos).
 */
const path = require('node:path');

// Resuelve el .env junto a package.json aunque nodemon se ejecute desde otra carpeta.
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

if (!process.env.MONGO_URI) {
  console.error('Falta MONGO_URI. Crea backend/.env a partir de backend/.env.example.');
  process.exit(1);
}

const { conectarDB } = require('./config/db');
const app = require('./app');

const PORT = process.env.PORT || 3000;

conectarDB()
  .then(() => app.listen(PORT, () => console.log(`RuTec API en http://localhost:${PORT}`)))
  .catch((err) => {
    console.error('No se pudo conectar a MongoDB:', err.message);
    process.exit(1);
  });
