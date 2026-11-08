/**
 * ARCHIVO: frontend/src/pages/Login.jsx
 * RESPONSABLE: Persona C (Frontend)
 * QUÉ HACE: Iniciar sesión o crear cuenta (un solo formulario con dos modos).
 * REGLAS: errores del servidor se muestran tal cual (ya vienen legibles). Contraseña mínimo 8 caracteres.
 * PENDIENTE: [ ] Mejorar diseño y validaciones en el formulario
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { iniciarSesion, registrar } = useAuth();
  const [modoRegistro, setModoRegistro] = useState(false);
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navegar = useNavigate();

  async function enviar(e) {
    e.preventDefault();
    setError('');
    try {
      if (modoRegistro) await registrar(nombre, correo, password);
      else await iniciarSesion(correo, password);
      navegar('/');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form onSubmit={enviar}>
      <h1>{modoRegistro ? 'Crear cuenta' : 'Entrar'}</h1>
      {modoRegistro && (
        <label>Nombre <input value={nombre} onChange={(e) => setNombre(e.target.value)} required /></label>
      )}
      <label>Correo <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required /></label>
      <label>Contraseña <input type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
      {error && <p className="error">{error}</p>}
      <button type="submit">{modoRegistro ? 'Crear cuenta' : 'Entrar'}</button>{' '}
      <button type="button" onClick={() => setModoRegistro(!modoRegistro)}>
        {modoRegistro ? 'Ya tengo cuenta' : 'Crear cuenta nueva'}
      </button>
    </form>
  );
}
