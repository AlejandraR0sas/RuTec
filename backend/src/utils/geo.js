/**
 * ARCHIVO: backend/src/utils/geo.js
 * RESPONSABLE: Ale (F1 – análisis de zonas)
 * QUÉ HACE: Calcula la clave de zona y la distancia entre dos coordenadas.
 */
const TAMANO_CELDA = 0.005;
const RADIO_TIERRA_M = 6371000;

function calcularZona(lat, lng) {
  const fila = Math.round(lat / TAMANO_CELDA);
  const columna = Math.abs(Math.round(lng / TAMANO_CELDA));
  const hemisferio = lng < 0 ? 'n' : '';
  return `z${fila}_${hemisferio}${columna}`;
}

function distanciaMetros(lat1, lng1, lat2, lng2) {
  const radianes = (grados) => (grados * Math.PI) / 180;
  const diferenciaLat = radianes(lat2 - lat1);
  const diferenciaLng = radianes(lng2 - lng1);
  const a =
    Math.sin(diferenciaLat / 2) ** 2 +
    Math.cos(radianes(lat1)) * Math.cos(radianes(lat2)) *
    Math.sin(diferenciaLng / 2) ** 2;
  const arco = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return RADIO_TIERRA_M * arco;
}

module.exports = { calcularZona, distanciaMetros };
