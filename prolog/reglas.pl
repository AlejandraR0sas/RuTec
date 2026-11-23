:- encoding(utf8).
/**
 * ARCHIVO: prolog/reglas.pl
 * RESPONSABLE: COMPARTIDO: rutas y tiempo → Ale (F1); siguiente camión y ocupación → Osiel (F3)
 * QUÉ HACE: Reglas del sistema experto: encontrar ruta con transbordos, estimar tiempo,
 *           calcular el siguiente camión y estimar la ocupación.
 *
 * REGLAS:
 *  - Aquí NO se escriben hechos de líneas/estaciones (eso va en conocimiento.pl).
 *  - No cambiar el nombre ni los argumentos de los predicados públicos sin avisar al equipo:
 *      mejor_ruta/3, tiempo_viaje/2, siguiente_camion/4, ocupacion/3, nombre_estacion/2, nombre_linea/2
 *  - Los parámetros de simulación (minutos por parada, horas pico) se ajustan SOLO aquí arriba.
 *  - Cada regla nueva lleva una prueba en pruebas.pl.
 *
 * PENDIENTE:
 *  - [ ] Ajustar horas pico a lo que se observe en la ruta del Tec.
 *  - [ ] Regla opcional: penalizar transbordos largos.
 */

% ---------- Parámetros simulados ----------
minutos_por_parada(2).
minutos_transbordo(6).

% ---------- Utilidades ----------
en_linea(L, E) :- estacion(L, _, E, _).

nombre_estacion(E, N) :- estacion(_, _, E, N), !.
nombre_linea(L, N)    :- linea(L, N).

% paradas_entre(+Linea, +A, +B, -N): cuántas paradas hay de A a B en esa línea
paradas_entre(L, A, B, N) :-
    estacion(L, N1, A, _),
    estacion(L, N2, B, _),
    N is abs(N1 - N2).

% ---------- Búsqueda de ruta ----------
% ruta(+Origen, +Destino, -Plan): Plan = [viaje(Linea, Desde, Hasta), ...]
% Un transbordo ocurre en una estación que pertenece a más de una línea.
% No se repite una línea en el mismo plan (así la búsqueda termina siempre).
ruta(O, D, Plan) :- ruta_(O, D, [], Plan).

ruta_(O, D, Usadas, [viaje(L, O, D)]) :-
    O \== D,
    en_linea(L, O), en_linea(L, D),
    \+ memberchk(L, Usadas).
ruta_(O, D, Usadas, [viaje(L, O, T) | Resto]) :-
    en_linea(L, O),
    \+ memberchk(L, Usadas),
    en_linea(L, T), T \== O, T \== D,
    en_linea(L2, T), L2 \== L,
    ruta_(T, D, [L | Usadas], Resto).

% tiempo_viaje(+Plan, -Minutos): paradas * min/parada + transbordos * min/transbordo
tiempo_viaje(Plan, Min) :-
    minutos_por_parada(MP),
    minutos_transbordo(MT),
    findall(P, ( member(viaje(L, A, B), Plan), paradas_entre(L, A, B, P) ), Ps),
    sum_list(Ps, TotalParadas),
    length(Plan, NViajes),
    Transb is NViajes - 1,
    Min is TotalParadas * MP + Transb * MT.

% mejor_ruta(+O, +D, -Plan): el plan de menor tiempo estimado. Falla si no hay ruta.
mejor_ruta(O, D, Mejor) :-
    findall(C-Plan, ( ruta(O, D, Plan), tiempo_viaje(Plan, C) ), Pares),
    Pares \== [],
    keysort(Pares, [_-Mejor | _]).

% ---------- Siguiente camión (SIMULADO) ----------
% siguiente_camion(+Linea, +Hora, +Min, -EnMinutos). Falla si la línea no está en servicio.
siguiente_camion(L, H, M, Espera) :-
    horario_servicio(L, Ini, Fin),
    frecuencia(L, F),
    Ahora is H * 60 + M,
    Ahora >= Ini, Ahora =< Fin,
    Rel is Ahora - Ini,
    Espera is (F - (Rel mod F)) mod F.

% ---------- Ocupación estimada (SIMULADA) ----------
dia_laboral(D) :- memberchk(D, [lunes, martes, miercoles, jueves, viernes]).

hora_pico(H) :-
    (   between(7, 9, H)
    ;   between(13, 15, H)
    ;   between(18, 20, H)
    ), !.

ocupacion(Dia, H, alta)  :- dia_laboral(Dia), hora_pico(H), !.
ocupacion(Dia, H, media) :- dia_laboral(Dia), between(10, 17, H), !.
ocupacion(_, _, baja).
% --- Horarios por tramo (F1 – Ale) ---
% proxima_salida(+L, +T, -S): primera salida de L desde el minuto T.
proxima_salida(L, T, S) :-
    horario_servicio(L, Ini, Fin),
    frecuencia(L, F),
    T >= Ini,
    T =< Fin,
    Indice is (T - Ini + F - 1) // F,
    S is Ini + Indice * F,
    S =< Fin.
% --- Horarios por tramo (F1 – Ale) ---
% proximas_salidas(+L, +S, +N, -Lista): hasta N salidas desde S, sin superar el cierre.
proximas_salidas(L, S, N, Lista) :-
    horario_servicio(L, Ini, Fin),
    frecuencia(L, F),
    integer(S),
    S >= Ini,
    integer(N),
    N >= 0,
    proximas_salidas_(S, Fin, N, F, Lista).

proximas_salidas_(_, _, 0, _, []) :-
    !.
proximas_salidas_(S, Fin, N, F, [S | Resto]) :-
    N > 0,
    S =< Fin,
    !,
    Siguiente is S + F,
    Restantes is N - 1,
    proximas_salidas_(Siguiente, Fin, Restantes, F, Resto).
proximas_salidas_(S, Fin, N, _, []) :-
    N > 0,
    S > Fin.