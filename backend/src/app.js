/**
 * ARCHIVO: backend/src/app.js
 * RESPONSABLE: Antulio (F2)
 * QUÉ HACE: Configura Express: JSON, sesiones (MongoDB), rutas y manejo de errores.
 *
 * REGLAS:
 *  - Las sesiones deben montarse ANTES de las rutas.
 *  - Todas las rutas cuelgan de /api y salen de routes/index.js.
 *  - Los errores se responden como { error: "mensaje" } (ver docs/API.md).
 *
 * PENDIENTE:
 *  - [ ] Agregar límite de peticiones (express-rate-limit) en /api/auth.
 */
const express = require('express');
const sesion = require('./config/session');
const rutas = require('./routes');

const app = express();
app.use(express.json());
app.use(sesion);
app.use('/api', rutas);

app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

module.exports = app;
