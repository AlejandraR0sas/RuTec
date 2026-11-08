/**
 * ARCHIVO: backend/src/services/prologService.js
 * RESPONSABLE: Persona B (Backend) — acordar el formato de salida con Persona A
 * QUÉ HACE: Puente Node ↔ Prolog. Ejecuta `swipl` con argumentos y lee el JSON que imprime.
 *           También regenera prolog/rutas_aprobadas.pl cuando el admin aprueba una ruta.
 *
 * REGLAS:
 *  - Se usa execFile (NO exec) y los argumentos van en arreglo: así nadie puede inyectar comandos.
 *  - Antes de llamar a Prolog, los controladores validan los IDs con /^[a-z][a-z0-9_]*$/.
 *  - Prolog solo debe imprimir JSON. Si no es JSON válido, se lanza un error.
 *  - El archivo rutas_aprobadas.pl es GENERADO: nadie lo edita a mano.
 *
 * PENDIENTE:
 *  - [ ] Probar con swipl real (nadie lo ha corrido todavía).
 *  - [ ] Si se vuelve lento, evaluar un servidor Prolog persistente en vez de un proceso por consulta.
 */
const { execFile } = require('child_process');
const fs = require('fs/promises');
const path = require('path');
const RutaAprobada = require('../models/RutaAprobada');

const DIR_PROLOG = path.join(__dirname, '../../../prolog');
const SWIPL = process.env.SWIPL_PATH || 'swipl';

function ejecutar(args) {
  return new Promise((resolve, reject) => {
    const argumentos = ['-q', '-s', path.join(DIR_PROLOG, 'main.pl'), '-g', 'main', '-t', 'halt', '--', ...args];
    execFile(SWIPL, argumentos, { timeout: 5000, encoding: 'utf8' }, (err, stdout, stderr) => {
      if (err) return reject(new Error(`Prolog falló: ${stderr || err.message}`));
      try {
        resolve(JSON.parse(stdout));
      } catch {
        reject(new Error(`Prolog no devolvió JSON válido: ${stdout.slice(0, 200)}`));
      }
    });
  });
}

function recomendar({ origen, destino, hora, minuto, dia }) {
  return ejecutar(['recomendar', origen, destino, String(hora), String(minuto), dia]);
}

function lineas() {
  return ejecutar(['lineas']);
}

const esc = (s) => String(s).replace(/[\r\n]/g, ' ').replace(/\\/g, '\\\\').replace(/'/g, "\\'");

// Convierte las rutas aprobadas de MongoDB a hechos de Prolog
async function regenerarRutasAprobadas() {
  const rutas = await RutaAprobada.find().lean();
  let out =
    '% ARCHIVO GENERADO por el backend (prologService.js). NO EDITAR A MANO.\n' +
    ':- encoding(utf8).\n' +
    ':- multifile linea/2, estacion/4, frecuencia/2, horario_servicio/3.\n\n';
  for (const r of rutas) {
    const id = `ra_${r._id}`;
    out += `linea(${id}, '${esc(r.nombre)}').\n`;
    out += `frecuencia(${id}, 15).\n`;
    out += `horario_servicio(${id}, 330, 1320).\n`;
    r.estaciones.forEach((e, i) => {
      out += `estacion(${id}, ${i + 1}, ${e.id}, '${esc(e.nombre)}').\n`;
    });
    out += '\n';
  }
  await fs.writeFile(path.join(DIR_PROLOG, 'rutas_aprobadas.pl'), out, 'utf8');
}

module.exports = { recomendar, lineas, regenerarRutasAprobadas };
