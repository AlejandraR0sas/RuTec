/**
 * ARCHIVO: frontend/src/App.jsx
 * RESPONSABLE: COMPARTIDO: cada quien agrega solo su ruta y su enlace
 * QUÉ HACE: Navegación y rutas de la app (React Router).
 * REGLAS:
 *  - /admin solo se muestra a usuarios con rol 'admin' (el back igual valida; esto es solo para la interfaz).
 *  - Textos de la interfaz en español, claros y sin tecnicismos.
 */
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Planificador from './pages/Planificador.jsx';
import Login from './pages/Login.jsx';
import Solicitud from './pages/Solicitud.jsx';
import Admin from './pages/Admin.jsx';

export default function App() {
  const { usuario, cerrarSesion } = useAuth();
  return (
    <>
      <nav>
        <strong>RuTec</strong>
        <Link to="/">Planear viaje</Link>
        <Link to="/solicitar">Solicitar ruta</Link>
        {usuario?.rol === 'admin' && <Link to="/admin">Administrar</Link>}
        <span className="espacio" />
        {usuario ? (
          <>
            <span>{usuario.nombre}</span>
            <button onClick={cerrarSesion}>Cerrar sesión</button>
          </>
        ) : (
          <Link to="/login">Entrar</Link>
        )}
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
