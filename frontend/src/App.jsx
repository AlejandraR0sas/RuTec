/**
 * ARCHIVO: frontend/src/App.jsx
 * RESPONSABLE: COMPARTIDO: cada quien agrega solo su ruta y su enlace
 * QUÉ HACE: Navegación y rutas de la app (React Router).
 * REGLAS:
 *  - /admin solo se muestra a usuarios con rol 'admin' (el back igual valida; esto es solo para la interfaz).
 *  - Textos de la interfaz en español, claros y sin tecnicismos.
 */
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';import { useAuth } from './context/AuthContext.jsx';
import Planificador from './pages/Planificador.jsx';
import Login from './pages/Login.jsx';
import Solicitud from './pages/Solicitud.jsx';
import Admin from './pages/Admin.jsx';

export default function App() {
  const { usuario, cerrarSesion } = useAuth();
  return (
    <>
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
            <path className="encabezado__icono-forma" d="M6 5.5h12a2 2 0 0 1 2 2v10H4v-10a2 2 0 0 1 2-2Z" />
            <path className="encabezado__icono-detalle" d="M5 12h14M7 8h10M7 18v1m10-1v1" />
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
          <NavLink to="/solicitar" className="encabezado__enlace">
            Solicitar
          </NavLink>
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
      <main>
        <Routes>
          <Route path="/" element={<Planificador />} />
          <Route path="/login" element={<Login />} />
          <Route path="/solicitar" element={<Solicitud />} />
          <Route path="/admin" element={usuario?.rol === 'admin' ? <Admin /> : <Navigate to="/" />} />
        </Routes>
      </main>
    </>
  );
}
