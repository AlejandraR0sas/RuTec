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
      <ol>
        {plan.map((p, i) => (
          <li key={i}>
            Toma la <strong>{p.linea_nombre}</strong> en {p.desde_nombre} y bájate en {p.hasta_nombre} ({p.paradas} paradas).
          </li>
        ))}
      </ol>
      <p>
        {siguiente_camion
          ? `El siguiente camión pasa en ${siguiente_camion.en_minutos} min (cada ${siguiente_camion.frecuencia_min} min).`
          : 'Esta línea no está en servicio a esta hora.'}
      </p>
      <p>Ocupación estimada: {ocupacion}</p>
      {simulado && <small>Horarios y ocupación simulados: es un prototipo.</small>}
    </section>
  );
}
