:- encoding(utf8).
/**
 * ARCHIVO: prolog/salida_json.pl
 * RESPONSABLE: COMPARTIDO: recomendar_json → Ale (F1); lineas_json → Osiel (F3)
 * QUÉ HACE: Convierte los resultados de reglas.pl a JSON para que el backend los lea.
 *
 * REGLAS:
 *  - El JSON de salida debe coincidir EXACTAMENTE con docs/API.md (sección "Recomendación" y "Líneas").
 *  - Imprimir SOLO el JSON en la salida estándar (nada de mensajes de depuración con format/print).
 *  - Si cambias una clave del JSON: actualizar docs/API.md y avisar al equipo.
 *
 * PENDIENTE:
 *  - [ ] Revisar que los acentos salgan bien en el JSON.
 */

:- use_module(library(http/json)).

% recomendar_json(+Origen, +Destino, +Hora, +Min, +Dia)
recomendar_json(O, D, H, M, Dia) :-
    (   \+ estacion(_, _, O, _)
    ->  Dict = _{encontrada: false, motivo: estacion_desconocida}
    ;   \+ estacion(_, _, D, _)
    ->  Dict = _{encontrada: false, motivo: estacion_desconocida}
    ;   O == D
    ->  Dict = _{encontrada: false, motivo: mismo_origen_destino}
    ;   mejor_ruta(O, D, Plan)
    ->  armar_respuesta(O, D, Plan, H, M, Dia, Dict)
    ;   Dict = _{encontrada: false, motivo: sin_ruta}
    ),
    json_write_dict(current_output, Dict, [width(0)]),
    nl.

armar_respuesta(O, D, Plan, H, M, Dia, Dict) :-
    nombre_estacion(O, NO),
    nombre_estacion(D, ND),
    plan_a_dicts(Plan, PlanDicts),
    length(Plan, N),
    Transbordos is N - 1,
    tiempo_viaje(Plan, Minutos),
    Plan = [viaje(L1, _, _) | _],
    (   siguiente_camion(L1, H, M, Espera)
    ->  frecuencia(L1, F),
        Sig = _{en_minutos: Espera, frecuencia_min: F}
    ;   Sig = null
    ),
    ocupacion(Dia, H, Ocup),
    Dict = _{ encontrada: true,
              origen:  _{id: O, nombre: NO},
              destino: _{id: D, nombre: ND},
              plan: PlanDicts,
              transbordos: Transbordos,
              minutos_estimados: Minutos,
              siguiente_camion: Sig,
              ocupacion: Ocup,
              simulado: true }.

plan_a_dicts([], []).
plan_a_dicts([viaje(L, A, B) | R], [Dict | R2]) :-
    nombre_linea(L, LN),
    nombre_estacion(A, NA),
    nombre_estacion(B, NB),
    paradas_entre(L, A, B, P),
    Dict = _{ linea: L, linea_nombre: LN,
              desde: A, desde_nombre: NA,
              hasta: B, hasta_nombre: NB,
              paradas: P },
    plan_a_dicts(R, R2).

% lineas_json: lista todas las líneas con sus estaciones en orden
lineas_json :-
    findall(Dict,
            ( linea(L, N),
              estaciones_de(L, Es),
              Dict = _{id: L, nombre: N, estaciones: Es} ),
            Ls),
    json_write_dict(current_output, Ls, [width(0)]),
    nl.

estaciones_de(L, Es) :-
    findall(O-D,
            ( estacion(L, O, E, EN), D = _{orden: O, id: E, nombre: EN} ),
            Pares),
    keysort(Pares, Ordenados),
    pairs_values(Ordenados, Es).
