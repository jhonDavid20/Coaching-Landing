# Guía de Desarrollo — Steady Vitality

> Guía práctica para seguir desarrollando la plataforma (frontend + backend).
> Para el estado/alcance del producto ver [`PROJECT_OVERVIEW.md`](./PROJECT_OVERVIEW.md).
> Última actualización: 2026-07-03

---

## 1. Arquitectura en dos repos

```
┌─────────────────────────┐        HTTP (server-side)        ┌──────────────────────────┐
│   coaching-landing       │  POST /api/assessment            │   steady-vitality (API)   │
│   (Next.js · Vercel)     │ ───────────────────────────────▶ │   (Express · Render)      │
│                          │   route → fetch API_URL/api/leads │                          │
│  · Landing pública       │                                   │  · REST API + PostgreSQL │
│  · Assessment + BMI      │ ◀─────────────────────────────── │  · Auth JWT / roles      │
│  · Cal.com embed         │        201 { success }            │  · Leads, coaches, etc.  │
└─────────────────────────┘                                   └──────────────────────────┘
```

**Punto clave:** el navegador nunca llama directo al backend. El formulario hace
`POST` a la ruta interna de Next `/api/assessment`, que corre **server-side** y
reenvía al backend (`API_URL/api/leads`). Esto evita CORS y mantiene la URL del
backend fuera del cliente. Si `API_URL` no está definida, la ruta degrada con
gracia: registra el lead en logs y responde `success` (la landing sigue viva sin backend).

---

## 2. Puesta en marcha local

### Backend (`steady-vitality`)
```bash
cd steady-vitality
pnpm install
cp .env.example .env         # completar DB, JWT, SMTP
# Levantar PostgreSQL (local o docker) y luego:
pnpm run migration:run       # aplica migraciones (incluida CreateLeadsTable)
pnpm run seed:admin          # crea el usuario admin
pnpm run dev                 # http://localhost:3001 · Swagger en /api/docs
```

### Frontend (`coaching-landing`)
```bash
cd coaching-landing
pnpm install
cp .env.example .env.local   # API_URL=http://localhost:3001, NEXT_PUBLIC_CAL_*
pnpm run dev                 # http://localhost:3000
```

### Flujo completo en local
1. Backend corriendo en `:3001` con la migración de `leads` aplicada.
2. Frontend en `:3000` con `API_URL=http://localhost:3001`.
3. Completar el assessment en `/es` o `/en` → se crea un registro en la tabla `leads`.
4. Ver los leads: `GET http://localhost:3001/api/leads` con un `Bearer` token de admin.

---

## 3. Backend — convenciones

El backend sigue un patrón muy consistente. Para **añadir un recurso nuevo** replica
lo que hace `leads` (buen ejemplo de referencia, es el más reciente):

1. **Entidad** → `src/database/entities/<Nombre>.ts`
   - Decorar con `@Entity('tabla')`, columnas, índices y (si aplica) relaciones.
2. **Migración** → `src/database/migrations/<timestamp>-<Nombre>.ts`
   - `synchronize` está **desactivado**: TODO cambio de schema va por migración.
   - Usa `uuid_generate_v4()` para PKs (extensión `uuid-ossp` ya habilitada).
   - Timestamp incremental sobre el último (ej. leads = `1743700000000`).
3. **Registrar la entidad** en `src/database/data-source.ts` (array `entities`).
4. **Servicio** → `src/services/<nombre>.service.ts`
   - Clase con `AppDataSource.getRepository(Entidad)`.
   - Métodos devuelven `{ success, data?, message }` (patrón usado en todo el proyecto).
5. **Ruta** → `src/routes/<nombre>.routes.ts`
   - `express-validator` para validar input (`handleValidationErrors` helper).
   - Middlewares: `authenticate`, `requireAdmin`, `requireCoach`, `requireRole(...)`.
   - Rutas estáticas ANTES de las paramétricas (`/me` antes de `/:id`).
6. **Montar** en `src/app.ts`: `app.use('/api/<nombre>', <nombre>Routes)` y añadir al
   índice de `/api`.
7. **Documentar** en `README.md` (tabla de endpoints + migración).

### Comandos útiles
| Comando | Qué hace |
|---|---|
| `pnpm run dev` | Dev con hot reload |
| `pnpm run build` | Compila a `dist/` (tsc) — úsalo para typecheck |
| `pnpm run migration:run` | Aplica migraciones pendientes |
| `pnpm run migration:revert` | Revierte la última |
| `pnpm run migration:generate -- src/database/migrations/Nombre` | Genera migración desde cambios de entidades |

### Auth y roles
- JWT access + refresh. `authenticate` valida el `Bearer` y carga `req.user`.
- Roles: `admin`, `coach`, `client` (enum `UserRole`).
- Helpers: `requireAdmin`, `requireCoach` (admin+coach), `requireRole([...])`.

---

## 4. Frontend — convenciones

### Estructura
- **Páginas**: `src/app/[locale]/…` (App Router, todo bajo un locale).
- **Rutas API internas**: `src/app/api/…/route.ts` (server-side; aquí va la
  comunicación con el backend).
- **Secciones/Componentes**: `src/components/*.tsx`; primitivos UI en `src/components/ui/`.
- **i18n**: `messages/en.json` y `messages/es.json` con `next-intl`.

