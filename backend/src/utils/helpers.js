/**
 * ARCHIVO: backend/src/utils/helpers.js
 * RESPONSABLE: Persona B (Backend)
 * QUÉ HACE: Funciones pequeñas compartidas (texto y fecha/hora de México).
 */
const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

function quitarAcentos(texto) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function normalizar(texto) {
  return quitarAcentos(String(texto)).toLowerCase().replace(/\s+/g, ' ').trim();
}

function claveTrayecto(origen, destino) {
  return `${normalizar(origen)}->${normalizar(destino)}`;
}

// Hora y día actuales en la zona de México (para cuando el front no manda hora)
function ahoraMX() {
  const fmt = new Intl.DateTimeFormat('es-MX', {
    timeZone: 'America/Mexico_City',
    weekday: 'long',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  });
  const p = Object.fromEntries(fmt.formatToParts(new Date()).map((x) => [x.type, x.value]));
  return { dia: quitarAcentos(p.weekday.toLowerCase()), hora: Number(p.hour), minuto: Number(p.minute) };
}

module.exports = { DIAS, quitarAcentos, normalizar, claveTrayecto, ahoraMX };
