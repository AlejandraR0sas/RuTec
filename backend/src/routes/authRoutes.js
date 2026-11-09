/** backend/src/routes/authRoutes.js — RESPONSABLE: Antulio (F2). Rutas de autenticación (ver docs/API.md). */
const router = require('express').Router();
const c = require('../controllers/authController');
const { requiereLogin } = require('../middlewares/auth');

router.post('/registro', c.registro);
router.post('/login', c.login);
router.post('/logout', requiereLogin, c.logout);
router.get('/yo', c.yo);

module.exports = router;
