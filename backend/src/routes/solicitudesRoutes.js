/** backend/src/routes/solicitudesRoutes.js — RESPONSABLE: Antulio (F2). Solicitudes (usuario) y administración (admin). */
const router = require('express').Router();
const c = require('../controllers/solicitudesController');
const { requiereLogin, requiereAdmin, requiereEstudiante } = require('../middlewares/auth');

router.post('/solicitudes', requiereLogin, requiereEstudiante, c.crear);
router.get('/admin/solicitudes', requiereAdmin, c.listarAdmin);
router.get('/admin/zonas', requiereAdmin, c.listarZonasAdmin);
router.get('/admin/estadisticas', requiereAdmin, c.estadisticasAdmin);
router.put('/admin/solicitudes/:clave/aprobar', requiereAdmin, c.aprobar);
router.put('/admin/solicitudes/:clave/rechazar', requiereAdmin, c.rechazar);

module.exports = router;
