/**
 * ARCHIVO: frontend/src/api/cliente.js
 * RESPONSABLE: Persona C (Frontend)
 * QUÉ HACE: ÚNICO lugar donde se llama a la API propia. Los componentes usan estas funciones, nunca fetch directo.
 * REGLAS:
 *  - Siempre credentials: 'include' (para que viaje la cookie de sesión).
 *  - Los endpoints y JSON deben coincidir con docs/API.md. Si cambia algo, se actualiza ese archivo primero.
 *  - Si la API responde error, se lanza un Error con el mensaje legible (`error` del JSON).
 */
async function pedir(ruta, { metodo = 'GET', cuerpo } = {}) {
  const resp = await fetch(`/api${ruta}`, {
    method: metodo,
    credentials: 'include',
    headers: cuerpo ? { 'Content-Type': 'application/json' } : undefined,
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const datos = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(datos.error || 'Ocurrió un error');
  return datos;
}

export const api = {
  // auth
  registro: (nombre, correo, password) => pedir('/auth/registro', { metodo: 'POST', cuerpo: { nombre, correo, password } }),
  login: (correo, password) => pedir('/auth/login', { metodo: 'POST', cuerpo: { correo, password } }),
  logout: () => pedir('/auth/logout', { metodo: 'POST' }),
  yo: () => pedir('/auth/yo'),
  // rutas
  lineas: () => pedir('/lineas'),
  coordenadas: () => pedir('/coordenadas'),
  recomendar: (origen, destino) => pedir('/recomendacion', { metodo: 'POST', cuerpo: { origen, destino } }),
  // solicitudes
  crearSolicitud: (origen, destino, comentario) => pedir('/solicitudes', { metodo: 'POST', cuerpo: { origen, destino, comentario } }),
  // admin
  solicitudesAdmin: () => pedir('/admin/solicitudes'),
  aprobar: (clave, nombre_linea, estaciones) =>
    pedir(`/admin/solicitudes/${encodeURIComponent(clave)}/aprobar`, { metodo: 'PUT', cuerpo: { nombre_linea, estaciones } }),
  rechazar: (clave) => pedir(`/admin/solicitudes/${encodeURIComponent(clave)}/rechazar`, { metodo: 'PUT' }),
};
