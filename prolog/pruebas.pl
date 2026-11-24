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
% --- Horarios por tramo (F1 – Ale) ---
:- begin_tests(proximas_salidas).

test(proximas_salidas_l1_a_tres) :-
    proximas_salidas(l1_a, 450, 3, [450, 460, 470]).

test(proximas_salidas_l1_b_tres) :-
    proximas_salidas(l1_b, 510, 3, [510, 525, 540]).

test(proximas_salidas_hasta_el_cierre) :-
    proximas_salidas(l1_a, 1310, 3, [1310, 1320]).

test(proximas_salidas_cero_solicitadas) :-
    proximas_salidas(l1_a, 450, 0, []).

test(proximas_salidas_despues_del_cierre) :-
    proximas_salidas(l1_a, 1321, 3, []).

:- end_tests(proximas_salidas).
% --- Horarios por tramo (F1 – Ale) ---
:- begin_tests(horarios_plan).

test(horarios_plan_ida_al_tec) :-
    Plan = [
        viaje(l1_a, zt_alameda, cetram),
        viaje(l1_b, cetram, itsslpc)
    ],
    horarios_plan(Plan, 450, [
        tramo(l1_a, 450, 0, [450, 460, 470], 500),
        tramo(l1_b, 510, 4, [510, 525, 540], 514)
    ]),
    llegada_plan([
        tramo(l1_a, 450, 0, [450, 460, 470], 500),
        tramo(l1_b, 510, 4, [510, 525, 540], 514)
    ], 514).

test(horarios_plan_todo_fuera_de_servicio) :-
    Plan = [
        viaje(l1_a, zt_alameda, cetram),
        viaje(l1_b, cetram, itsslpc)
    ],
    horarios_plan(Plan, 180, [
        sin_servicio(l1_a),
        sin_servicio(l1_b)
    ]),
    llegada_plan([sin_servicio(l1_a), sin_servicio(l1_b)], null).

test(horarios_plan_segundo_tramo_fuera_de_servicio) :-
    Plan = [
        viaje(l1_a, zt_alameda, cetram),
        viaje(l1_b, cetram, itsslpc)
    ],
    horarios_plan(Plan, 1310, [
        tramo(l1_a, 1310, 0, [1310, 1320], 1360),
        sin_servicio(l1_b)
    ]),
    llegada_plan([
        tramo(l1_a, 1310, 0, [1310, 1320], 1360),
        sin_servicio(l1_b)
    ], null).

:- end_tests(horarios_plan).
:- consult(salida_json).

% --- Horarios por tramo (F1 – Ale) ---
:- begin_tests(formato_hora).

test(minutos_a_hora_con_ceros) :-
    minutos_a_hora(450, '07:30'),
    minutos_a_hora(5, '00:05').

test(minutos_a_hora_despues_de_un_dia) :-
    minutos_a_hora(1445, '00:05').

:- end_tests(formato_hora).
% --- Clima simulado (F1 – Ale) ---
:- begin_tests(clima_simulado).

test(lluvia_inicio_primer_intervalo) :-
    lluvia(840).

test(lluvia_fin_primer_intervalo) :-
    lluvia(959).

test(lluvia_despues_primer_intervalo, [fail]) :-
    lluvia(960).

test(lluvia_antes_primer_intervalo, [fail]) :-
    lluvia(839).

test(lluvia_inicio_segundo_intervalo) :-
    lluvia(1080).

test(lluvia_fin_segundo_intervalo) :-
    lluvia(1169).

test(lluvia_despues_segundo_intervalo, [fail]) :-
    lluvia(1170).

test(lluvia_madrugada, [fail]) :-
    lluvia(180).

:- end_tests(clima_simulado).
% --- Clima simulado (F1 – Ale) ---
:- begin_tests(retraso_lluvia).

test(retraso_lluvia_diez) :-
    retraso_lluvia(10).

:- end_tests(retraso_lluvia).
% --- Clima simulado (F1 – Ale) ---
:- begin_tests(ajustar_ocupacion).

test(lluvia_subir_baja_a_media) :-
    ajustar_ocupacion(true, baja, media).

test(lluvia_subir_media_a_alta) :-
    ajustar_ocupacion(true, media, alta).

test(lluvia_mantener_alta) :-
    ajustar_ocupacion(true, alta, alta).

test(sin_lluvia_conservar_baja) :-
    ajustar_ocupacion(false, baja, baja).

:- end_tests(ajustar_ocupacion).
% --- Clima simulado (F1 – Ale) ---
:- begin_tests(clima_json).

test(clima_sabado_1430) :-
    with_output_to(atom(JSON),
    recomendar_json(zt_alameda, itsslpc, 14, 30, sabado)),
    atom_json_dict(JSON, Respuesta, []),
    get_dict(clima, Respuesta, Clima),
    get_dict(lluvia, Clima, true),
    get_dict(retraso_extra_min, Clima, 10),
    get_dict(ocupacion, Respuesta, "media").

test(clima_lunes_1100) :-
    with_output_to(atom(JSON),
        recomendar_json(zt_alameda, itsslpc, 11, 0, lunes)),
    atom_json_dict(JSON, Respuesta, []),
    get_dict(clima, Respuesta, Clima),
    get_dict(lluvia, Clima, false),
    get_dict(retraso_extra_min, Clima, 0),
    get_dict(ocupacion, Respuesta, "media").

:- end_tests(clima_json).