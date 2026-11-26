:- encoding(utf8).
/**
 * ARCHIVO: prolog/zonas.pl
 * RESPONSABLE: Ale (F1 – análisis de zonas)
 * QUÉ HACE: Recomienda una acción administrativa para solicitudes agrupadas por zona.
 * REGLAS: Prolog recibe hechos de conteo y distancia; no calcula coordenadas ni geometría.
 */

% Parámetros del sistema experto: se mantienen juntos para poder ajustarlos fácilmente.
umbral_zona(5).
distancia_cobertura_m(1000).
distancia_critica_m(2000).

% analizar_zona(+Zona, +Total, +DistanciaM, +EstacionCercana, +Destino, -Resultado)
analizar_zona(Zona, Total, DistanciaM, EstacionCercana, Destino, Resultado) :-
    umbral_zona(Umbral),
    distancia_cobertura_m(Cobertura),
    distancia_critica_m(Critica),
    decidir_accion(DistanciaM, Total, Cobertura, Umbral, Accion),
    decidir_prioridad(Accion, Total, DistanciaM, Critica, Prioridad),
    nombre_o_id(EstacionCercana, NombreCercana),
    nombre_o_id(Destino, NombreDestino),
    explicar_zona(Accion, Total, Umbral, DistanciaM, Cobertura,
                  NombreCercana, NombreDestino, Razones),
    Resultado = _{zona: Zona, accion: Accion, prioridad: Prioridad, razones: Razones}.

decidir_accion(DistanciaM, _, Cobertura, _, ya_hay_cobertura) :-
    DistanciaM =< Cobertura,
    !.
decidir_accion(DistanciaM, Total, Cobertura, Umbral, recomendar_parada_nueva) :-
    DistanciaM > Cobertura,
    Total >= Umbral,
    !.
decidir_accion(_, _, _, _, esperar_mas_solicitudes).

decidir_prioridad(recomendar_parada_nueva, Total, DistanciaM, Critica, alta) :-
    (Total >= 10 ; DistanciaM > Critica),
    !.
decidir_prioridad(recomendar_parada_nueva, _, _, _, media) :-
    !.
decidir_prioridad(_, _, _, _, baja).

nombre_o_id(Id, Nombre) :-
    (   nombre_estacion(Id, NombreEstacion)
    ->  atom_string(NombreEstacion, Nombre)
    ;   atom_string(Id, Nombre)
    ).

explicar_zona(ya_hay_cobertura, Total, _, DistanciaM, Cobertura,
              NombreCercana, NombreDestino, [R1, R2]) :-
    format(string(R1), 'Hay ~d solicitudes desde esta zona hacia ~s.', [Total, NombreDestino]),
    format(string(R2), 'La estación ~s está a ~d m, dentro del límite de cobertura de ~d m: conviene revisar frecuencia u horarios antes de abrir una parada.',
           [NombreCercana, DistanciaM, Cobertura]).
explicar_zona(Accion, Total, Umbral, DistanciaM, Cobertura,
              NombreCercana, NombreDestino, Razones) :-
    Accion \== ya_hay_cobertura,
    format(string(R1), 'Hay ~d solicitudes desde esta zona hacia ~s.', [Total, NombreDestino]),
    format(string(R2), 'La estación más cercana (~s) está a ~d m, más allá del límite de cobertura de ~d m.',
           [NombreCercana, DistanciaM, Cobertura]),
    (   Total >= Umbral
    ->  format(string(R3), 'Se alcanzó el umbral de ~d solicitudes.', [Umbral])
    ;   format(string(R3), 'Aún no se alcanza el umbral de ~d solicitudes.', [Umbral])
    ),
    Razones = [R1, R2, R3].
