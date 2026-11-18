/**
 * ARCHIVO: frontend/src/components/Mapa.jsx
 * RESPONSABLE: Osiel (F3)
 * QUÉ HACE: Mapa con Leaflet + OpenStreetMap, centrado en San Luis Potosí.
 * REGLAS:
 *  - Los marcadores usan las coordenadas de /api/coordenadas (clave = ID de estación).
 *  - Si una estación no tiene coordenadas, no se dibuja (no inventar posiciones).
 *  - Respetar la atribución de OpenStreetMap (ya viene en TileLayer).
 * PENDIENTE: [x] Dibujar el recorrido al tener coordenadas completas  [ ] Resaltar origen/destino  [x] Corregir el ícono por defecto de Leaflet con Vite
 */
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

const CENTRO_SLP = [22.1565, -100.9855];
const iconoEstacion = new L.Icon({
  iconUrl, iconRetinaUrl, shadowUrl,
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

export default function Mapa({ estaciones = [], coordenadas = {}, lineas = [], resultado = null }) {
  const trayectos = resultado?.encontrada
    ? resultado.plan.map((tramo) => {
      const linea = lineas.find((l) => l.id === tramo.linea);
      if (!linea) return [];
      const inicio = linea.estaciones.findIndex((e) => e.id === tramo.desde);
      const fin = linea.estaciones.findIndex((e) => e.id === tramo.hasta);
      if (inicio < 0 || fin < 0) return [];
      const paso = inicio <= fin ? 1 : -1;
      const tramoEstaciones = linea.estaciones.slice(Math.min(inicio, fin), Math.max(inicio, fin) + 1);
      const estacionesEnOrden = paso < 0 ? tramoEstaciones.reverse() : tramoEstaciones;
      if (!estacionesEnOrden.every((e) => coordenadas[e.id])) return [];
      return estacionesEnOrden
        .map((e) => [coordenadas[e.id].lat, coordenadas[e.id].lng]);
    }).filter((puntos) => puntos.length > 1)
    : [];

  return (
    <MapContainer center={CENTRO_SLP} zoom={12} className="mapa">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {estaciones
        .filter((e) => coordenadas[e.id])
        .map((e) => (
          <Marker key={e.id} icon={iconoEstacion} position={[coordenadas[e.id].lat, coordenadas[e.id].lng]}>
            <Popup>{e.nombre}</Popup>
          </Marker>
        ))}
      {trayectos.map((puntos, i) => <Polyline key={`${i}-${puntos.length}`} positions={puntos} />)}
    </MapContainer>
  );
}
