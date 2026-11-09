/**
 * ARCHIVO: frontend/src/context/AuthContext.jsx
 * RESPONSABLE: Antulio (F2)
 * QUÉ HACE: Guarda quién está logueado (la sesión vive en el servidor; aquí solo se refleja).
 * REGLAS: al cargar la app se pregunta a /api/auth/yo. No guardar contraseñas ni tokens en el navegador.
 */
import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/cliente.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.yo().then((d) => setUsuario(d.usuario)).catch(() => setUsuario(null)).finally(() => setCargando(false));
  }, []);

  const iniciarSesion = async (correo, password) => setUsuario((await api.login(correo, password)).usuario);
  const registrar = async (nombre, correo, password) => setUsuario((await api.registro(nombre, correo, password)).usuario);
  const cerrarSesion = async () => {
    await api.logout();
    setUsuario(null);
  };

  if (cargando) return null;
  return <AuthContext.Provider value={{ usuario, iniciarSesion, registrar, cerrarSesion }}>{children}</AuthContext.Provider>;
}
