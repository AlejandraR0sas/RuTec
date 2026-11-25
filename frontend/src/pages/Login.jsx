/**
 * ARCHIVO: frontend/src/pages/Login.jsx
 * RESPONSABLE: Antulio (F2)
 * QUÉ HACE: Iniciar sesión o crear cuenta (un solo formulario con dos modos).
 * REGLAS: errores del servidor se muestran tal cual (ya vienen legibles). Contraseña mínimo 8 caracteres.
 * PENDIENTE: [ ] Mejorar diseño y validaciones en el formulario
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './Login.css';

export default function Login() {
  const { iniciarSesion, registrar } = useAuth();
  const [modoRegistro, setModoRegistro] = useState(false);
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmacion, setPasswordConfirmacion] = useState('');
  const [error, setError] = useState('');
  const navegar = useNavigate();
  const formularioLoginRef = useRef(null);
  const formularioRegistroRef = useRef(null);
  const campoLoginRef = useRef(null);
  const campoRegistroRef = useRef(null);
  const temporizadorFocoRef = useRef(null);

  useLayoutEffect(() => {
    if (formularioLoginRef.current) {
      formularioLoginRef.current.inert = modoRegistro;
    }

    if (formularioRegistroRef.current) {
      formularioRegistroRef.current.inert = !modoRegistro;
    }
  }, [modoRegistro]);

  useEffect(() => {
    return () => window.clearTimeout(temporizadorFocoRef.current);
  }, []);

  function alternarModo() {
  const siguienteModo = !modoRegistro;
  setModoRegistro(siguienteModo);
  setError('');
  window.clearTimeout(temporizadorFocoRef.current);

    const movimientoReducido = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    temporizadorFocoRef.current = window.setTimeout(() => {
      const campoInicial = siguienteModo ? campoRegistroRef : campoLoginRef;
      campoInicial.current?.focus();
    }, movimientoReducido ? 0 : 600);
  }
  async function enviar(e) {
    e.preventDefault();
    setError('');
    try {
    if (modoRegistro) {
      if (password !== passwordConfirmacion) {
          setError('Las contraseñas no coinciden.');
          return;
        }

        await registrar(nombre, correo, password);
      } else {
        await iniciarSesion(correo, password);
      }

      navegar('/');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="login">
          <Link className="login__volver" to="/">
      ← Volver al inicio
    </Link>
      <section
        className={`login__tarjeta ${modoRegistro ? 'login__tarjeta--registro' : ''}`}
      >
        <div className="login__formularios">
          <form
          ref={formularioLoginRef}
          aria-hidden={modoRegistro}
            className={`login__formulario ${
              modoRegistro ? 'login__formulario--oculto' : 'login__formulario--activo'
            }`}
            onSubmit={enviar}
          >
            <h1>Iniciar sesión</h1>

            <label htmlFor="login-correo">Correo</label>
            <input
              ref={campoLoginRef}
              id="login-correo"
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
            />

            <label htmlFor="login-password">Contraseña</label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

            {error && <p className="error" role="alert">{error}</p>}

            <button type="submit">Iniciar sesión</button>
          </form>

          <form
          ref={formularioRegistroRef}
          aria-hidden={!modoRegistro}
            className={`login__formulario ${
              modoRegistro ? 'login__formulario--activo' : 'login__formulario--oculto'
            }`}
            onSubmit={enviar}
          >
            <h1>Crear cuenta</h1>

            <label htmlFor="registro-nombre">Nombre</label>
              <input
                ref={campoRegistroRef}
                id="registro-nombre"
                value={nombre}
                onChange={(e) => {
                  const valor = e.target.value;

                  if (/^[\p{L}\p{M}\s'-]*$/u.test(valor)) {
                    setNombre(valor);
                  }
                }}
                required
              />
              <small>Escribe solo letras, espacios, guiones o apóstrofos.</small>

            <label htmlFor="registro-correo">Correo</label>
              <input
                id="registro-correo"
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
              />

            <label htmlFor="registro-password">Contraseña</label>
              <input
                id="registro-password"
                type="password"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <label htmlFor="registro-password-confirmacion">
                Confirmar contraseña
              </label>
              <input
                id="registro-password-confirmacion"
                type="password"
                minLength={8}
                value={passwordConfirmacion}
                onChange={(e) => setPasswordConfirmacion(e.target.value)}
                required
/>
            {error && <p className="error" role="alert">{error}</p>}

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
            onClick={alternarModo}
          >
            {modoRegistro ? 'Iniciar sesión' : 'Crear cuenta'}
          </button>
        </aside>
      </section>
    </div>
  );
}
