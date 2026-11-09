/**
 * ARCHIVO: frontend/src/components/Mapa.jsx
 * RESPONSABLE: Osiel (F3)
 * QUÉ HACE: Mapa con Leaflet + OpenStreetMap, centrado en San Luis Potosí.
 * REGLAS:
 *  - Los marcadores usan las coordenadas de /api/coordenadas (clave = ID de estación).
 *  - Si una estación no tiene coordenadas, no se dibuja (no inventar posiciones).
 *  - Respetar la atribución de OpenStreetMap (ya viene en TileLayer).
 * PENDIENTE: [ ] Dibujar el recorrido  [ ] Resaltar origen/destino  [ ] Corregir el ícono por defecto de Leaflet con Vite
 */
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

const CENTRO_SLP = [22.1565, -100.9855];

export default function Mapa({ estaciones = [], coordenadas = {} }) {
  return (
    <MapContainer center={CENTRO_SLP} zoom={12} className="mapa">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {estaciones
        .filter((e) => coordenadas[e.id])
        .map((e) => (
          <Marker key={e.id} position={[coordenadas[e.id].lat, coordenadas[e.id].lng]}>
            <Popup>{e.nombre}</Popup>
          </Marker>
        ))}
    </MapContainer>
  );
}
