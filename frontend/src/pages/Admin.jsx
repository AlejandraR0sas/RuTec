
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
import './Admin.css';

export default function Admin() {
  const [grupos, setGrupos] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [lineas, setLineas] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [seccion, setSeccion] = useState('resumen');

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
      setLineas(lineas);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    cargarSolicitudes();
    cargarEstaciones();
    api.estadisticasAdmin().then(setEstadisticas).catch((e) => setError(e.message));
  }, []);

  async function recargarResumen() {
    const [resumen] = await Promise.all([api.estadisticasAdmin(), cargarSolicitudes()]);
    setEstadisticas(resumen);
  }

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
      await recargarResumen();
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
      await recargarResumen();
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  const estados = estadisticas?.solicitudes_por_estado || { pendientes: 0, aprobadas: 0, rechazadas: 0 };
  const maxConsultas = Math.max(1, ...(estadisticas?.consultas_por_hora || []).map((dato) => dato.total));

  return (
    <div className="admin">
      <aside className="admin__barra">
        <div className="admin__marca"><span aria-hidden="true">◉</span><strong>RuTec</strong><small>ADMIN</small></div>
        <nav className="admin__menu" aria-label="Secciones de administración">
          {[['resumen', 'Resumen'], ['solicitudes', 'Solicitudes'], ['rutas', 'Rutas y paradas'], ['analitica', 'Analítica']].map(([id, texto]) => (
            <button key={id} className={seccion === id ? 'admin__menu-activo' : ''} onClick={() => setSeccion(id)} type="button">{texto}</button>
          ))}
        </nav>
      </aside>

      <section className="admin__contenido">
        <header className="admin__encabezado"><div><p>Administración</p><h1>{seccion === 'resumen' ? 'Panel general · RuTec' : seccion === 'solicitudes' ? 'Solicitudes de estudiantes' : seccion === 'rutas' ? 'Rutas y estaciones' : 'Analítica de consultas'}</h1></div><span>Últimos 30 días</span></header>
        {error && <p className="admin__error" role="alert">{error}</p>}

        {seccion === 'resumen' && <>
          <div className="admin__metricas">
            <article className="admin__metrica admin__metrica-principal"><span>Usuarios registrados</span><strong>{estadisticas?.usuarios_registrados ?? '—'}</strong><small>Cuentas registradas en RuTec</small></article>
            <article className="admin__metrica"><span>Solicitudes pendientes</span><strong>{estadisticas?.solicitudes_pendientes ?? '—'}</strong><small>Esperan revisión</small></article>
            <article className="admin__metrica"><span>Ruta más consultada</span><strong>{estadisticas?.ruta_mas_consultada ? `${estadisticas.ruta_mas_consultada.origen_nombre} ↔ ${estadisticas.ruta_mas_consultada.destino_nombre}` : 'Sin datos todavía'}</strong><small>{estadisticas?.ruta_mas_consultada ? `${estadisticas.ruta_mas_consultada.total} consultas exitosas` : 'Se llenará con nuevas consultas'}</small></article>
            <article className="admin__metrica"><span>Línea más recomendada</span><strong>{estadisticas?.linea_mas_recomendada?.nombre || 'Sin datos todavía'}</strong><small>{estadisticas?.linea_mas_recomendada ? `${estadisticas.linea_mas_recomendada.total} recomendaciones` : 'Se llenará con nuevas consultas'}</small></article>
          </div>

          <div className="admin__graficas">
            <article className="admin__panel admin__panel-horas"><h2>Consultas por hora</h2><p>Recomendaciones exitosas de los últimos 30 días</p><div className="admin__barras" aria-label="Gráfica de consultas por hora">
              {(estadisticas?.consultas_por_hora || []).filter((dato) => dato.hora % 2 === 0).map((dato) => <div className="admin__barra-columna" key={dato.hora} title={`${dato.hora}:00 — ${dato.total} consultas`}><span style={{ height: `${Math.max(3, dato.total / maxConsultas * 100)}%` }} /><small>{dato.hora}:00</small></div>)}
            </div></article>
            <article className="admin__panel"><h2>Estado de solicitudes</h2><p>Solicitudes recibidas, agrupadas por estado</p><div className="admin__estados">{[['Pendientes', estados.pendientes], ['Aprobadas', estados.aprobadas], ['Rechazadas', estados.rechazadas]].map(([nombre, total]) => <div key={nombre}><span>{nombre}</span><strong>{total}</strong></div>)}</div></article>
          </div>

          <article className="admin__panel admin__recientes"><h2>Solicitudes recientes</h2>{(estadisticas?.solicitudes_recientes || []).length === 0 ? <p>Aún no hay solicitudes registradas.</p> : <div className="admin__tabla-contenedor"><table><thead><tr><th>Estudiante</th><th>Trayecto solicitado</th><th>Fecha</th><th>Estado</th></tr></thead><tbody>{estadisticas.solicitudes_recientes.map((solicitud) => <tr key={solicitud.id}><td>{solicitud.estudiante}</td><td>{solicitud.origen} → {solicitud.destino}</td><td>{new Date(solicitud.creada_en).toLocaleDateString('es-MX')}</td><td><span className={`admin__estado admin__estado-${solicitud.estado}`}>{({ pendiente: 'Pendiente', aprobada: 'Aprobada', rechazada: 'Rechazada' })[solicitud.estado] || solicitud.estado}</span></td></tr>)}</tbody></table></div>}</article>
        </>}

        {seccion === 'solicitudes' && <>
          {grupos.length === 0 && <article className="admin__panel"><p>No hay solicitudes pendientes.</p></article>}
          <div className="admin__lista-solicitudes">
        {grupos.map((g) => (
          <article className="admin__panel" key={g.clave}>
            <strong>
              {g.origen} → {g.destino}
            </strong>

            : {g.total} solicitud(es)

            {g.sugerida && (
              <strong> · Ya alcanzó el umbral</strong>
            )}

            <p>{g.total} solicitud(es) · {g.sugerida ? 'Trayecto más solicitado' : 'Pendiente de revisión'}</p>
            <div className="admin__acciones">
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
              <form className="admin__form-aprobacion" onSubmit={(e) => aprobar(e, g.clave)}>
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
          </article>
        ))}
          </div>
        </>}

        {seccion === 'rutas' && <article className="admin__panel"><h2>Líneas actuales</h2>{lineas.length === 0 ? <p>No se pudieron cargar las líneas.</p> : lineas.map((linea) => <section className="admin__linea" key={linea.id}><h3>{linea.nombre}</h3><p>{linea.estaciones?.length || 0} estaciones</p><ol>{linea.estaciones?.map((estacion) => <li key={estacion.id}>{estacion.nombre}</li>)}</ol></section>)}</article>}
        {seccion === 'analitica' && <article className="admin__panel"><h2>Consultas exitosas por hora</h2><p>Datos agregados, sin identificar a las personas. Son consultas a RuTec; no representan viajes reales.</p><div className="admin__barras admin__barras-grande">{(estadisticas?.consultas_por_hora || []).map((dato) => <div className="admin__barra-columna" key={dato.hora} title={`${dato.hora}:00 — ${dato.total} consultas`}><span style={{ height: `${Math.max(3, dato.total / maxConsultas * 100)}%` }} /><small>{dato.hora}:00</small></div>)}</div></article>}
      </section>
    </div>
  );
}
