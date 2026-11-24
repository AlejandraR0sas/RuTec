/**
 * ARCHIVO: frontend/src/pages/Login.jsx
 * RESPONSABLE: Antulio (F2)
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
    <main className="login">
      <section className="login__tarjeta">
        <div className="login__formularios">
          <form
            className="login__formulario"
            onSubmit={enviar}
            hidden={modoRegistro}
          >
            <h1>Iniciar sesión</h1>

            <label>
              Correo
              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
              />
            </label>

            <label>
              Contraseña
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            {error && <p className="error">{error}</p>}

            <button type="submit">Iniciar sesión</button>
          </form>

          <form
            className="login__formulario"
            onSubmit={enviar}
            hidden={!modoRegistro}
          >
            <h1>Crear cuenta</h1>

            <label>
              Nombre
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </label>

            <label>
              Correo
              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
              />
            </label>

            <label>
              Contraseña
              <input
                type="password"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            {error && <p className="error">{error}</p>}

            <button type="submit">Crear cuenta</button>
          </form>
        </div>

        <aside className="login__panel">
          <h2>
            {modoRegistro ? '¡Qué bueno verte de nuevo!' : '¿Aún no tienes cuenta?'}
          </h2>
          <p>
            {modoRegistro
              ? 'Inicia sesión para planear tu viaje en RuTec.'
              : 'Crea tu cuenta para usar las funciones de RuTec.'}
          </p>
          <button
            type="button"
            onClick={() => setModoRegistro(!modoRegistro)}
          >
            {modoRegistro ? 'Iniciar sesión' : 'Crear cuenta'}
          </button>
        </aside>
      </section>
    </main>
  );
}
