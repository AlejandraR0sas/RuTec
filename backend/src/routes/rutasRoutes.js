/** backend/src/routes/rutasRoutes.js — RESPONSABLE: Persona B. Líneas, coordenadas y recomendación (ver docs/API.md). */
const router = require('express').Router();
const c = require('../controllers/rutasController');

router.get('/lineas', c.lineas);
router.get('/coordenadas', c.listarCoordenadas);
router.post('/recomendacion', c.recomendacion);

module.exports = router;
