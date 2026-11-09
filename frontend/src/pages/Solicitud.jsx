/**
 * ARCHIVO: frontend/src/pages/Solicitud.jsx
 * RESPONSABLE: Antulio (F2)
 * QUÉ HACE: Formulario para solicitar una ruta que no existe. Llega con origen/destino ya llenos desde el Planificador.
 * REGLAS:
 *  - Solo usuarios logueados (si no, mandar a /login).
 *  - Si la API responde 409, mostrar "Ya solicitaste este trayecto".
 * PENDIENTE: [ ] Elegir origen/destino en el mapa o con Nominatim en vez de texto libre
 */
import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { api } from '../api/cliente.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Solicitud() {
  const { usuario } = useAuth();
  const { state } = useLocation();
  const [origen, setOrigen] = useState(state?.origen || '');
  const [destino, setDestino] = useState(state?.destino || '');
  const [comentario, setComentario] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  if (!usuario) return <p>Para solicitar una ruta, <Link to="/login">inicia sesión</Link>.</p>;

  async function enviar(e) {
    e.preventDefault();
    setError('');
    setMensaje('');
    try {
      await api.crearSolicitud(origen, destino, comentario);
      setMensaje('Listo, registramos tu solicitud. Gracias por ayudarnos a mejorar.');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form onSubmit={enviar}>
      <h1>Solicitar una ruta</h1>
      <label>Origen <input value={origen} onChange={(e) => setOrigen(e.target.value)} required /></label>
      <label>Destino <input value={destino} onChange={(e) => setDestino(e.target.value)} required /></label>
      <label>Comentario (opcional) <textarea value={comentario} onChange={(e) => setComentario(e.target.value)} /></label>
      {error && <p className="error">{error}</p>}
      {mensaje && <p className="aviso">{mensaje}</p>}
      <button type="submit">Enviar solicitud</button>
    </form>
  );
}
