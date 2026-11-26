/**
 * ARCHIVO: frontend/src/App.jsx
 * RESPONSABLE: COMPARTIDO: cada quien agrega solo su ruta y su enlace
 * QUÉ HACE: Navegación y rutas de la app (React Router).
 * REGLAS:
 *  - /admin solo se muestra a usuarios con rol 'admin' (el back igual valida; esto es solo para la interfaz).
 *  - Textos de la interfaz en español, claros y sin tecnicismos.
 */
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Planificador from './pages/Planificador.jsx';
import Login from './pages/Login.jsx';
import Solicitud from './pages/Solicitud.jsx';
import Admin from './pages/Admin.jsx';

export default function App() {
  const { usuario, cerrarSesion } = useAuth();
  const location = useLocation();
  return (
    <>
    {location.pathname !== '/login' && (
      <nav className="encabezado" aria-label="Navegación principal">
        <NavLink
          to="/"
          end
          className="encabezado__marca"
          aria-label="RuTec, ir a planear viaje"
        >
          <svg
            className="encabezado__icono"
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <path
              className="encabezado__icono-forma"
              d="M7 4.5h10A2.5 2.5 0 0 1 19.5 7v11.5h-15V7A2.5 2.5 0 0 1 7 4.5Z"
            />
            <path
              className="encabezado__icono-detalle"
              d="M7 7h10l1 4H6l1-4Z"
            />
            <circle className="encabezado__icono-detalle" cx="7.5" cy="14" r="0.8" />
            <circle className="encabezado__icono-detalle" cx="16.5" cy="14" r="0.8" />
            <path
              className="encabezado__icono-detalle"
              d="M10 13.5h4M10 16h4M6.5 18h11M8 20v0.5m8-.5v0.5"
            />
          </svg>

          <span className="encabezado__marca-texto">
            <strong>RuTec</strong>
            <small>MetroRed · ITSSLPC</small>
          </span>
        </NavLink>

        <div className="encabezado__enlaces">
          <NavLink to="/" end className="encabezado__enlace">
            Rutas
          </NavLink>
          {usuario?.rol !== 'admin' && (
            <NavLink to="/solicitar" className="encabezado__enlace">
              Solicitar
            </NavLink>
          )}
          {usuario?.rol === 'admin' && (
            <NavLink to="/admin" className="encabezado__enlace">
              Administrar
            </NavLink>
          )}
        </div>

        <div className="encabezado__cuenta">
          {usuario ? (
            <>
              <span className="encabezado__usuario">{usuario.nombre}</span>
              <button
                type="button"
                className="encabezado__salir"
                onClick={cerrarSesion}
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <NavLink to="/login" className="encabezado__enlace encabezado__entrar">
              Entrar
            </NavLink>
          )}
        </div>
      </nav>
      )}
      <main>
        <Routes>
          <Route path="/" element={<Planificador />} />
          <Route path="/login" element={<Login />} />
          <Route path="/solicitar" element={usuario?.rol === 'admin' ? <Navigate to="/admin" /> : <Solicitud />} />
          <Route path="/admin" element={usuario?.rol === 'admin' ? <Admin /> : <Navigate to="/" />} />
        </Routes>
      </main>
    </>
  );
}
