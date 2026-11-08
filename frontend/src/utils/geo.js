/**
 * ARCHIVO: frontend/src/utils/geo.js
 * RESPONSABLE: Persona C (Frontend)
 * QUÉ HACE: Distancia entre dos puntos y estación más cercana (para "usar mi ubicación").
 */
export function distanciaKm(a, b) {
  const rad = (g) => (g * Math.PI) / 180;
  const R = 6371;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// coordenadas = { id: {lat, lng} }  →  devuelve el id de la estación más cercana (o null)
export function estacionMasCercana(punto, coordenadas) {
  let mejor = null;
  let min = Infinity;
  for (const [id, c] of Object.entries(coordenadas)) {
    const d = distanciaKm(punto, c);
    if (d < min) { min = d; mejor = id; }
  }
  return mejor;
}
