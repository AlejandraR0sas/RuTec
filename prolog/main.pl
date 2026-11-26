:- encoding(utf8).
/**
 * ARCHIVO: prolog/main.pl
 * RESPONSABLE: Ale (F1)
 * QUÉ HACE: Punto de entrada. El backend lo ejecuta así:
 *     swipl -q -s prolog/main.pl -g main -t halt -- recomendar ORIGEN DESTINO HORA MIN DIA
 *     swipl -q -s prolog/main.pl -g main -t halt -- lineas
 *     swipl -q -s prolog/main.pl -g main -t halt -- zonas ZONA TOTAL DISTANCIA ESTACION DESTINO ...
 *
 * REGLAS:
 *  - Los argumentos llegan como ÁTOMOS (no se interpretan como código Prolog). No cambiar esto:
 *    es lo que evita que un usuario inyecte código a través del origen/destino.
 *  - No imprimir nada que no sea el JSON final.
 *
 * PENDIENTE:
 *  - [ ] Probar con `swipl` instalado y ajustar si la lista de argumentos cambia según la versión.
 */
:- (   stream_property(user_output, tty(true))
   ->  true
   ;   set_stream(user_output, encoding(utf8))
   ).
:- consult(conocimiento).
:- consult(reglas).
:- consult(zonas).
:- consult(salida_json).
:- consult(rutas_aprobadas).   % generado por el backend; siempre existe (puede estar vacío)

main :-
    current_prolog_flag(argv, Argv),
    (   append(_, [recomendar, O, D, H, M, Dia], Argv)
    ->  atom_number(H, Hora),
        atom_number(M, Min),
        recomendar_json(O, D, Hora, Min, Dia)
    ;   append(_, [lineas], Argv)
    ->  lineas_json
    ;   append(_, [zonas | Args], Argv)
    ->  ejecutar_zonas(Args)
    ;   format(user_error, "Uso: main -- recomendar O D H M DIA | lineas | zonas ZONA TOTAL DISTANCIA_M ESTACION DESTINO ...~n", []),
        halt(2)
    ).

ejecutar_zonas(Args) :-
    (   parsear_argumentos_zona(Args, Zonas)
    ->  maplist(analizar_dato_zona, Zonas, Resultados),
        json_write_dict(current_output, Resultados, [width(0)]),
        nl
    ;   format(user_error, "Argumentos inválidos para zonas. Se esperan grupos: ZONA TOTAL DISTANCIA_M ESTACION_CERCANA_ID DESTINO_ID.~n", []),
        halt(2)
    ).

parsear_argumentos_zona([], []).
parsear_argumentos_zona([Zona, TotalTexto, DistanciaTexto, Estacion, Destino | Resto],
                        [dato_zona(Zona, Total, Distancia, Estacion, Destino) | Zonas]) :-
    id_valido(Zona),
    numero_entero_no_negativo(TotalTexto, Total),
    numero_entero_no_negativo(DistanciaTexto, Distancia),
    id_valido(Estacion),
    id_valido(Destino),
    parsear_argumentos_zona(Resto, Zonas).

numero_entero_no_negativo(Texto, Numero) :-
    catch(atom_number(Texto, Numero), _, fail),
    integer(Numero),
    Numero >= 0.

id_valido(Id) :-
    atom(Id),
    atom_codes(Id, [Primero | Resto]),
    Primero >= 0'a,
    Primero =< 0'z,
    maplist(codigo_id_valido, Resto).

codigo_id_valido(Codigo) :-
    (Codigo >= 0'a, Codigo =< 0'z ; Codigo >= 0'0, Codigo =< 0'9 ; Codigo =:= 0'_).

analizar_dato_zona(dato_zona(Zona, Total, Distancia, Estacion, Destino), Resultado) :-
    analizar_zona(Zona, Total, Distancia, Estacion, Destino, Resultado).
