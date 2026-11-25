/**
 * ARCHIVO: backend/src/config/session.js
 * RESPONSABLE: Antulio (F2)
 * QUÉ HACE: Sesiones con express-session guardadas en MongoDB (connect-mongo).
 *           ← REQUISITO DE LA MAESTRA.
 *
 * REGLAS:
 *  - La cookie es httpOnly. En producción (HTTPS) debe ser secure.
 *  - SESSION_SECRET viene de .env.
 *  - En la sesión solo se guarda { usuario_id, rol }, nada de contraseñas.
 *  - El front debe mandar las peticiones con credentials: 'include' (ya lo hace api/cliente.js).
 */

const session = require('express-session');
const MongoStore = require('connect-mongo');

const OCHO_HORAS = 1000 * 60 * 60 * 8;

if (!process.env.SESSION_SECRET) {
  throw new Error('Falta SESSION_SECRET en el archivo .env');
}

if (!process.env.MONGO_URI) {
  throw new Error('Falta MONGO_URI en el archivo .env');
}

module.exports = session({
  name: 'rutec.sid',

  secret: process.env.SESSION_SECRET,

  resave: false,
  saveUninitialized: false,

  // Renueva la cookie cuando hay actividad.
  rolling: true,

  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sesiones',
    ttl: OCHO_HORAS / 1000,
    touchAfter: 0
  }),

  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: OCHO_HORAS
  }
});
