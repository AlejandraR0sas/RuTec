:- encoding(utf8).
/**
 * ARCHIVO: prolog/pruebas.pl
 * RESPONSABLE: COMPARTIDO: pruebas de rutas → Ale (F1); tiempos y ocupación → Osiel (F3); rutas aprobadas → Antulio (F2)
 * QUÉ HACE: Pruebas unitarias del sistema experto.
 * CORRER:   swipl -g run_tests -t halt prolog/pruebas.pl
 *
 * REGLAS:
 *  - Cada regla nueva en reglas.pl necesita al menos una prueba aquí.
 *  - Antes de abrir un Pull Request, todas las pruebas deben pasar.
 */

:- use_module(library(plunit)).
:- consult(conocimiento).
:- consult(reglas).

:- begin_tests(rutas).

test(ida_alameda_a_tec) :-
    mejor_ruta(zt_alameda, itsslpc,
               [viaje(l1_a, zt_alameda, cetram), viaje(l1_b, cetram, itsslpc)]).

test(vuelta_tec_a_alameda) :-
    mejor_ruta(itsslpc, zt_alameda,
               [viaje(l1_b, itsslpc, cetram), viaje(l1_a, cetram, zt_alameda)]).

test(ruta_directa_sin_transbordo) :-
    mejor_ruta(pozos, zt_alameda, [viaje(l1_a, pozos, zt_alameda)]).

test(dos_transbordos_tec_a_ciudad_satelite) :-
    mejor_ruta(itsslpc, ciudad_satelite, Plan),
    length(Plan, 3).

test(sin_ruta_estacion_inexistente, [fail]) :-
    mejor_ruta(itsslpc, estacion_que_no_existe, _).

:- end_tests(rutas).

:- begin_tests(tiempos).

test(tiempo_ida_al_tec) :-
    mejor_ruta(zt_alameda, itsslpc, Plan),
    tiempo_viaje(Plan, 60).   % 27 paradas * 2 + 1 transbordo * 6

test(siguiente_camion_en_horario) :-
    siguiente_camion(l1_a, 7, 4, E),   % 07:04, frecuencia 10, inicia 05:30
    integer(E).

test(fuera_de_servicio, [fail]) :-
    siguiente_camion(l1_a, 3, 0, _).

:- end_tests(tiempos).

:- begin_tests(ocupacion).

test(pico_entre_semana)  :- ocupacion(lunes, 8, alta).
test(media_entre_semana) :- ocupacion(martes, 11, media).
test(baja_fin_de_semana) :- ocupacion(domingo, 8, baja).

:- end_tests(ocupacion).
% --- Horarios por tramo (F1 – Ale) ---
:- begin_tests(horarios_por_tramo).

test(proxima_salida_hora_exacta) :-
    proxima_salida(l1_a, 450, 450).

test(proxima_salida_siguiente_intervalo) :-
    proxima_salida(l1_a, 454, 460).

test(proxima_salida_l1_b_despues_transbordo) :-
    proxima_salida(l1_b, 506, 510).

test(proxima_salida_antes_de_apertura, [fail]) :-
    proxima_salida(l1_a, 180, _).

test(proxima_salida_despues_del_cierre, [fail]) :-
    proxima_salida(l1_a, 1321, _).

:- end_tests(horarios_por_tramo).