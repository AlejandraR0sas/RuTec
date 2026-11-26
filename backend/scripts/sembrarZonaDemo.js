/**
 * ARCHIVO: backend/scripts/sembrarZonaDemo.js
 * RESPONSABLE: Ale (F1 – demostración de zonas)
 * QUÉ HACE: Crea seis cuentas y solicitudes marcadas como datos de demostración.
 * IMPORTANTE: No ejecutar sin autorización; --borrar elimina únicamente documentos demo:true.
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Usuario = require('../src/models/Usuario');
const Solicitud = require('../src/models/Solicitud');
const { calcularZona } = require('../src/utils/geo');

const CORREOS_DEMO = Array.from({ length: 6 }, (_, indice) => `demo${indice + 1}@rutec.local`);
const PASSWORD_DEMO = 'MetroRedDemo123!';
const DESTINO_ID = 'itsslpc';
const DESTINO_NOMBRE = 'ITSSLPC (Tec Superior Capital)';
const LIMITES_SLP = { latMin: 21.9, latMax: 22.4, lngMin: -101.3, lngMax: -100.6 };

function argumento(nombre) {
  const indice = process.argv.indexOf(nombre);
  return indice < 0 ? undefined : process.argv[indice + 1];
}

function coordenadasValidas(lat, lng) {
  return Number.isFinite(lat) && Number.isFinite(lng) &&
    lat >= LIMITES_SLP.latMin && lat <= LIMITES_SLP.latMax &&
    lng >= LIMITES_SLP.lngMin && lng <= LIMITES_SLP.lngMax;
}

function puntosDeDemo(lat, lng) {
  const centroLat = Math.round(lat / 0.005) * 0.005;
  const centroLng = Math.round(lng / 0.005) * 0.005;
  const delta = 0.00025;
  const desplazamientos = [
    [-delta, -delta], [-delta, 0], [-delta, delta],
    [delta, -delta], [delta, 0], [delta, delta],
  ];
  return desplazamientos.map(([moverLat, moverLng]) => ({
    lat: Math.min(LIMITES_SLP.latMax, Math.max(LIMITES_SLP.latMin, centroLat + moverLat)),
    lng: Math.min(LIMITES_SLP.lngMax, Math.max(LIMITES_SLP.lngMin, centroLng + moverLng)),
  }));
}

async function borrarDemo() {
  const solicitudes = await Solicitud.deleteMany({ demo: true });
  const usuarios = await Usuario.deleteMany({ demo: true });
  console.log(`Datos demo eliminados: ${solicitudes.deletedCount} solicitudes y ${usuarios.deletedCount} cuentas.`);
}

async function sembrarDemo() {
  const lat = Number(argumento('--lat'));
  const lng = Number(argumento('--lng'));
  if (!coordenadasValidas(lat, lng)) {
    throw new Error('Indica --lat y --lng dentro del área permitida de San Luis Potosí.');
  }

  const existentes = await Usuario.find({ correo: { $in: CORREOS_DEMO } }).lean();
  const cuentaNoDemo = existentes.find((usuario) => usuario.demo !== true);
  if (cuentaNoDemo) {
    throw new Error(`La cuenta ${cuentaNoDemo.correo} ya existe y no está marcada como demo; no se modificó.`);
  }

  const zona = calcularZona(lat, lng);
  const puntos = puntosDeDemo(lat, lng);
  if (puntos.some((punto) => calcularZona(punto.lat, punto.lng) !== zona)) {
    throw new Error('No se pudieron generar puntos dentro de una misma zona.');
  }

  const existentesPorCorreo = new Map(existentes.map((usuario) => [usuario.correo, usuario]));
  const solicitudesConflictivas = await Solicitud.find({
    usuario: { $in: existentes.map((usuario) => usuario._id) },
    clave: `${zona}->${DESTINO_ID}`,
    demo: { $ne: true },
  }).lean();
  if (solicitudesConflictivas.length > 0) {
    throw new Error('Una solicitud existente no está marcada como demo; no se modificaron datos.');
  }

  const password_hash = await bcrypt.hash(PASSWORD_DEMO, 10);
  for (let indice = 0; indice < CORREOS_DEMO.length; indice += 1) {
    const correo = CORREOS_DEMO[indice];
    const nombre = `Estudiante demo ${indice + 1}`;
    let usuario = existentesPorCorreo.get(correo);

    if (usuario) {
      await Usuario.updateOne(
        { _id: usuario._id, demo: true },
        { $set: { nombre, password_hash, rol: 'estudiante' } }
      );
    } else {
      usuario = await Usuario.create({ nombre, correo, password_hash, rol: 'estudiante', demo: true });
    }

    const punto = puntos[indice];
    const clave = `${zona}->${DESTINO_ID}`;
    const solicitudDemo = await Solicitud.findOne({ usuario: usuario._id, clave, demo: true }) ||
      await Solicitud.findOne({ usuario: usuario._id, demo: true });
    const datosSolicitud = {
      usuario: usuario._id,
      origen: `Punto demo ${indice + 1}`,
      origen_lat: punto.lat,
      origen_lng: punto.lng,
      zona,
      destino: DESTINO_NOMBRE,
      destino_id: DESTINO_ID,
      comentario: 'Solicitud de demostración; no representa una solicitud real.',
      estado: 'pendiente',
      demo: true,
    };
    if (solicitudDemo) {
      await Solicitud.updateOne({ _id: solicitudDemo._id, demo: true }, { $set: { ...datosSolicitud, clave } });
    } else {
      await Solicitud.create({ ...datosSolicitud, clave });
    }
  }

  console.log(`Se prepararon 6 cuentas demo y 6 solicitudes en ${zona} hacia ${DESTINO_ID}.`);
  console.log(`Contraseña demo para las seis cuentas: ${PASSWORD_DEMO}`);
  console.log('Estos registros son ficticios y están marcados demo:true.');
}

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    if (process.argv.includes('--borrar')) await borrarDemo();
    else await sembrarDemo();
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  }
})();
