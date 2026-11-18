:- encoding(utf8).
/**
 * ARCHIVO: prolog/conocimiento.pl
 * RESPONSABLE: Osiel (F3)
 * QUÉ HACE: Base de conocimiento = HECHOS (líneas, estaciones, frecuencias, horarios).
 *           Aquí NO va lógica; la lógica va en reglas.pl.
 *
 * REGLAS:
 *  - Los IDs (l1_a, zt_alameda, cetram...) son snake_case, minúsculas, sin acentos. Ver README §8.
 *  - Una estación compartida entre líneas (ej. zt_alameda) usa EL MISMO ID y el MISMO nombre en cada línea.
 *    Así Prolog detecta solo los transbordos.
 *  - estacion(Linea, Orden, Id, Nombre): Orden empieza en 1 y es consecutivo, sin huecos.
 *  - Todos los hechos de estacion/4 van juntos (sin otros predicados en medio).
 *  - Fuente: mapas oficiales SCT / mi RedMetro. Si agregas algo por observación propia, anótalo en comentario.
 *  - Frecuencias y horarios son SIMULADOS.
 *
 * PENDIENTE:
 *  - [x] Registrar la extensión L1 hacia Noria de San José e ITSSLPC según la guía de TV Azteca (23/07/2026).
 *  - [ ] Verificar que la extensión siga operando y confirmar las ubicaciones exactas de CETRAM, Noria de San José e ITSSLPC.
 *  - [ ] Ajustar frecuencias y horarios con observación real.
 *  - [ ] (Backlog) Modelar L3 circular.
 */

% rutas_aprobadas.pl (generado por el backend) agrega hechos a estos mismos predicados
:- multifile linea/2, estacion/4, frecuencia/2, horario_servicio/3.

% ---------- Líneas: linea(Id, NombreVisible) ----------
linea(l1_a, 'L1 Eje 128 – Alameda').
linea(l1_b, 'L1 Extensión CETRAM – ITSSLPC').
linea(l2,   'L2 Los Salazares').
linea(l4,   'L4 Valle de los Fantasmas').

% ---------- Frecuencia en minutos (SIMULADA): frecuencia(Linea, Min) ----------
frecuencia(l1_a, 10).
frecuencia(l1_b, 15).
frecuencia(l2,   12).
frecuencia(l4,   15).

% ---------- Horario de servicio en minutos desde las 00:00 (SIMULADO) ----------
% 330 = 05:30, 1320 = 22:00
horario_servicio(l1_a, 330, 1320).
horario_servicio(l1_b, 330, 1320).
horario_servicio(l2,   330, 1320).
horario_servicio(l4,   330, 1320).

% ---------- Estaciones: estacion(Linea, Orden, Id, Nombre) ----------

% L1-A: Alameda → CETRAM (mapa oficial "Línea 1 Eje 128 – Alameda")
estacion(l1_a,  1, zt_alameda,      'Zona de Transferencia Alameda').
estacion(l1_a,  2, pipila,          'Pípila').
estacion(l1_a,  3, juan_sarabia,    'Juan Sarabia').
estacion(l1_a,  4, plaza_de_toros,  'Plaza de Toros').
estacion(l1_a,  5, av_universidad,  'Av. Universidad').
estacion(l1_a,  6, ttp,             'TTP').
estacion(l1_a,  7, rutilo_torres,   'Rutilo Torres').
estacion(l1_a,  8, valle_dorado,    'Valle Dorado').
estacion(l1_a,  9, jardines_del_sur,'Jardines del Sur').
estacion(l1_a, 10, cree,            'CREE').
estacion(l1_a, 11, jose_de_galvez,  'José de Gálvez').
estacion(l1_a, 12, sendero,         'Sendero').
estacion(l1_a, 13, eje_102,         'Eje 102').
estacion(l1_a, 14, eje_104,         'Eje 104').
estacion(l1_a, 15, eje_106,         'Eje 106').
estacion(l1_a, 16, eje_108,         'Eje 108').
estacion(l1_a, 17, eje_110,         'Eje 110').
estacion(l1_a, 18, eje_114,         'Eje 114').
estacion(l1_a, 19, eje_116,         'Eje 116').
estacion(l1_a, 20, eje_118,         'Eje 118').
estacion(l1_a, 21, eje_120,         'Eje 120').
estacion(l1_a, 22, eje_122,         'Eje 122').
estacion(l1_a, 23, eje_124,         'Eje 124').
estacion(l1_a, 24, pozos,           'Pozos').
estacion(l1_a, 25, eje_126,         'Eje 126').
estacion(l1_a, 26, cetram,          'CETRAM').

