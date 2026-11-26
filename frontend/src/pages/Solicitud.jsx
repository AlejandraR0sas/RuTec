/**
 * ARCHIVO: frontend/src/pages/Solicitud.jsx
 * RESPONSABLE: Antulio (F2)
 * QUÉ HACE: Permite solicitar un trayecto con origen geográfico y estación destino.
 * REGLAS: Nominatim se consulta solo al pulsar el botón; la API limita las búsquedas a una por segundo.
 */
import { useEffect, useMemo, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { api } from '../api/cliente.js';
import { useAuth } from '../context/AuthContext.jsx';
import { buscarDireccion, obtenerUbicacion } from '../services/apisPublicas.js';

const LIMITES_SLP = { latMin: 21.9, latMax: 22.4, lngMin: -101.3, lngMax: -100.6 };

function coordenadasEnSanLuis(lat, lng) {
  return Number.isFinite(lat) && Number.isFinite(lng) &&
    lat >= LIMITES_SLP.latMin && lat <= LIMITES_SLP.latMax &&
    lng >= LIMITES_SLP.lngMin && lng <= LIMITES_SLP.lngMax;
}

export default function Solicitud() {
  const { usuario } = useAuth();
  const { state } = useLocation();
  const [lineas, setLineas] = useState([]);
  const [direccion, setDireccion] = useState(state?.origen || '');
  const [origenSeleccionado, setOrigenSeleccionado] = useState(null);
  const [destinoId, setDestinoId] = useState('itsslpc');
  const [comentario, setComentario] = useState('');
  const [coincidencias, setCoincidencias] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.lineas().then((datos) => {
      setLineas(datos);
      const estaciones = datos.flatMap((linea) => linea.estaciones || []);
      const destinoInicial = estaciones.find((estacion) =>
        estacion.id === state?.destino || estacion.nombre === state?.destino
      );
      if (destinoInicial) setDestinoId(destinoInicial.id);

      const origenInicial = estaciones.find((estacion) =>
        estacion.id === state?.origen || estacion.nombre === state?.origen
      );
      if (origenInicial) setDireccion(origenInicial.nombre);
    }).catch((err) => setError(err.message));
  }, [state?.destino, state?.origen]);

  const estaciones = useMemo(() => {
    const unicas = new Map();
    lineas.forEach((linea) => (linea.estaciones || []).forEach((estacion) => {
      if (!unicas.has(estacion.id)) unicas.set(estacion.id, estacion);
    }));
    return [...unicas.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }, [lineas]);

  if (!usuario) return <p>Para solicitar una ruta, <Link to="/login">inicia sesión</Link>.</p>;

  async function buscarPuntos(e) {
    e.preventDefault();
    setError('');
    setMensaje('');
    setCoincidencias([]);
    setOrigenSeleccionado(null);
    setBuscando(true);
    try {
      const resultados = await buscarDireccion(direccion);
      if (resultados.length === 0) setMensaje('No encontramos esa dirección. Prueba con otra referencia cercana.');
      setCoincidencias(resultados);
    } catch (err) {
      setError(err.message);
    } finally {
      setBuscando(false);
    }
  }

  function seleccionarPunto(punto) {
    if (!coordenadasEnSanLuis(punto.lat, punto.lng)) {
      setError('El punto elegido está fuera del área de San Luis Potosí. Elige otro resultado.');
      return;
    }
    const nombreCorto = punto.nombre.split(',')[0].trim() || direccion.trim();
    setOrigenSeleccionado({ nombre: nombreCorto, lat: punto.lat, lng: punto.lng });
    setCoincidencias([]);
    setError('');
    setMensaje('');
  }

  async function usarUbicacion() {
    setError('');
    setMensaje('');
    setCoincidencias([]);
    try {
      const punto = await obtenerUbicacion();
      if (!coordenadasEnSanLuis(punto.lat, punto.lng)) {
        throw new Error('Tu ubicación está fuera del área de San Luis Potosí.');
      }
      setDireccion('Mi ubicación actual');
      setOrigenSeleccionado({ nombre: 'Mi ubicación actual', lat: punto.lat, lng: punto.lng });
    } catch (err) {
      setError(err.message);
    }
  }

  async function enviar(e) {
    e.preventDefault();
    setError('');
    setMensaje('');
    if (!origenSeleccionado) {
      setError('Busca una dirección y selecciona uno de sus resultados, o usa tu ubicación.');
      return;
    }
    if (!destinoId) {
      setError('Selecciona una estación de destino.');
      return;
    }

    try {
      setEnviando(true);
      await api.crearSolicitud({
        origen: origenSeleccionado.nombre,
        origen_lat: origenSeleccionado.lat,
        origen_lng: origenSeleccionado.lng,
        destino_id: destinoId,
        comentario,
      });
      setMensaje('Listo, registramos tu solicitud. Gracias por ayudarnos a mejorar.');
      setComentario('');
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="solicitud">
      <form onSubmit={enviar}>
        <h1>Solicitar una ruta</h1>
        <label>
          Origen: busca una dirección
          <input
            value={direccion}
            onChange={(e) => {
              setDireccion(e.target.value);
              setOrigenSeleccionado(null);
              setCoincidencias([]);
              setMensaje('');
            }}
            placeholder="Ej. Colonia Satélite, San Luis Potosí"
            required
          />
        </label>
        <button type="button" onClick={buscarPuntos} disabled={buscando || !direccion.trim()}>
          {buscando ? 'Buscando dirección…' : 'Buscar dirección'}
        </button>
        <button type="button" onClick={usarUbicacion}>Usar mi ubicación actual</button>

        {origenSeleccionado && (
          <p className="aviso">Origen seleccionado: <strong>{origenSeleccionado.nombre}</strong></p>
        )}
        {coincidencias.length > 0 && (
          <ul aria-label="Resultados de direcciones encontradas">
            {coincidencias.map((punto, indice) => (
              <li key={`${punto.lat}-${punto.lng}-${indice}`}>
                <button type="button" onClick={() => seleccionarPunto(punto)}>{punto.nombre}</button>
              </li>
            ))}
          </ul>
        )}

        <label>
          Destino
          <select value={destinoId} onChange={(e) => setDestinoId(e.target.value)} required disabled={estaciones.length === 0}>
            <option value="">Elige una estación</option>
            {estaciones.map((estacion) => (
              <option key={estacion.id} value={estacion.id}>{estacion.nombre}</option>
            ))}
          </select>
        </label>
        <label>Comentario (opcional) <textarea value={comentario} onChange={(e) => setComentario(e.target.value)} /></label>
        {error && <p className="error" role="alert">{error}</p>}
        {mensaje && <p className="aviso" role="status">{mensaje}</p>}
        <button type="submit" disabled={!origenSeleccionado || !destinoId || enviando}>
          {enviando ? 'Enviando…' : 'Enviar solicitud'}
        </button>
      </form>
    </section>
  );
}
