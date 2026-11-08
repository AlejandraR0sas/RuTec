/**
 * ARCHIVO: frontend/src/components/ResultadoRuta.jsx
 * RESPONSABLE: Persona C (Frontend)
 * QUÉ HACE: Muestra la respuesta de /api/recomendacion (formato en docs/API.md).
 * REGLAS: no calcular nada aquí; todo viene del sistema experto. Solo presentar.
 * PENDIENTE: [ ] Mejorar presentación (pasos, íconos de línea, aviso visual de ocupación alta)
 */
export default function ResultadoRuta({ resultado }) {
  if (!resultado.encontrada) return <p className="aviso">{resultado.mensaje}</p>;
  const { plan, transbordos, minutos_estimados, siguiente_camion, ocupacion, simulado } = resultado;
  return (
    <section className="aviso">
      <h2>Tu ruta</h2>
      <ol>
        {plan.map((p, i) => (
          <li key={i}>
            Toma la <strong>{p.linea_nombre}</strong> en {p.desde_nombre} y bájate en {p.hasta_nombre} ({p.paradas} paradas).
          </li>
        ))}
      </ol>
      <p>
        {transbordos === 0 ? 'Sin transbordos' : `${transbordos} transbordo(s)`} · aprox. {minutos_estimados} min
      </p>
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
