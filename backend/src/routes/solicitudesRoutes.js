/** backend/src/routes/solicitudesRoutes.js — RESPONSABLE: Antulio (F2). Solicitudes (usuario) y administración (admin). */
const router = require('express').Router();
const c = require('../controllers/solicitudesController');
const { requiereLogin, requiereAdmin } = require('../middlewares/auth');

router.post('/solicitudes', requiereLogin, c.crear);
router.get('/admin/solicitudes', requiereAdmin, c.listarAdmin);
router.put('/admin/solicitudes/:clave/aprobar', requiereAdmin, c.aprobar);
router.put('/admin/solicitudes/:clave/rechazar', requiereAdmin, c.rechazar);

module.exports = router;
