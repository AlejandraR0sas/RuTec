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
 *  - [ ] "Usar mi ubicación": estación más cercana (services/apisPublicas.js + utils/geo.js).
 *  - [ ] Buscar dirección con Nominatim para origen/destino que no sean estaciones.
 *  - [ ] Mostrar el clima (Open-Meteo).
 *  - [ ] Dibujar el recorrido en el mapa.
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/cliente.js';
import Mapa from '../components/Mapa.jsx';
import ResultadoRuta from '../components/ResultadoRuta.jsx';

export default function Planificador() {
  const [lineas, setLineas] = useState([]);
  const [coords, setCoords] = useState({});
  const [origen, setOrigen] = useState('');
  const [destino, setDestino] = useState('');
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');
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
    try {
      setResultado(await api.recomendar(origen, destino));
    } catch (err) {
      setError(err.message);
    }
  }

  const nombreDe = (id) => estaciones.find((x) => x.id === id)?.nombre || id;

  return (
    <>
      <h1>¿A dónde vas?</h1>
      <form onSubmit={buscar}>
        <label>
          Origen
          <select value={origen} onChange={(e) => setOrigen(e.target.value)} required>
            <option value="">Elige una estación</option>
            {estaciones.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </label>
        <label>
          Destino
          <select value={destino} onChange={(e) => setDestino(e.target.value)} required>
            <option value="">Elige una estación</option>
            {estaciones.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </label>
        <button
          type="button"
          className="planificador__invertir"
          onClick={() => {
            setOrigen(destino);
            setDestino(origen);
            setResultado(null);
          }}
        >
          Invertir (regreso a casa)
        </button>
        <button type="submit">Buscar ruta</button>
      </form>

      {error && <p className="error">{error}</p>}
      <Mapa estaciones={estaciones} coordenadas={coords} />
      {resultado && <ResultadoRuta resultado={resultado} />}
      {resultado && !resultado.encontrada && resultado.puede_solicitar && (
        <button onClick={() => navegar('/solicitar', { state: { origen: nombreDe(origen), destino: nombreDe(destino) } })}>
          Solicitar esta ruta
        </button>
      )}
    </>
  );
}
