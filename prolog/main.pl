:- encoding(utf8).
/**
 * ARCHIVO: prolog/main.pl
 * RESPONSABLE: Ale (F1)
 * QUÉ HACE: Punto de entrada. El backend lo ejecuta así:
 *     swipl -q -s prolog/main.pl -g main -t halt -- recomendar ORIGEN DESTINO HORA MIN DIA
 *     swipl -q -s prolog/main.pl -g main -t halt -- lineas
 *
 * REGLAS:
 *  - Los argumentos llegan como ÁTOMOS (no se interpretan como código Prolog). No cambiar esto:
 *    es lo que evita que un usuario inyecte código a través del origen/destino.
 *  - No imprimir nada que no sea el JSON final.
 *
 * PENDIENTE:
 *  - [ ] Probar con `swipl` instalado y ajustar si la lista de argumentos cambia según la versión.
 */

:- set_stream(user_output, encoding(utf8)).
:- consult(conocimiento).
:- consult(reglas).
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
    ;   format(user_error, "Uso: main -- recomendar O D H M DIA | lineas~n", []),
        halt(2)
    ).