% Extensión L1 desde CETRAM hacia Noria de San José e ITSSLPC.
% Fuente: TV Azteca, publicada 23/07/2026. No aparece en el esquema gráfico metropolitano SCT;
% verificar operación vigente y posiciones exactas antes de asignar coordenadas.
estacion(l1_b,  1, cetram,          'CETRAM').
estacion(l1_b,  2, noria_de_san_jose,'Noria de San José').
estacion(l1_b,  3, itsslpc,         'ITSSLPC (Tec Superior Capital)').

% L2: Alameda → Los Salazares. Lista publicada por Antena San Luis (16/08/2024).
estacion(l2,  1, zt_alameda,        'Zona de Transferencia Alameda').
estacion(l2,  2, ignacio_altamirano,'Ignacio Altamirano').
estacion(l2,  3, barrio_de_tlaxcala,'Barrio de Tlaxcala').
estacion(l2,  4, ponciano_arriaga,  'Ponciano Arriaga').
estacion(l2,  5, caracol,           'Caracol').
estacion(l2,  6, santiago,          'Santiago').
estacion(l2,  7, juan_del_jarro,    'Juan del Jarro').
estacion(l2,  8, temazcalli,        'Temazcalli').
estacion(l2,  9, tangamanga_ii,     'Tangamanga II').
estacion(l2, 10, auditorio,         'Auditorio').
estacion(l2, 11, vasco_de_quiroga,  'Vasco de Quiroga').
estacion(l2, 12, panteon,           'Panteón').
estacion(l2, 13, utan,              'UTAN').
estacion(l2, 14, centauro_del_norte,'Centauro del Norte').
estacion(l2, 15, saucito,           'Saucito').
estacion(l2, 16, san_pedro,         'San Pedro').
estacion(l2, 17, humboldt,          'Humboldt').
estacion(l2, 18, el_rosedal,        'El Rosedal').
estacion(l2, 19, condado_del_sauzal,'Condado del Sauzal').
estacion(l2, 20, san_angelin,       'San Angelín').
estacion(l2, 21, wenceslao,         'Wenceslao').
estacion(l2, 22, zt_salazares,      'Zona de Transferencia Los Salazares').

% L4: Alameda → Ciudad Satélite. Lista TV Azteca, publicada 23/07/2026.
% OJO: "Tecnológico de San Luis" (tec_san_luis) es el OTRO Tec (ITSLP), no el ITSSLPC.
estacion(l4,  1, zt_alameda,        'Zona de Transferencia Alameda').
estacion(l4,  2, distribuidor_juarez,'Distribuidor Benito Juárez').
estacion(l4,  3, av_de_los_pinos,   'Av. de los Pinos').
estacion(l4,  4, tec_san_luis,      'Tecnológico de San Luis').
estacion(l4,  5, circuito_potosi,   'Circuito Potosí').
estacion(l4,  6, privadas_de_la_hacienda,'Privadas de la Hacienda').
estacion(l4,  7, los_gomez,         'Los Gómez').
estacion(l4,  8, cactus,            'Cactus').
estacion(l4,  9, bosques_de_la_florida,'Bosques de la Florida').
estacion(l4, 10, san_nicolas_de_los_jassos,'San Nicolás de los Jassos').
estacion(l4, 11, ciudad_satelite,   'Ciudad Satélite').
