# Contrato de la API (RuTec)

> **Esta es la fuente de verdad entre backend (B) y frontend (C).** Para cambiar algo: editar este archivo primero y avisar al equipo.
> Base: `/api`. Formato: JSON, claves `snake_case`. Sesión por cookie `rutec.sid` (el front usa `credentials: 'include'`).
> Errores: `{ "error": "mensaje legible" }` con el código HTTP adecuado.

## Autenticación (sesiones)

| Método | Ruta | Acceso | Body | Respuesta |
|---|---|---|---|---|
| POST | `/auth/registro` | público | `{nombre, correo, password}` | 201 `{usuario}` |
| POST | `/auth/login` | público | `{correo, password}` | 200 `{usuario}` |
| POST | `/auth/logout` | logueado | — | 200 `{ok:true}` |
| GET | `/auth/yo` | público | — | 200 `{usuario}` o `{usuario:null}` |

`usuario` = `{ id, nombre, correo, rol }`, con `rol` = `"estudiante"` o `"admin"`.
Reglas: el registro siempre crea `estudiante`. El admin se crea con `npm run seed:admin`.

## Líneas y estaciones (vienen de Prolog)

| Método | Ruta | Acceso | Respuesta |
|---|---|---|---|
| GET | `/lineas` | público | `[{id, nombre, estaciones:[{orden, id, nombre}]}]` |
| GET | `/coordenadas` | público | `{ "<id_estacion>": {lat, lng}, ... }` |

## Recomendación (sistema experto)

`POST /recomendacion` (público)

Body: `{ "origen": "zt_alameda", "destino": "itsslpc", "hora": 7, "minuto": 30, "dia": "lunes" }`
`hora`, `minuto` y `dia` son opcionales (si no vienen, se usa la hora actual de México).
`dia` ∈ `lunes, martes, miercoles, jueves, viernes, sabado, domingo`.
El body no recibe un parámetro de lluvia. Prolog determina el clima automáticamente y de forma simulada según la hora de salida.
**200 – ruta encontrada**
```json
{
  "encontrada": true,
  "origen":  { "id": "zt_alameda", "nombre": "Zona de Transferencia Alameda" },
  "destino": { "id": "itsslpc", "nombre": "ITSSLPC (Tec Superior Capital)" },
  "plan": [
    { "linea": "l1_a", "linea_nombre": "L1 Eje 128 – Alameda",
      "desde": "zt_alameda", "desde_nombre": "Zona de Transferencia Alameda",
      "hasta": "cetram", "hasta_nombre": "CETRAM", "paradas": 25,
      "abordaje": "07:30", "espera_min": 0,
      "proximos": ["07:30", "07:40", "07:50"], "bajada": "08:20" },
    { "linea": "l1_b", "linea_nombre": "L1 Extensión CETRAM – ITSSLPC",
      "desde": "cetram", "desde_nombre": "CETRAM",
      "hasta": "itsslpc", "hasta_nombre": "ITSSLPC (Tec Superior Capital)", "paradas": 2,
      "abordaje": "08:30", "espera_min": 4,
      "proximos": ["08:30", "08:45", "09:00"], "bajada": "08:34" }
  ],
  "transbordos": 1,
  "minutos_estimados": 60,
  "salida": "07:30",
  "llegada": "08:34",
  "siguiente_camion": { "en_minutos": 0, "frecuencia_min": 10 },
  "ocupacion": "alta",
  "clima": { "lluvia": false, "retraso_extra_min": 0 },
  "simulado": true
}
```
Campos de horario (se agregan a los anteriores, no cambian nada de lo que ya existía):

