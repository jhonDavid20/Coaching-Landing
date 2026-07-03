# Steady Vitality — Plataforma de Coaching de Salud y Fitness

> Documento de estado y alcance del proyecto
> Última actualización: 2026-06-30

Este documento resume **todo lo construido hasta hoy** en los dos repositorios que
componen la plataforma, y define el **scope (alcance)** del proyecto: qué está hecho,
qué está en progreso y qué falta.

---

## 1. Visión general

**Steady Vitality** es una plataforma de coaching de salud y fitness compuesta por
dos productos que trabajan juntos:

| Repositorio | Rol | Stack | Descripción |
|---|---|---|---|
| `coaching-landing` | **Frontend público** | Next.js 15 + React 19 + TypeScript + Tailwind | Landing page de captación de leads con assessment interactivo, BMI en tiempo real y reserva de citas vía Cal.com. Bilingüe (ES/EN). |
| `steady-vitality` | **Backend / API** | Node.js + Express + TypeScript + TypeORM + PostgreSQL | API REST que gestiona usuarios, coaches, clientes, paquetes, invitaciones y relaciones coach‑cliente. |

**Objetivo del producto:** que un visitante descubra el servicio en la landing,
complete una evaluación inicial (assessment), reserve una llamada y, una vez dentro,
sea gestionado por un coach a través de paquetes y sesiones administrados por el backend.

---

## 2. Frontend — `coaching-landing`

