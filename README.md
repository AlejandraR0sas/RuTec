# RuTec

Asistente web de transporte público para estudiantes del **Instituto Tecnológico Superior de San Luis Potosí, Capital (ITSSLPC)**, enfocado en el sistema gratuito **MetroRed** (mi RedMetro).

Proyecto integrador de: **Inteligencia Artificial**, **Infraestructura de Servicios Web** e **Interacción con Servicios Web**.

---

## 1. Problemática

Los estudiantes del ITSSLPC que usan MetroRed no tienen una forma sencilla de saber **qué línea tomar, dónde hacer transbordo, cuánto tardarán y cuándo pasa el siguiente camión** para llegar a su escuela y regresar a casa. Además, cuando necesitan un trayecto que no existe, no tienen un canal para pedirlo.

## 2. Objetivo general

Desarrollar un prototipo web que oriente a estudiantes del ITSSLPC en sus traslados en MetroRed mediante un sistema experto que recomiende línea, transbordos, tiempo estimado y horario, y que permita solicitar rutas nuevas a un administrador.

## 3. Objetivos específicos (uno por materia)

1. **IA:** construir un sistema experto en Prolog con la base de conocimiento de líneas, estaciones, horarios y reglas de recomendación.
2. **Infraestructura:** desarrollar una API REST (Node + Express, arquitectura MVC) con sesiones guardadas en MongoDB.
3. **Interacción:** desarrollar una interfaz web (React) con mapa que consuma la API propia y APIs públicas.

## 4. Alcance

**Dentro:** solo MetroRed; líneas que conectan con el ITSSLPC (L1-A, L1-B) y, como ejemplo/prueba de transbordos, L2 y L4; traslados casa–escuela–casa; datos de horarios y ocupación **simulados**.

**Fuera (por ahora):** camiones urbanos y taxis, otras escuelas, ubicación en tiempo real, L3 (circular), líneas de otras ciudades.

## 5. Arquitectura

```
Usuario ──► React (Vite) ──► API Express (MVC) ──► swipl (Prolog) ──► JSON
              │                    │
              │                    └──► MongoDB (usuarios, sesiones, solicitudes, rutas aprobadas)
              └──► APIs públicas: Leaflet/OpenStreetMap, Nominatim, geolocalización, Open-Meteo
```

- **Modelo (M):** `backend/src/models` (Mongoose) + base de conocimiento Prolog.
- **Vista (V):** el frontend React. (La API responde JSON.)
- **Controlador (C):** `backend/src/controllers`.

**Flujo de recomendación:** el front manda origen y destino → el controlador valida → `prologService` ejecuta `swipl` con argumentos → Prolog calcula y devuelve JSON → el front lo muestra.

**Flujo de solicitudes:** si Prolog responde `sin_ruta`, el usuario (logueado) puede solicitarla → se guarda en MongoDB → el admin las ve agrupadas por trayecto con contador → al aprobar, se crea una línea nueva en Mongo y el backend regenera `prolog/rutas_aprobadas.pl` → desde ese momento Prolog la usa.

## 6. Equipo y responsabilidades

| Rol | Persona | Carpeta dueña | Materia |
|---|---|---|---|
| **A – IA / Prolog** | _(escribir nombre)_ | `prolog/` | Inteligencia Artificial |
| **B – Backend** | _(escribir nombre)_ | `backend/` | Infraestructura de Servicios Web |
| **C – Frontend** | _(escribir nombre)_ | `frontend/` | Interacción con Servicios Web |

Cada quien es dueño de su carpeta. Si necesitas cambiar algo en la carpeta de otro, **avísale o abre un Pull Request**; no lo edites directo.

## 7. Requisitos de la maestra (checklist)

- [ ] Manejo de **sesiones con MongoDB** (`express-session` + `connect-mongo`) → Persona B
- [ ] **Framework de backend** (Express) → Persona B
- [ ] **Framework de frontend** (React) → Persona C
- [ ] Sistema experto en Prolog con base de conocimiento → Persona A
- [ ] API REST con métodos HTTP (GET, POST, PUT) → Persona B
- [ ] Consumo de APIs públicas → Persona C
- [ ] Servicio en la nube (AWS u otro) → decidirlo entre los tres

