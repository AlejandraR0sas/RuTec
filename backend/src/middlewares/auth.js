/**
 * ARCHIVO: backend/src/middlewares/auth.js
 * RESPONSABLE: Antulio (F2)
 * QUÉ HACE: Protege rutas según la sesión.
 * REGLAS:
 *  - requiereLogin → 401 si no hay sesión.
 *  - requiereAdmin → 403 si el rol no es admin.
 *  - El rol se lee de la sesión, NUNCA del body de la petición.
 */
function requiereLogin(req, res, next) {
  if (!req.session.usuario_id) return res.status(401).json({ error: 'Debes iniciar sesión' });
  next();
}

function requiereAdmin(req, res, next) {
  if (!req.session.usuario_id) return res.status(401).json({ error: 'Debes iniciar sesión' });
  if (req.session.rol !== 'admin') return res.status(403).json({ error: 'Solo para administradores' });
  next();
}

module.exports = { requiereLogin, requiereAdmin };
