/**
 * ARCHIVO: frontend/src/components/ResultadoRuta.jsx
 * RESPONSABLE: Ale (F1)
 * QUÉ HACE: Muestra la respuesta de /api/recomendacion (formato en docs/API.md).
 * REGLAS: no calcular nada aquí; todo viene del sistema experto. Solo presentar.
 * PENDIENTE: [ ] Mejorar presentación (pasos, íconos de línea, aviso visual de ocupación alta)
 */
export default function ResultadoRuta({ resultado }) {
  if (!resultado.encontrada) return <p className="aviso">{resultado.mensaje}</p>;
  const { plan, transbordos, minutos_estimados, siguiente_camion, ocupacion, simulado } = resultado;
  return (
    <section className="resultado">
      <h2>Tu ruta</h2>
      <div className="resultado__resumen">
        <p className="resultado__tiempo">
          <strong>{minutos_estimados}</strong>
          <span>min</span>
        </p>
        <p className="resultado__transbordos">
          <strong>{transbordos}</strong>
          <span>{transbordos === 1 ? 'transbordo' : 'transbordos'}</span>
        </p>
      </div>
      <div className="resultado__tramos">
        {plan.map((p, i) => (
          <div key={i}>
            <article className="resultado__tramo">
              <div className="resultado__encabezado-tramo">
                <span className="resultado__distintivo">
                  {p.linea.split('_')[0].toUpperCase()}
                </span>
                <strong className="resultado__nombre-linea">{p.linea_nombre}</strong>
              </div>

              <div className="resultado__puntos">
                <p className="resultado__punto">
                  <span>Sube en</span>
                  <strong>{p.desde_nombre}</strong>
                </p>
                <p className="resultado__punto">
                  <span>Bájate en</span>
                  <strong>{p.hasta_nombre}</strong>
                </p>
              </div>

              <p className="resultado__cantidad-paradas">
                {p.paradas} {p.paradas === 1 ? 'parada' : 'paradas'}
              </p>
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
      {simulado && <small>Horarios y ocupación simulados: es un prototipo.</small>}
    </section>
  );
}