### 2.1 Stack técnico
- **Framework:** Next.js 15.2.8 (App Router) + React 19
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS 3.4 + `tailwindcss-animate`
- **Componentes UI:** Radix UI primitives + shadcn/ui (carpeta `src/components/ui`)
- **Formularios:** React Hook Form + Zod + `@hookform/resolvers`
- **i18n:** `next-intl` (Español e Inglés) con rutas por locale `/[locale]`
- **Reservas:** `@calcom/embed-react` (Cal.com)
- **Temas:** `next-themes` (modo claro / oscuro)
- **Iconos:** `lucide-react`
- **Deploy:** Vercel — [demo en vivo](https://coaching-landing-kappa.vercel.app/en)

### 2.2 Estructura
```
src/
├── app/
│   └── [locale]/
│       ├── page.tsx            # Home (one-page con todas las secciones)
│       ├── philosophy/page.tsx # Página dedicada de filosofía
│       ├── layout.tsx          # Layout raíz (locale, tema, fuentes)
│       └── globals.css
│   └── api/
│       └── assessment/route.ts # Endpoint que recibe el assessment (POST)
├── components/
│   ├── navbar.tsx
│   ├── hero-section.tsx
│   ├── philosophy-section.tsx
│   ├── services-section.tsx
│   ├── assessment-section.tsx
│   ├── assessment-form.tsx
│   ├── assessment-success.tsx
│   ├── cal-section.tsx         # Embed de Cal.com (calLink: jhonda/30min)
│   ├── about-section.tsx
│   ├── theme-provider.tsx
│   └── ui/                     # 11 componentes base (button, card, dialog, select…)
├── hooks/                      # use-mobile, use-toast
├── i18n/                       # navigation, request, routing
├── lib/utils.ts
└── messages/
    ├── en.json                 # Traducciones inglés
    └── es.json                 # Traducciones español
```

### 2.3 Secciones de la landing (orden en el home)
1. **Navbar** — navegación con anclas a secciones.
2. **Hero** — propuesta de valor + CTAs (Assessment / Reservar llamada).
3. **Philosophy** — filosofía del método (también tiene página propia `/philosophy`).
4. **Services** — servicios ofrecidos.
5. **Assessment** — formulario interactivo: nombre, email, edad, género, altura,
   peso, nivel de actividad, objetivo y experiencia. Calcula **BMI en tiempo real** y
   genera recomendaciones iniciales. Al enviar muestra pantalla de éxito.
6. **Cal.com** — reserva de cita de 30 min embebida.
7. **About** — sobre el coach / la marca.

### 2.4 Funcionalidades implementadas
- ✅ Landing one-page responsive con 7 secciones.
- ✅ Internacionalización completa ES/EN con `next-intl`.
- ✅ Modo claro/oscuro.
- ✅ Formulario de assessment con cálculo de BMI y recomendaciones.
- ✅ Integración de reservas con Cal.com.
- ✅ Página dedicada de Filosofía.
- ✅ Endpoint interno `/api/assessment` (actualmente solo loguea y simula procesamiento).

### 2.5 Pendiente / por mejorar (frontend)
- ⚠️ **El endpoint `/api/assessment` no persiste datos** — solo hace `console.log` y
  un `setTimeout`. Falta conectarlo al backend, a un CRM o a email marketing.
- ⚠️ Sección de **testimonios / historias de transformación** está comentada en
  `philosophy/page.tsx` (pendiente de contenido).
- ⚠️ No hay integración real entre la landing y la API del backend todavía.
- ⚠️ Variables de entorno (Cal.com link, analytics, email) están hardcodeadas o
  ausentes; conviene moverlas a `.env`.

---

## 3. Backend — `steady-vitality`

### 3.1 Stack técnico
- **Runtime:** Node.js (>=18) + Express 4
- **Lenguaje:** TypeScript 5
- **ORM:** TypeORM 0.3 (`synchronize: false`, migraciones versionadas)
- **Base de datos:** PostgreSQL
- **Auth:** JWT (access + refresh tokens) + `bcryptjs`; soporte para sesiones tipo Auth.js
- **Validación:** `class-validator`, `express-validator`, `zod`
- **Seguridad:** `helmet`, `cors`, `express-rate-limit`, `compression`
- **Email:** Mailtrap (API HTTP) / Nodemailer
- **Docs:** Swagger (`swagger-jsdoc` + `swagger-ui-express`) en `/api/docs`
- **Tareas programadas:** `node-cron` (servicio de limpieza de sesiones)
- **Logs:** Winston + Morgan
- **Deploy:** Render (`render.yaml`) con PostgreSQL gestionado

### 3.2 Estructura
```
src/
├── index.ts                 # Bootstrap, healthcheck, graceful shutdown
├── app.ts                   # Express app, middlewares, montaje de rutas
├── config/                  # env.ts, swagger.ts
├── middleware/auth.ts       # authenticate, requireRole, requireAdmin, requireCoach
├── database/
│   ├── entities/            # 9 entidades (ver modelo de datos)
│   ├── migrations/          # 8 migraciones versionadas
│   ├── seeds/               # seed-admin (usuario admin por defecto)
│   └── transformers/
├── routes/                  # 8 routers REST
├── services/                # 8 servicios (lógica de negocio)
├── types/
└── utils/                   # mailer, etc.
```

### 3.3 Modelo de datos (entidades)
| Entidad | Descripción |
|---|---|
| **User** | Cuenta base. Roles: `admin`, `coach`, `client`. Verificación de email, reset de contraseña, onboarding, `coachId` (un coach por cliente). |
| **UserProfile** | Perfil fitness del cliente: edad, género, altura, peso, nivel de actividad, objetivos, lesiones, preferencias, contacto de emergencia, etc. |
| **CoachProfile** | Perfil del coach: bio, especialidades, tarifa, certificaciones, tipo de coaching (`online`/`in_person`/`hybrid`), años de experiencia, redes, si acepta clientes. |
| **Package** | Plantilla de paquete de coaching de un coach: nombre, duración, nº de sesiones, precio, features. |
| **ClientPackage** | Asignación de un paquete a un cliente: estado (incluye `pending`), sesiones completadas, fechas, notas, objetivos. |
| **ClientCoachRelationship** | Relación coach‑cliente con estados (pending/active/ended…). |
| **ConnectionRequest** | Solicitud de conexión entre cliente y coach. |
| **Invite** | Invitaciones (tipo `coach` o `client`) con token, expiración y uso. |
| **Session** | Sesiones de autenticación / tokens (compatibles con Auth.js). |

### 3.4 API REST (endpoints principales)
Todos bajo el prefijo `/api`. Endpoints protegidos requieren `Bearer` JWT.

**Auth (`/api/auth`)** — register, login, logout, logout-all, refresh, me (GET/PATCH),
sessions, change/forgot/reset password, verify-email, registro de coach por invitación,
registro de cliente, status.

**Auth.js bridge (`/api/authjs`)** — CRUD de usuarios/sesiones para integración con
Auth.js (NextAuth).

**Users (`/api/users`)** — perfil propio, perfil fitness, onboarding, cambio de
contraseña, avatar (subir/eliminar), borrado de cuenta.

**Coaches (`/api/coaches`)** — listado público de coaches, perfil propio (GET/POST/PATCH),
clientes del coach, dashboard, stats, clientes vinculados, solicitudes de conexión
(crear/listar/responder).

**Packages (`/api/packages`)** — CRUD de paquetes del coach, asignación a clientes,
paquete activo del cliente, solicitud de paquete, actualización de estado.

**Relationships (`/api/relationships`)** — solicitar coach, aceptar/rechazar/terminar
relación, ver mi coach, solicitudes pendientes.

**Invites (`/api/invites`)** — crear y validar invitaciones de coach y de cliente,
aceptar, revocar, eliminar.

**Admin (`/api/admin`)** — gestión de usuarios (rol, estado, datos, avatar),
estadísticas globales, limpieza de sesiones.

**Otros** — `/api/docs` (Swagger), `/health` (healthcheck).

### 3.5 Funcionalidades implementadas
- ✅ Autenticación JWT completa (access + refresh, rotación, logout-all).
- ✅ Verificación de email y reset de contraseña.
- ✅ Sistema de roles (admin / coach / client) con middleware de autorización.
- ✅ Onboarding diferenciado para clientes y coaches.
- ✅ Sistema de invitaciones (coach y cliente) con tokens y expiración.
- ✅ Perfiles de coach con especialidades, tarifas y disponibilidad.
- ✅ Paquetes de coaching: creación, asignación, seguimiento de sesiones.
- ✅ Relaciones coach‑cliente y solicitudes de conexión.
- ✅ Panel admin con estadísticas y gestión de usuarios.
- ✅ Bridge Auth.js para integración con frontends NextAuth.
- ✅ Subida de avatares (carpeta `uploads/`).
- ✅ Servicio de limpieza de sesiones expiradas (cron).
- ✅ Documentación Swagger interactiva.
- ✅ Seguridad: helmet, CORS configurable, rate limiting, compresión.
- ✅ Despliegue en Render con migraciones y PostgreSQL gestionado.

### 3.6 Pendiente / por mejorar (backend)
- ⚠️ No hay aún una **app de cliente/coach** (dashboard) que consuma esta API; el
  bridge Auth.js sugiere que está prevista.
- ⚠️ La landing pública todavía **no está conectada** a la API.
- ⚠️ Email en modo **sandbox (Mailtrap)** — falta proveedor de producción.
- ⚠️ Cobertura de **tests** configurada (Jest) pero conviene ampliarla.
- ⚠️ Redis está en dependencias/variables pero su uso debe confirmarse.

---

## 4. Scope del proyecto

### 4.1 En alcance (lo que el proyecto cubre)
1. **Captación de leads** mediante landing bilingüe con assessment + BMI + reserva.
2. **Gestión de identidad**: registro/login de clientes y coaches, roles, invitaciones.
3. **Gestión de coaches**: perfiles, especialidades, disponibilidad, paquetes.
4. **Gestión de clientes**: perfil fitness, onboarding, vínculo con un coach.
5. **Relación coach‑cliente**: solicitudes de conexión y ciclo de vida de la relación.
6. **Paquetes de coaching**: catálogo por coach, asignación y seguimiento de sesiones.
7. **Administración**: panel admin con métricas y gestión de usuarios.
8. **Infraestructura**: auth segura, email transaccional, docs API, despliegue cloud.

### 4.2 Fuera de alcance (por ahora)
- Pasarela de **pagos** / facturación.
- App móvil nativa.
- Chat en tiempo real coach‑cliente.
- Generación automática de planes de entrenamiento/nutrición.
- Analítica avanzada / reporting para coaches más allá del dashboard básico.

### 4.3 Próximos pasos recomendados (prioridad)
1. **Conectar la landing con el backend**: que el assessment cree un lead/usuario real
   vía API en lugar de solo loguear.
2. Construir el **dashboard de cliente y de coach** (frontend autenticado que consuma la API).
3. Configurar **email de producción** (salir de Mailtrap sandbox).
4. Activar/poblar **testimonios** en la sección de filosofía.
5. Definir e integrar **pagos** para paquetes (si entra en alcance).
6. Ampliar **tests** y CI en el backend.

---

## 5. Cómo levantar el proyecto

### Frontend
```bash
cd coaching-landing
npm install
npm run dev        # http://localhost:3000
```

### Backend
```bash
cd steady-vitality
pnpm install
cp .env.example .env   # rellenar credenciales de DB, JWT, SMTP
pnpm run migration:run # aplicar migraciones
pnpm run seed:admin    # crear usuario admin
pnpm run dev           # http://localhost:3001  ·  docs en /api/docs
```

---

## 6. Estado general

| Área | Estado |
|---|---|
| Landing pública (UI) | ✅ Funcional |
| i18n ES/EN | ✅ Completo |
| Assessment + BMI | ✅ Funcional (sin persistencia) |
| Reserva Cal.com | ✅ Integrado |
| API de autenticación | ✅ Completa |
| Gestión coaches/clientes/paquetes | ✅ Implementada |
| Panel admin | ✅ Implementado |
| Conexión landing ↔ API | ❌ Pendiente |
| Dashboard cliente/coach | ❌ Pendiente |
| Pagos | ❌ Fuera de alcance actual |

> **Resumen:** El backend (API completa) y la landing pública están construidos y
> desplegados de forma independiente. El principal trabajo pendiente es **unirlos** y
> construir la **zona autenticada** (dashboards) que consuma la API ya existente.
