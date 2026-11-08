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

**200 – ruta encontrada**
```json
{
  "encontrada": true,
  "origen":  { "id": "zt_alameda", "nombre": "Zona de Transferencia Alameda" },
  "destino": { "id": "itsslpc", "nombre": "ITSSLPC (Tec Superior Capital)" },
  "plan": [
    { "linea": "l1_a", "linea_nombre": "L1 Eje 128 – Alameda",
      "desde": "zt_alameda", "desde_nombre": "Zona de Transferencia Alameda",
      "hasta": "cetram", "hasta_nombre": "CETRAM", "paradas": 25 },
    { "linea": "l1_b", "linea_nombre": "L1 CETRAM – ITSSLPC",
      "desde": "cetram", "desde_nombre": "CETRAM",
      "hasta": "itsslpc", "hasta_nombre": "ITSSLPC", "paradas": 1 }
  ],
  "transbordos": 1,
  "minutos_estimados": 58,
  "siguiente_camion": { "en_minutos": 4, "frecuencia_min": 10 },
  "ocupacion": "alta",
  "simulado": true
}
```
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
| POST | `/solicitudes` | logueado | `{origen, destino, comentario?}` (texto libre) | 201 `{solicitud}` · 409 si ya la pidió |
| GET | `/admin/solicitudes` | admin | — | `[{clave, origen, destino, total, ultima, sugerida}]` ordenado por `total` desc |
| PUT | `/admin/solicitudes/:clave/aprobar` | admin | `{nombre_linea, estaciones:[{id, nombre, lat, lng}]}` | 200 `{ruta}` |
| PUT | `/admin/solicitudes/:clave/rechazar` | admin | — | 200 `{ok:true}` |

- `clave` = origen y destino normalizados (minúsculas, sin acentos): `"colonia x->itsslpc"`. Se manda codificada con `encodeURIComponent`.
- `sugerida` = `true` cuando `total >= UMBRAL_SOLICITUDES` (por defecto 10, se configura en `.env`).
- Una persona solo puede pedir un mismo trayecto una vez.
- Al aprobar: se crea la línea en MongoDB, todas las solicitudes con esa `clave` pasan a `aprobada` y se regenera `prolog/rutas_aprobadas.pl`.
- Los `id` de `estaciones` siguen la regla de IDs del README.
