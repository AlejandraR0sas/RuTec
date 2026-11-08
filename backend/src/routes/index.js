/**
 * ARCHIVO: backend/src/routes/index.js
 * RESPONSABLE: Persona B (Backend)
 * QUÉ HACE: Une todas las rutas bajo /api. Cada ruta nueva debe estar documentada en docs/API.md.
 */
const router = require('express').Router();

router.use('/auth', require('./authRoutes'));
router.use('/', require('./rutasRoutes'));
router.use('/', require('./solicitudesRoutes'));

module.exports = router;
