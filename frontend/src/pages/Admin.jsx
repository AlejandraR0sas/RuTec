/**
 * ARCHIVO: frontend/src/pages/Admin.jsx
 * RESPONSABLE: Antulio (F2)
 * QUÉ HACE: Panel del administrador. Lista solicitudes agrupadas por trayecto con su contador.
 * REGLAS:
 *  - Resaltar las que traen sugerida:true (ya llegaron al umbral).
 *  - Aprobar pide: nombre de la línea y lista ordenada de estaciones {id, nombre, lat, lng}. Ver docs/API.md.
 *  - Los id de estaciones: snake_case, sin acentos. Reusar el id si la estación ya existe (ej. cetram).
 * PENDIENTE:
 *  - [ ] Formulario para capturar las estaciones al aprobar (ahora solo hay botón de rechazar)
 *  - [ ] Confirmación antes de rechazar
 */
import { useEffect, useState } from 'react';
import { api } from '../api/cliente.js';

export default function Admin() {
  const [grupos, setGrupos] = useState([]);
  const [error, setError] = useState('');

  const cargar = () => api.solicitudesAdmin().then(setGrupos).catch((e) => setError(e.message));
  useEffect(() => { cargar(); }, []);

  async function rechazar(clave) {
    await api.rechazar(clave);
    cargar();
  }

  return (
    <>
      <h1>Solicitudes de rutas</h1>
      {error && <p className="error">{error}</p>}
      {grupos.length === 0 && <p>No hay solicitudes pendientes.</p>}
      <ul>
        {grupos.map((g) => (
          <li key={g.clave}>
            <strong>{g.origen} → {g.destino}</strong>: {g.total} solicitud(es){g.sugerida ? ' · ya alcanzó el umbral' : ''}{' '}
            <button onClick={() => rechazar(g.clave)}>Rechazar</button>
          </li>
        ))}
      </ul>
    </>
  );
}
