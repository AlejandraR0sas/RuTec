
/**
 * ARCHIVO: frontend/src/pages/Admin.jsx
 * RESPONSABLE: Antulio (F2)
 * QUÉ HACE:
 *  - Lista solicitudes agrupadas por trayecto.
 *  - Permite aprobar rutas usando estaciones existentes.
 *  - Permite rechazar solicitudes.
 */

import { useEffect, useState } from 'react';
import { api } from '../api/cliente.js';

export default function Admin() {
  const [grupos, setGrupos] = useState([]);
  const [catalogo, setCatalogo] = useState([]);

  const [claveAbierta, setClaveAbierta] = useState(null);
  const [nombreLinea, setNombreLinea] = useState('');
  const [estacionSeleccionada, setEstacionSeleccionada] = useState('');
  const [estaciones, setEstaciones] = useState([]);

  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  // Cargar solicitudes pendientes.
  async function cargarSolicitudes() {
    try {
      const datos = await api.solicitudesAdmin();
      setGrupos(datos);
    } catch (e) {
      setError(e.message);
    }
  }

  // Cargar todas las estaciones existentes.
  async function cargarEstaciones() {
    try {
      const respuesta = await api.lineas();

      // La API devuelve un arreglo de líneas.
      // Se contempla también una respuesta envuelta en "value".
      const lineas = Array.isArray(respuesta)
        ? respuesta
        : Array.isArray(respuesta?.value)
          ? respuesta.value
          : [];

      // Reunir estaciones y eliminar duplicados por ID.
      const unicas = new Map();

      lineas.forEach((linea) => {
        linea.estaciones?.forEach((estacion) => {
          if (!unicas.has(estacion.id)) {
            unicas.set(estacion.id, {
              id: estacion.id,
              nombre: estacion.nombre,
            });
          }
        });
      });

      setCatalogo(
        [...unicas.values()].sort((a, b) =>
          a.nombre.localeCompare(b.nombre)
        )
      );
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    cargarSolicitudes();
    cargarEstaciones();
  }, []);

  // Abrir o cerrar el formulario de aprobación.
  function abrirFormulario(grupo) {
    if (claveAbierta === grupo.clave) {
      cerrarFormulario();
      return;
    }

    setClaveAbierta(grupo.clave);
    setNombreLinea('');
    setEstaciones([]);
    setEstacionSeleccionada('');
    setError('');
  }

  function cerrarFormulario() {
    setClaveAbierta(null);
    setNombreLinea('');
    setEstaciones([]);
    setEstacionSeleccionada('');
    setError('');
  }

  // Agregar una estación al recorrido.
  function agregarEstacion() {
    if (!estacionSeleccionada) return;

    const estacion = catalogo.find(
      (e) => e.id === estacionSeleccionada
    );

    if (!estacion) return;

    // Evitar estaciones repetidas.
    if (estaciones.some((e) => e.id === estacion.id)) {
      setError('Esta estación ya está agregada.');
      return;
    }

    setEstaciones((actuales) => [...actuales, estacion]);
    setEstacionSeleccionada('');
    setError('');
  }

  // Quitar una estación.
  function quitarEstacion(id) {
    setEstaciones((actuales) =>
      actuales.filter((e) => e.id !== id)
    );
  }

  // Cambiar el orden de una estación.
  function moverEstacion(indice, direccion) {
    const nuevoOrden = [...estaciones];
    const nuevoIndice = indice + direccion;

    if (nuevoIndice < 0 || nuevoIndice >= nuevoOrden.length) {
      return;
    }

    [nuevoOrden[indice], nuevoOrden[nuevoIndice]] = [
      nuevoOrden[nuevoIndice],
      nuevoOrden[indice],
    ];

    setEstaciones(nuevoOrden);
  }

  // Aprobar una ruta.
  async function aprobar(e, clave) {
    e.preventDefault();
    setError('');

    if (!nombreLinea.trim()) {
      setError('Escribe el nombre de la línea.');
      return;
    }

    if (estaciones.length < 2) {
      setError('Debes agregar al menos dos estaciones.');
      return;
    }

    try {
      setCargando(true);

      await api.aprobar(
        clave,
        nombreLinea.trim(),
        estaciones
      );

      cerrarFormulario();
      await cargarSolicitudes();
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  // Rechazar una solicitud.
  async function rechazar(clave) {
    const confirmar = window.confirm(
      '¿Estás seguro de que deseas rechazar esta solicitud?'
    );

    if (!confirmar) return;

    try {
      setError('');
      setCargando(true);

      await api.rechazar(clave);
      await cargarSolicitudes();
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <>
      <h1>Solicitudes de rutas</h1>

      {error && <p className="error">{error}</p>}

      {grupos.length === 0 && (
        <p>No hay solicitudes pendientes.</p>
      )}

      <ul>
        {grupos.map((g) => (
          <li key={g.clave}>
            <strong>
              {g.origen} → {g.destino}
            </strong>

            : {g.total} solicitud(es)

            {g.sugerida && (
              <strong> · Ya alcanzó el umbral</strong>
            )}

            <div>
              <button
                type="button"
                onClick={() => abrirFormulario(g)}
                disabled={cargando}
              >
                {claveAbierta === g.clave
                  ? 'Cancelar aprobación'
                  : 'Aprobar'}
              </button>

              <button
                type="button"
                onClick={() => rechazar(g.clave)}
                disabled={cargando}
              >
                Rechazar
              </button>
            </div>

            {claveAbierta === g.clave && (
              <form onSubmit={(e) => aprobar(e, g.clave)}>
                <h3>Configurar nueva ruta</h3>

                <label>
                  Nombre de la línea

                  <input
                    type="text"
                    value={nombreLinea}
                    onChange={(e) =>
                      setNombreLinea(e.target.value)
                    }
                    placeholder="Ej. Línea Alameda - ITSSLPC"
                    required
                  />
                </label>

                <h4>Agregar estaciones</h4>

                <select
                  value={estacionSeleccionada}
                  onChange={(e) =>
                    setEstacionSeleccionada(e.target.value)
                  }
                >
                  <option value="">
                    Selecciona una estación
                  </option>

                  {catalogo
                    .filter(
                      (estacion) =>
                        !estaciones.some(
                          (e) => e.id === estacion.id
                        )
                    )
                    .map((estacion) => (
                      <option
                        key={estacion.id}
                        value={estacion.id}
                      >
                        {estacion.nombre}
                      </option>
                    ))}
                </select>

                <button
                  type="button"
                  onClick={agregarEstacion}
                  disabled={!estacionSeleccionada}
                >
                  Agregar estación
                </button>

                <h4>Recorrido de la ruta</h4>

                {estaciones.length === 0 && (
                  <p>
                    Todavía no has agregado estaciones.
                  </p>
                )}

                <ol>
                  {estaciones.map((estacion, indice) => (
                    <li key={estacion.id}>
                      <strong>{estacion.nombre}</strong>
                      {' '}
                      <small>({estacion.id})</small>

                      <button
                        type="button"
                        onClick={() =>
                          moverEstacion(indice, -1)
                        }
                        disabled={indice === 0}
                        aria-label="Mover estación arriba"
                      >
                        ↑
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          moverEstacion(indice, 1)
                        }
                        disabled={
                          indice === estaciones.length - 1
                        }
                        aria-label="Mover estación abajo"
                      >
                        ↓
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          quitarEstacion(estacion.id)
                        }
                      >
                        Quitar
                      </button>
                    </li>
                  ))}
                </ol>

                <button
                  type="submit"
                  disabled={cargando}
                >
                  {cargando
                    ? 'Procesando...'
                    : 'Confirmar aprobación'}
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
