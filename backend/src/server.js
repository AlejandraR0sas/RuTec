/**
 * ARCHIVO: backend/src/server.js
 * RESPONSABLE: Persona B (Backend)
 * QUÉ HACE: Arranca el servidor: carga .env, conecta a MongoDB y levanta Express.
 *
 * REGLAS:
 *  - Aquí solo va el arranque. La configuración de Express vive en app.js.
 *  - Si MongoDB no conecta, el proceso termina con mensaje claro (no seguir sin base de datos).
 */
require('dotenv').config();
const { conectarDB } = require('./config/db');
const app = require('./app');

const PORT = process.env.PORT || 3000;

conectarDB()
  .then(() => app.listen(PORT, () => console.log(`RuTec API en http://localhost:${PORT}`)))
  .catch((err) => {
    console.error('No se pudo conectar a MongoDB:', err.message);
    process.exit(1);
  });