- `abordaje`: hora en que sube al camión en ese tramo ("HH:MM").
- `espera_min`: minutos que espera en la parada. En el primer tramo cuenta desde la hora de salida; en los siguientes, cuenta después de los minutos de transbordo (`minutos_transbordo`) desde que llega a la estación de transbordo.
- `proximos`: hasta 3 horas de camiones de esa línea, empezando por el que va a tomar.
- `bajada`: hora en que llega al final del tramo.
- `salida` y `llegada`: hora de salida y llegada de todo el viaje.
- `minutos_estimados` sigue siendo solo el tiempo en camión más los transbordos, **sin esperas**.
- Si una línea no está en servicio a esa hora: `proximos` es `[]`; `abordaje`, `espera_min` y `bajada` son `null`; y `llegada` también es `null`.
- `clima` aparece siempre cuando `encontrada` es `true`: contiene `lluvia` (`true` o `false`) y `retraso_extra_min` (número). Si no llueve, el retraso es `0`.
- Regla simulada basada en las tormentas de la tarde: hay lluvia si la hora de salida cae entre 14:00 y 15:59, o entre 18:00 y 19:29, cualquier día de la semana.
- Con lluvia, `retraso_extra_min` es `10` y `ocupacion` sube un nivel: `baja` pasa a `media`, `media` a `alta` y `alta` permanece `alta`. El valor de `ocupacion` de la respuesta ya incluye este ajuste.
- El retraso es informativo: no modifica `minutos_estimados`, `salida`, `llegada` ni los horarios de los tramos.
`siguiente_camion` es `null` si la primera línea está fuera de servicio a esa hora. `ocupacion` ∈ `alta | media | baja`.

**200 – no hay ruta** (no es error, es resultado)
```json
{ "encontrada": false, "motivo": "sin_ruta", "mensaje": "No hay una ruta de MetroRed para ese trayecto.", "puede_solicitar": true }
```
`motivo` ∈ `sin_ruta | estacion_desconocida | mismo_origen_destino`. `puede_solicitar` es `true` solo si `motivo = sin_ruta`.

**400** si `origen`/`destino` no son IDs válidos (`^[a-z][a-z0-9_]*$`) o hora/minuto/día fuera de rango.

## Solicitudes de ruta

| Método | Ruta | Acceso | Body | Respuesta |
|---|---|---|---|---|
| POST | `/solicitudes` | estudiante logueado | `{origen, destino, comentario?}` (texto libre) | 201 `{solicitud}` · 403 si es admin · 409 si ya la pidió |
| GET | `/admin/solicitudes` | admin | — | `[{clave, origen, destino, total, ultima, sugerida}]` ordenado por `total` desc |
| GET | `/admin/estadisticas` | admin | — | Resumen de cuentas, solicitudes, consultas de rutas y líneas (últimos 30 días) |
| PUT | `/admin/solicitudes/:clave/aprobar` | admin | `{nombre_linea, estaciones:[{id, nombre, lat, lng}]}` | 200 `{ruta}` |
| PUT | `/admin/solicitudes/:clave/rechazar` | admin | — | 200 `{ok:true}` |

`GET /admin/estadisticas` responde:

```json
{
  "periodo_dias": 30,
  "usuarios_registrados": 0,
  "solicitudes_pendientes": 0,
  "ruta_mas_consultada": null,
  "linea_mas_recomendada": null,
  "consultas_por_hora": [{"hora": 7, "total": 0}],
  "solicitudes_por_estado": {"pendientes": 0, "aprobadas": 0, "rechazadas": 0},
  "solicitudes_recientes": []
}
```

- `ruta_mas_consultada`, cuando hay datos: `{origen_id, origen_nombre, destino_id, destino_nombre, total}`.
- `linea_mas_recomendada`, cuando hay datos: `{id, nombre, total}`.
- `solicitudes_recientes` contiene hasta 8 elementos `{id, estudiante, origen, destino, creada_en, estado}`.
- Las consultas cuentan recomendaciones exitosas, incluidas las de visitantes, desde que se habilite el registro. No identifican a la persona ni representan viajes realizados.

- `clave` = origen y destino normalizados (minúsculas, sin acentos): `"colonia x->itsslpc"`. Se manda codificada con `encodeURIComponent`.
- `sugerida` = `true` cuando `total >= UMBRAL_SOLICITUDES` (por defecto 10, se configura en `.env`).
- Una persona solo puede pedir un mismo trayecto una vez.
- Solo usuarios con rol `estudiante` pueden crear solicitudes; los administradores no pueden solicitarlas.
- Al aprobar: se crea la línea en MongoDB, todas las solicitudes con esa `clave` pasan a `aprobada` y se regenera `prolog/rutas_aprobadas.pl`.
- Los `id` de `estaciones` siguen la regla de IDs del README.