### Añadir texto traducible
1. Agrega la clave en **ambos** `messages/en.json` y `messages/es.json` (mismo path).
2. Úsala con `const t = useTranslations('Namespace')` → `t('Clave')`.
3. Valida el JSON: `node -e "JSON.parse(require('fs').readFileSync('messages/es.json'))"`.

### Añadir una sección a la landing
1. Crea `src/components/mi-seccion.tsx` (`"use client"` si usa hooks/estado).
2. Impórtala y colócala en `src/app/[locale]/page.tsx`.
3. Añade sus textos a i18n y, si necesita navegación, un ancla en `navbar.tsx`.

### Variables de entorno
- `NEXT_PUBLIC_*` → expuestas al navegador (ej. `NEXT_PUBLIC_CAL_LINK`).
- Sin prefijo (ej. `API_URL`) → solo server-side (rutas `/api/*`). **No** las uses en
  componentes cliente.

### Ejemplo de referencia: assessment → lead
- `components/assessment-form.tsx` — form (React Hook Form), calcula BMI, prop `submitting`.
- `components/assessment-section.tsx` — hace `fetch('/api/assessment')` con el `locale`,
  maneja estados de envío/error.
- `app/api/assessment/route.ts` — reenvía a `API_URL/api/leads`.

---

## 5. Variables de entorno (referencia)

### Backend (`.env`)
| Variable | Descripción |
|---|---|
| `NODE_ENV`, `PORT` | Entorno y puerto (3001) |
| `DB_HOST/PORT/NAME/USERNAME/PASSWORD` | Postgres local |
| `DATABASE_URL` | Alternativa cloud (si está, ignora los `DB_*`) |
| `JWT_SECRET`, `JWT_EXPIRE`, `JWT_REFRESH_EXPIRE` | Tokens |
| `BCRYPT_ROUNDS` | Coste de hashing |
| `DEFAULT_ADMIN_*` | Semilla del admin |
| `SMTP_*`, `EMAIL_FROM` | Email (Mailtrap sandbox por ahora) |
| `FRONTEND_URL` | Base para links de invitación |

> ⚠️ Redis fue **removido** de la config (no se usaba). Si en el futuro se necesita,
> reintroducir `config.redis` en `src/config/env.ts`.

### Frontend (`.env.local`)
| Variable | Descripción |
|---|---|
| `API_URL` | Base del backend (server-side, para `/api/assessment`) |
| `NEXT_PUBLIC_CAL_LINK` | Evento de Cal.com (`usuario/evento`) |
| `NEXT_PUBLIC_CAL_NAMESPACE` | Namespace del embed de Cal.com |
| `NEXT_PUBLIC_GA_ID` | (Opcional) Google Analytics |

---

## 6. Deuda técnica / issues conocidos

| Área | Detalle | Sugerencia |
|---|---|---|
| Front · tipos | `src/components/ui/calendar.tsx` importa `react-day-picker` (no instalado) y `src/hooks/use-toast.ts` importa `@/components/ui/toast` (inexistente). El build los ignora (`ignoreBuildErrors: true`). | Instalar `react-day-picker` o eliminar `calendar.tsx`; crear `ui/toast` o migrar a `sonner`. |
| Front · config | Coexisten `next.config.mjs` y `next.config.ts` (Next usa solo uno). Los defaults de `defaultLocale` difieren: `routing.ts`='es' vs `next-intl.config.js`='en'. | Unificar en un solo `next.config` y una sola fuente de locale. |
| Front · CORS/rate-limit | Los leads llegan al backend desde la IP del server de Next; comparten el rate-limit de `/api/` (100/15min en prod). | Excluir `/api/leads` del limiter estricto o subir el límite. |
| Back · email | SMTP en modo sandbox (Mailtrap). | Configurar proveedor de producción. |
| Back · notificación de leads | Los leads se persisten pero no notifican al coach/admin. | Enviar email o webhook al crear un lead. |
| Ambos · tests | Jest configurado en backend, cobertura baja. | Añadir tests de servicios y de la ruta de leads. |
| Front · assessment | El BMI se calcula en el cliente pero no se envía; el backend lo recalcula. | OK (fuente única en backend); opcionalmente enviar el ya calculado. |

---

## 7. Próximos pasos sugeridos (roadmap)

1. **Dashboard autenticado** (cliente y coach) que consuma la API existente
   (`/api/coaches`, `/api/packages`, `/api/relationships`). Es el mayor faltante.
2. **Gestión de leads**: vista admin para listar/convertir leads (`GET /api/leads`,
   `PATCH /api/leads/:id/status`) → convertir un lead en cuenta de cliente.
3. **Email de producción** + notificación automática al recibir un lead.
4. **Pagos** para paquetes (si entra en alcance).
5. **Testimonios** en la página de Filosofía (bloque ya maquetado y comentado).
6. **Tests + CI** en ambos repos.

---

## 8. Despliegue

- **Frontend** → Vercel. Configurar `API_URL` y `NEXT_PUBLIC_CAL_*` en el dashboard.
- **Backend** → Render (`render.yaml`). PostgreSQL gestionado; migraciones vía Shell/one-off
  (`pnpm run migration:run:prod`). Recordar aplicar `CreateLeadsTable` en el deploy.
- **CORS backend**: si el navegador llegara a llamar directo al backend, añadir el dominio
  del frontend a `corsOptions` en `src/app.ts` (hoy no hace falta por el proxy server-side).
