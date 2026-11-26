/**
 * ARCHIVO: frontend/src/services/apisPublicas.js
 * RESPONSABLE: Osiel (F3)
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

/// 2) Búsqueda de direcciones y nombres de ubicación con Nominatim
let ultimaBusquedaNominatim = 0;
let colaNominatim = Promise.resolve();

async function esperarTurnoNominatim() {
  const turnoAnterior = colaNominatim;
  let liberarTurno;

  colaNominatim = new Promise((resolve) => {
    liberarTurno = resolve;
  });

  await turnoAnterior;

  try {
    const espera = Math.max(0, 1000 - (Date.now() - ultimaBusquedaNominatim));
    if (espera) await new Promise((resolve) => setTimeout(resolve, espera));
    ultimaBusquedaNominatim = Date.now();
  } finally {
    liberarTurno();
  }
}

export async function buscarDireccion(texto) {
  const consulta = texto.trim();
  if (!consulta) throw new Error('Escribe una dirección para buscarla.');

  await esperarTurnoNominatim();

  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=mx&q=${encodeURIComponent(consulta + ', San Luis Potosí')}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error('No se pudo buscar la dirección');

  const datos = await resp.json();
  return datos.map((d) => ({
    nombre: d.display_name,
    lat: Number(d.lat),
    lng: Number(d.lon),
  }));
}

export async function buscarNombreUbicacion(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error('Las coordenadas de la ubicación no son válidas.');
  }

  await esperarTurnoNominatim();

  const parametros = new URLSearchParams({
    format: 'jsonv2',
    lat: String(lat),
    lon: String(lng),
    zoom: '18',
    addressdetails: '1',
    'accept-language': 'es',
  });
  const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?${parametros}`);

  if (!resp.ok) throw new Error('No se pudo identificar esta ubicación.');

  const dato = await resp.json();
  const direccion = dato.address || {};
  const zona = direccion.neighbourhood
    || direccion.suburb
    || direccion.quarter
    || direccion.city_district;

  const partes = [direccion.road, zona].filter(Boolean);
  const nombre = partes.join(', ')
    || dato.display_name?.split(',').slice(0, 2).join(', ').trim();

  return nombre || null;
}

// 3) Clima actual con Open-Meteo
export async function obtenerClima(lat, lng) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,precipitation`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error('No se pudo obtener el clima');
  return (await resp.json()).current;
}