## 8. Reglas generales (aplican a los tres)

### Contrato de la API
- **`docs/API.md` es la ley.** Si alguien necesita cambiar un endpoint o un JSON, **primero** se actualiza `docs/API.md`, se avisa al equipo y luego se programa.
- Claves de JSON y campos de MongoDB en **`snake_case`, en español y sin acentos** (`linea_nombre`, `creada_en`).
- Variables y funciones de JavaScript en `camelCase`.

### IDs de estaciones y líneas (muy importante)
- Siempre `snake_case`, minúsculas, **sin acentos ni espacios**, empiezan con letra: `zt_alameda`, `cetram`, `eje_126`, `itsslpc`.
- El mismo ID se usa en Prolog, en la API, en MongoDB y en el front. **Nunca** se inventa otro nombre para la misma estación.
- El nombre bonito (con acentos) vive solo en `prolog/conocimiento.pl`.

### Git
- Rama `main` = lo que funciona. Nadie hace push directo a `main` salvo cambios de README.
- Cada quien trabaja en su rama: `a/prolog-reglas`, `b/auth-sesiones`, `c/mapa`.
- Commits cortos y en español, en infinitivo: `Agregar regla de ocupación`.
- Pull Request con al menos una revisión de otro compañero antes de unir a `main`.
- **Nunca** subir `.env` ni contraseñas. Usen `.env.example`.

### Código
- Comentarios en español.
- Cada archivo tiene un encabezado con: responsable, qué hace, reglas y pendientes. **Si completas un pendiente, tacha el `[ ]` → `[x]`.**
- Los datos de horarios y ocupación son **simulados**; la API lo indica con `"simulado": true` y el front debe mostrarlo.

## 9. Cómo correr el proyecto

Requisitos: Node 18+, MongoDB (local o Atlas), SWI-Prolog 9+ (`swipl` en el PATH).

```bash
# 1. Backend
cd backend
cp .env.example .env        # y editar valores
npm install
npm run seed:admin          # crea el usuario administrador
npm run dev                 # http://localhost:3000

# 2. Frontend (otra terminal)
cd frontend
npm install
npm run dev                 # http://localhost:5173 (proxy /api → :3000)

# 3. Pruebas de Prolog
swipl -g run_tests -t halt prolog/pruebas.pl
```

## 10. Estado del cascarón (honesto)

- El backend pasó revisión de sintaxis, pero **no se ha corrido contra MongoDB ni contra Prolog**.
- Los archivos de Prolog **no se han ejecutado** (no había `swipl` disponible al generarlos). Lo primero que debe hacer Persona A: correr `pruebas.pl` y corregir lo que falle.
- El frontend **no se ha levantado** todavía; lo primero de Persona C: `npm install && npm run dev` y arreglar lo que salga.
- Las coordenadas de las estaciones están vacías (`backend/src/data/coordenadas.json`).

## 11. Datos y fuentes

- Líneas L1, L2 y L4: mapas oficiales de la SCT / mi RedMetro (2026).
- **L1-B (CETRAM → ITSSLPC): pendiente de levantar en campo**, aún no aparece en el mapa oficial. Completar paradas intermedias en `prolog/conocimiento.pl`.
- Frecuencias, horarios de servicio y reglas de ocupación: **simulados**, se pueden ajustar con observación propia.
- L3 (Circuito Potosí) no se modela por ahora.

## 12. Backlog (ideas aceptadas, pero después del núcleo)

Solo se pasa a desarrollo si el núcleo ya funciona y los tres están de acuerdo.

- [ ] Modelar L3 (circular)
- [ ] Endpoint de horarios por estación (`GET /api/horarios/:estacion`)
- [ ] Encuesta a compañeros para justificar la problemática con datos
- [ ] Notificación de "ya casi pasa tu camión"
- [ ] Clima como factor de retraso
- [ ] Desplegar en la nube
