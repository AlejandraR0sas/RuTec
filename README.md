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

## 6. Equipo y reparto del trabajo

Los tres participamos en **las tres materias**. El trabajo se divide por **funcionalidad completa** (Prolog + backend + front), no por capa, para que todos entiendan todo el sistema.

| Funcionalidad | Dueño/a | Prolog (IA) | Backend (Infraestructura) | Front (Interacción) |
|---|---|---|---|---|
| **F1. Recomendar ruta** | **Ale** | Reglas de ruta, transbordos y tiempo (`reglas.pl`, `main.pl`, `recomendar_json`) | `POST /api/recomendacion` y el puente con Prolog (`prologService.recomendar`) | `Planificador` y `ResultadoRuta` |
| **F2. Cuentas y solicitudes** | **Antulio** | Generar y cargar rutas aprobadas (`rutas_aprobadas.pl`) y sus pruebas | Sesiones en MongoDB, login con roles, solicitudes y aprobación del admin | `Login`, `Solicitud` y `Admin` |
| **F3. Datos, horarios y mapa** | **Osiel** | Completar `conocimiento.pl` (L1-B), `siguiente_camion` y `ocupacion` | `GET /api/lineas` y `GET /api/coordenadas` | `Mapa`, geolocalización, Nominatim, clima y estación más cercana |

### Reglas del reparto

1. Cada funcionalidad tiene un **dueño/a**, que decide cómo se hace y cuida que quede terminada. Pero se trabaja en las **tres capas**.
2. **Los Pull Requests los revisa otra persona**, así cada quien aprende cómo funciona la parte de los demás.
3. **Archivos compartidos** (`salida_json.pl`, `reglas.pl`, `prologService.js`, `rutasController.js`, `routes/index.js`, `App.jsx`, `api/cliente.js`, `estilos.css`): cada quien edita **solo su sección**, con cambios pequeños y frecuentes. El encabezado de cada archivo dice quién es dueño de qué parte.
4. **Orden:** F3 arranca primero (completar L1-B y coordenadas), porque F1 y F2 necesitan esos datos. Mientras tanto F1 y F2 avanzan con los datos que ya hay.
5. **Rotación a mitad del proyecto:** cada quien explica su funcionalidad a los otros dos. Es ensayo para la presentación: los tres deben poder explicar las tres materias.

### Primeros pasos por funcionalidad

**F1 – Ale**
- [ ] Correr las pruebas de rutas en Prolog y corregir lo que falle
- [ ] Probar `recomendar_json` desde la terminal con `swipl`
- [ ] Probar `POST /api/recomendacion` (Postman o curl) con Prolog conectado
- [ ] Mostrar el resultado real en `Planificador`
- [ ] Caso sin ruta → botón "Solicitar esta ruta"

**F2 – Antulio**
- [ ] Levantar MongoDB y el backend, correr `npm run seed:admin`
- [ ] Probar registro, login y logout (ver la colección `sesiones` en MongoDB)
- [ ] Solicitudes: crear, listar agrupadas por trayecto y rechazar
- [ ] Aprobar: formulario en `Admin` + `regenerarRutasAprobadas`; comprobar que Prolog usa la línea nueva
- [ ] Pantallas `Login`, `Solicitud` y `Admin`

**F3 – Osiel**
- [ ] Levantar L1-B en campo y completar `conocimiento.pl`
- [ ] Llenar `backend/src/data/coordenadas.json`
- [ ] Mapa con marcadores y dibujar el recorrido
- [ ] Ubicación → estación más cercana, Nominatim y clima
- [ ] Ajustar frecuencias y horas pico con observación real + pruebas

## 7. Requisitos de la maestra (checklist)

- [ ] Manejo de **sesiones con MongoDB** (`express-session` + `connect-mongo`) → Antulio (F2)
- [ ] **Framework de backend** (Express) → los tres
- [ ] **Framework de frontend** (React) → los tres
- [ ] Sistema experto en Prolog con base de conocimiento → Ale (F1) y Osiel (F3)
- [ ] API REST con métodos HTTP (GET, POST, PUT) → los tres
- [ ] Consumo de APIs públicas → Osiel (F3)
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
- Cada quien trabaja en su rama: `ale/recomendacion`, `antulio/sesiones`, `osiel/mapa`.
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
- Los archivos de Prolog **no se han ejecutado** (no había `swipl` disponible al generarlos). Lo primero: que Ale y Osiel corran `pruebas.pl` y corrijan lo que falle.
- El frontend **no se ha levantado** todavía; lo primero: que cualquiera corra `npm install && npm run dev` y arregle lo que salga.
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
