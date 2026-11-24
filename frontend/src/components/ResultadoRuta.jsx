/**
 * ARCHIVO: frontend/src/components/ResultadoRuta.jsx
 * RESPONSABLE: Ale (F1)
 * QUÉ HACE: Muestra la respuesta de /api/recomendacion (formato en docs/API.md).
 * REGLAS: no calcular nada aquí; todo viene del sistema experto. Solo presentar.
 * PENDIENTE: [ ] Mejorar presentación (pasos, íconos de línea, aviso visual de ocupación alta)
 */
export default function ResultadoRuta({ resultado }) {
  if (!resultado.encontrada) return <p className="aviso">{resultado.mensaje}</p>;
    const { plan, transbordos, minutos_estimados, siguiente_camion, ocupacion, simulado, salida, llegada } = resultado;  return (
    <section className="resultado">
      <h2>Tu ruta</h2>
    <div className="resultado__resumen">
        <div className="resultado__resumen-metricas">
          <div className="resultado__resumen-metrica resultado__resumen-metrica--duracion">
            <span className="resultado__resumen-etiqueta">Duración</span>
            <p className="resultado__tiempo">
              <strong>{minutos_estimados}</strong>
              <span>min</span>
            </p>
          </div>

          <div className="resultado__resumen-metrica">
            <span className="resultado__resumen-etiqueta">Sales</span>
            <strong className="resultado__resumen-valor">{salida}</strong>
          </div>

          <div className="resultado__resumen-metrica">
            <span className="resultado__resumen-etiqueta">Llegas</span>
            <strong className="resultado__resumen-valor">
              {llegada === null ? 'Sin servicio a esta hora' : llegada}
            </strong>
          </div>
        </div>

        <div className="resultado__resumen-extra">
          <div className="resultado__resumen-lineas" aria-label="Líneas del recorrido">
            {plan.map((tramo, indice) => (
              <span className="resultado__resumen-secuencia" key={tramo.linea}>
                <span className="resultado__resumen-distintivo">
                  {tramo.linea.replace('_', '-').toUpperCase()}
                </span>
                {indice < plan.length - 1 && (
                  <span className="resultado__resumen-flecha" aria-hidden="true">→</span>
                )}
              </span>
            ))}
          </div>

          <p className="resultado__resumen-transbordos">
            <span aria-hidden="true">⇄</span>
            <span>{transbordos} {transbordos === 1 ? 'transbordo' : 'transbordos'}</span>
          </p>
        </div>
      </div>
      <div className="resultado__tramos">
        {plan.map((p, i) => (
          <div className="resultado__paso" key={p.linea}>
            <div className="resultado__paso-riel" aria-hidden="true">
              <span className="resultado__paso-distintivo">
                {p.linea.replace('_', '-').toUpperCase()}
              </span>
              {i < plan.length - 1 && (
                <span className="resultado__paso-linea" />
              )}
            </div>

            <article className="resultado__tramo">
              <div className="resultado__encabezado-tramo">
                <strong className="resultado__nombre-linea">{p.linea_nombre}</strong>
              </div>

              {p.proximos.length === 0 || p.abordaje === null ? (
                <p className="resultado__sin-servicio">
                  No hay servicio a esta hora
                </p>
              ) : (
                <>
                  <div className="resultado__puntos">
                    <p className="resultado__punto">
                      <span>Sube a las {p.abordaje}</span>
                      <strong>{p.desde_nombre}</strong>
                    </p>
                    <p className="resultado__punto">
                      <span>Baja a las {p.bajada}</span>
                      <strong>{p.hasta_nombre}</strong>
                    </p>
                  </div>

                  <p className="resultado__cantidad-paradas">
                    {p.paradas} {p.paradas === 1 ? 'parada' : 'paradas'}
                  </p>

                  <div className="resultado__proximos">
                    <p className="resultado__proximos-titulo">Próximos camiones</p>
                    <div className="resultado__proximos-horas">
                      {p.proximos.map((hora, indice) => (
                        <span
                          key={`${hora}-${indice}`}
                          className={`resultado__proximos-hora${indice === 0 ? ' resultado__proximos-hora--primera' : ''}`}
                        >
                          {hora}
                        </span>
                      ))}
                    </div>
                    <p className="resultado__espera">
                      {p.espera_min === 0
                        ? 'Está pasando ahora'
                        : `Espera ~${p.espera_min} min`}
                    </p>
                  </div>
                </>
              )}
            </article>

            {i < plan.length - 1 && (
              <p className="resultado__transbordo">
                Transbordo en <strong>{p.hasta_nombre}</strong>
              </p>
            )}
          </div>
        ))}
      </div>
      <div className="resultado__camion">
        <p className="resultado__camion-titulo">Siguiente camión</p>
        {siguiente_camion === null ? (
          <p className="resultado__camion-mensaje">
            Esta línea no está en servicio a esta hora.
          </p>
        ) : (
          <>
            <p className="resultado__camion-mensaje">
              {siguiente_camion.en_minutos === 0
                ? 'Está pasando ahora'
                : `Pasa en ${siguiente_camion.en_minutos} min`}
            </p>
            <p className="resultado__frecuencia">
              Pasa cada {siguiente_camion.frecuencia_min} min.
            </p>
          </>
        )}
      </div>
      <div className={`resultado__ocupacion resultado__ocupacion--${ocupacion}`}>
        <p className="resultado__ocupacion-titulo">Ocupación estimada</p>
        <p className="resultado__ocupacion-mensaje">
          {ocupacion === 'alta'
            ? 'Es probable que vaya lleno'
            : ocupacion === 'media'
              ? 'Ocupación media'
              : 'Suele ir con espacio'}
        </p>
        {ocupacion === 'alta' && (
          <p className="resultado__ocupacion-sugerencia">
            Si puedes, considera salir unos minutos antes o después.
          </p>
        )}
      </div>
      {simulado && (
      <aside className="resultado__simulado">
        <strong>Datos simulados</strong>
        <span>Los horarios y la ocupación son aproximados; esto es un prototipo.</span>
      </aside>
    )}
    </section>
  );
}
