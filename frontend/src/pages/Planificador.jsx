/**
 * ARCHIVO: frontend/src/pages/Planificador.jsx
 * RESPONSABLE: Ale (F1) (los pendientes de ubicación, Nominatim y clima los hace Osiel (F3))
 * QUÉ HACE: Pantalla principal. El usuario elige origen y destino, pide la recomendación y ve el resultado en mapa.
 *
 * REGLAS:
 *  - Las estaciones salen de /api/lineas (no escribirlas a mano en el front).
 *  - Si la respuesta trae encontrada:false y puede_solicitar:true, mostrar el botón "Solicitar esta ruta"
 *    que lleva a /solicitar con origen y destino ya llenos.
 *  - Mostrar siempre un aviso de que horarios y ocupación son SIMULADOS (campo `simulado`).
 *
 * PENDIENTE:
 *  - [ ] Cargar coordenadas verificadas para todas las estaciones (coordenadas.json).
 *  - [ ] Probar ubicación, Nominatim, clima y recorrido una vez cargadas las coordenadas.
 *  - [x] Integrar controles de ubicación/direcciones/clima y dibujo condicional del recorrido.
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/cliente.js';
import Mapa from '../components/Mapa.jsx';
import ResultadoRuta from '../components/ResultadoRuta.jsx';
import { buscarDireccion as buscarDireccionPublica, obtenerClima, obtenerUbicacion } from '../services/apisPublicas.js';
import { estacionMasCercana } from '../utils/geo.js';
function obtenerDiaActual() {
  const dia = new Intl.DateTimeFormat('es-MX', {
    timeZone: 'America/Mexico_City',
    weekday: 'long',
  }).format(new Date());

  return dia.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
  const diasSemana = [
    { valor: 'lunes', etiqueta: 'Lunes' },
    { valor: 'martes', etiqueta: 'Martes' },
    { valor: 'miercoles', etiqueta: 'Miércoles' },
    { valor: 'jueves', etiqueta: 'Jueves' },
    { valor: 'viernes', etiqueta: 'Viernes' },
    { valor: 'sabado', etiqueta: 'Sábado' },
    { valor: 'domingo', etiqueta: 'Domingo' },
  ];
  export default function Planificador() {
  const [lineas, setLineas] = useState([]);
  const [coords, setCoords] = useState({});
  const [origen, setOrigen] = useState('');
  const [destino, setDestino] = useState('');
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');
  const [modoHorario, setModoHorario] = useState('ahora');
  const [horaSalida, setHoraSalida] = useState('');
  const [diaSalida, setDiaSalida] = useState(obtenerDiaActual);
  const [direccion, setDireccion] = useState('');
  const [campoDireccion, setCampoDireccion] = useState('origen');
  const [coincidencias, setCoincidencias] = useState([]);
  const [clima, setClima] = useState(null);
  const [cargandoUbicacion, setCargandoUbicacion] = useState(false);
  const navegar = useNavigate();

  useEffect(() => {
    api.lineas().then(setLineas).catch((e) => setError(e.message));
    api.coordenadas().then(setCoords).catch(() => {});
  }, []);

  const estaciones = useMemo(() => {
    const mapa = new Map();
    lineas.forEach((l) => l.estaciones.forEach((e) => mapa.set(e.id, e.nombre)));
    return [...mapa].map(([id, nombre]) => ({ id, nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }, [lineas]);

  async function buscar(e) {
    e.preventDefault();
    setError('');
    setResultado(null);

    if (modoHorario === 'salir' && !horaSalida) {
      setError('Selecciona una hora de salida antes de buscar la ruta.');
      return;
    }

    try {
      let respuesta;

      if (modoHorario === 'salir') {
        const [hora, minuto] = horaSalida.split(':').map(Number);
        respuesta = await api.recomendar(origen, destino, {
          hora,
          minuto,
          dia: diaSalida,
        });
      } else {
        respuesta = await api.recomendar(origen, destino);
      }

      setResultado(respuesta);
    } catch (err) {
      setError(err.message);
    }
  }

  async function usarUbicacion() {
    setError('');
    setCargandoUbicacion(true);
    try {
      const punto = await obtenerUbicacion();
      const cercana = estacionMasCercana(punto, coords);
      if (!cercana) throw new Error('Aún no hay coordenadas de estaciones para comparar tu ubicación.');
      setOrigen(cercana);
      setClima(await obtenerClima(punto.lat, punto.lng));
    } catch (err) {
      setError(err.message);
    } finally {
      setCargandoUbicacion(false);
    }
  }

  async function buscarDireccion(e) {
    e.preventDefault();
    setError('');
    setCoincidencias([]);
    try {
      setCoincidencias(await buscarDireccionPublica(direccion));
    } catch (err) {
      setError(err.message);
    }
  }

  function elegirDireccion(punto) {
    const cercana = estacionMasCercana(punto, coords);
    if (!cercana) {
      setError('Aún no hay coordenadas de estaciones para asignar la estación más cercana.');
      return;
    }
    if (campoDireccion === 'origen') setOrigen(cercana);
    else setDestino(cercana);
    setCoincidencias([]);
  }

  const nombreDe = (id) => estaciones.find((x) => x.id === id)?.nombre || id;

  return (
    <>
        <div className="planificador__pagina">
          <div className="planificador__columna">
             <div className="planificador__busqueda">
      <h1>¿A dónde vas?</h1>
      <form onSubmit={buscar}>
                <div className="planificador__campos-estaciones">
          <label>
            Origen
            <select value={origen} onChange={(e) => setOrigen(e.target.value)} required>
              <option value="">Elige una estación</option>
              {estaciones.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </label>

          <button
            type="button"
            className="planificador__invertir"
            aria-label="Intercambiar origen y destino"
            onClick={() => {
              setOrigen(destino);
              setDestino(origen);
              setResultado(null);
            }}
          >
            <span aria-hidden="true">⇅</span>
          </button>

          <label>
            Destino
            <select value={destino} onChange={(e) => setDestino(e.target.value)} required>
              <option value="">Elige una estación</option>
              {estaciones.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </label>
        </div>
        <div className="horario-selector">
            <p className="horario-selector__titulo">Horario</p>

          <div className="horario-selector__opciones" role="group" aria-label="Elegir horario">
            <button
              type="button"
              className="horario-selector__boton"
              aria-pressed={modoHorario === 'ahora'}
              onClick={() => setModoHorario('ahora')}
            >
              Ahora
            </button>
            <button
              type="button"
              className="horario-selector__boton"
              aria-pressed={modoHorario === 'salir'}
              onClick={() => setModoHorario('salir')}
            >
              Salir a las
            </button>
          </div>

          {modoHorario === 'salir' && (
            <div className="horario-selector__campos">
              <label className="horario-selector__campo">
                Hora de salida
                <input
                  type="time"
                  value={horaSalida}
                  onChange={(e) => setHoraSalida(e.target.value)}
                />
              </label>

              <label className="horario-selector__campo">
                Día
                <select
                  value={diaSalida}
                  onChange={(e) => setDiaSalida(e.target.value)}
                >
                  {diasSemana.map((dia) => (
                    <option key={dia.valor} value={dia.valor}>
                      {dia.etiqueta}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
      </div>
        <button type="submit">Buscar ruta</button>
        <button type="button" onClick={usarUbicacion} disabled={cargandoUbicacion}>
          {cargandoUbicacion ? 'Buscando…' : 'Usar mi ubicación como origen'}
        </button>
      </form>

      <details className="planificador__direcciones">
        <summary>¿No encuentras tu estación? Buscar por dirección</summary>

        <form onSubmit={buscarDireccion}>
          <label>
            Buscar dirección para
            <select value={campoDireccion} onChange={(e) => setCampoDireccion(e.target.value)}>
              <option value="origen">origen</option>
              <option value="destino">destino</option>
            </select>
          </label>
          <label>
            Dirección en San Luis Potosí
            <input value={direccion} onChange={(e) => setDireccion(e.target.value)} required />
          </label>
          <button type="submit">Buscar dirección</button>
        </form>
        {coincidencias.length > 0 && (
          <ul aria-label="Resultados de direcciones">
            {coincidencias.map((p, i) => (
              <li key={`${p.lat}-${p.lng}-${i}`}>
                <button type="button" onClick={() => elegirDireccion(p)}>{p.nombre}</button>
              </li>
            ))}
          </ul>
        )}
      </details>

          {error && <p className="error">{error}</p>}
          {clima && <p className="aviso">Clima en tu ubicación: {clima.temperature_2m} °C; precipitación {clima.precipitation} mm.</p>}
                 </div>
          {resultado && <ResultadoRuta resultado={resultado} />}
          {resultado && !resultado.encontrada && resultado.puede_solicitar && (
            <button onClick={() => navegar('/solicitar', { state: { origen: nombreDe(origen), destino: nombreDe(destino) } })}>
              Solicitar esta ruta
            </button>
          )}
        </div>
        <Mapa estaciones={estaciones} coordenadas={coords} lineas={lineas} resultado={resultado} />
      </div>
    </>
  );
}
