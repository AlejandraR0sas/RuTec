/**
 * ARCHIVO: frontend/src/services/apisPublicas.js
 * RESPONSABLE: Persona C (Frontend)
 * QUÉ HACE: Consumo de APIs PÚBLICAS (no son nuestro backend). ← parte de la materia Interacción con Servicios Web.
 * REGLAS:
 *  - Nominatim (OpenStreetMap): máximo 1 petición por segundo; buscar solo al presionar un botón, no en cada tecla.
 *  - Open-Meteo: no necesita llave.
 *  - Siempre manejar el caso de error (sin permiso de ubicación, sin internet).
 *  - Documentar en el README qué APIs públicas se usan.
 */

// 1) Geolocalización del navegador
export function obtenerUbicacion() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Tu navegador no permite obtener la ubicación'));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => reject(new Error('No pudimos obtener tu ubicación. Revisa el permiso del navegador.'))
    );
  });
}

// 2) Búsqueda de direcciones con Nominatim (limitada a México)
export async function buscarDireccion(texto) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=mx&q=${encodeURIComponent(texto + ', San Luis Potosí')}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error('No se pudo buscar la dirección');
  const datos = await resp.json();
  return datos.map((d) => ({ nombre: d.display_name, lat: Number(d.lat), lng: Number(d.lon) }));
}

// 3) Clima actual con Open-Meteo
export async function obtenerClima(lat, lng) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,precipitation`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error('No se pudo obtener el clima');
  return (await resp.json()).current;
}
