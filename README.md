# EmprendeFlow POS & Gestión

PWA full-stack para gestionar un emprendimiento: punto de venta, inventario, inversiones, gastos operativos, reportes y dashboard financiero. Todos los montos se manejan en **soles peruanos (PEN)** y las fechas se agrupan con la zona horaria **America/Lima**.

## Características

- Registro, inicio de sesión con JWT de acceso y refresh token rotado en cookie httpOnly.
- Dashboard con ventas, ganancia bruta, ganancia neta, inversión, gastos operativos, margen, ticket promedio y comparación con el periodo anterior.
- Gráficos de últimos 6 meses, ventas por categoría, top productos por unidades e ingresos, descuentos y métodos de pago.
- POS rápido: búsqueda, carrito, stock, precio final con rebaja, ganancia estimada y métodos de pago.
- Ventas con detalle, filtros por rango, búsqueda y anulación con restauración de stock.
- Inventario con SKU automático, variantes, imagen, stock, stock bajo, categorías y archivado lógico.
- Categorías jerárquicas (padre/hijo) con archivado en cascada.
- Gastos operativos e inversiones; las inversiones pueden vincular productos y sumar stock automáticamente.
- Categorías de gasto dinámicas, filtros, detalle y eliminación con reversión de stock.
- Exportación CSV de inventario, ventas y gastos.
- Tema claro/oscuro, diseño responsive con navegación inferior móvil y PWA instalable.
- API REST multi-tenant: todos los datos se aíslan por `userId`.

## Stack

| Capa | Tecnología |
| --- | --- |
| Frontend | React 18, Vite 5, React Router 6, Zustand, Axios, Tailwind CSS 3, Recharts, Lucide |
| Backend | Node.js, Express 4, Prisma 5, Zod, JWT, bcryptjs, Multer, Helmet |
| Base de datos | PostgreSQL 14+ / Neon |
| PWA | Web App Manifest + Service Worker propios |

## Estructura

```text
.
├─ client/                  # React + Vite + Tailwind
│  ├─ public/               # manifest, service worker, iconos PWA
│  └─ src/
│     ├─ components/        # UI, layout, modales de ventas/productos/gastos
│     ├─ hooks/
│     ├─ lib/               # Axios, formato de moneda/fechas, constantes
│     ├─ pages/             # Dashboard, Ventas, Productos, Categorías, Gastos, Ajustes
│     └─ stores/            # auth y UI (Zustand)
├─ server/                  # Express + Prisma
│  ├─ api/index.js          # entrypoint serverless para Vercel
│  ├─ prisma/               # schema y seed
│  └─ src/
│     ├─ controllers/
│     ├─ middleware/
│     ├─ routes/
│     ├─ services/          # métricas del dashboard
│     └─ utils/
├─ package.json             # scripts raíz
└─ README.md
```

## Requisitos

- Node.js 20 o superior.
- npm.
- PostgreSQL local, Docker o una base Neon.

## Inicio rápido local

1. Instala dependencias de la raíz, servidor y cliente:

```bash
npm install
npm run install:all
```

2. Crea `server/.env` a partir de `server/.env.example` y configura `DATABASE_URL`, `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET`.

3. Prepara la base de datos y carga datos demo:

```bash
npm run db:push
npm run db:seed
```

4. Levanta API y cliente:

```bash
npm run dev
```

- Cliente: http://localhost:5173
- API: http://localhost:4000/api/v1/health

### Usuario demo

```text
Correo: demo@emprendeflow.pe
Contraseña: demo1234
```

El seed crea 4 categorías, 6 categorías de gasto, 12 productos, 70 ventas y 25 movimientos de caja.

### PostgreSQL con Docker

```bash
docker run --name emprendeflow-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=emprendeflow \
  -p 5433:5432 \
  -d postgres:16
```

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/emprendeflow?schema=public"
```

## Variables de entorno

### `server/.env`

| Variable | Obligatoria | Descripción |
| --- | --- | --- |
| `DATABASE_URL` | Sí | Conexión PostgreSQL/Neon. En Neon agrega `?sslmode=require`. |
| `JWT_ACCESS_SECRET` | Sí en producción | Secreto largo y aleatorio para access tokens. |
| `JWT_REFRESH_SECRET` | Sí en producción | Secreto largo y aleatorio para refresh tokens. |
| `JWT_ACCESS_EXPIRES` | No | Duración del access token. Default `15m`. |
| `JWT_REFRESH_EXPIRES` | No | Duración del refresh token. Default `7d`. |
| `PORT` | No | Puerto del servidor. Default `4000`. |
| `NODE_ENV` | No | `development` o `production`. |
| `CLIENT_ORIGIN` | Sí en producción | Origen(es) permitidos por CORS, separados por coma. |
| `COOKIE_SAMESITE` | No | `lax` en local; `none` con frontend y API en dominios distintos. |
| `COOKIE_SECURE` | No | `false` en local; `true` en producción HTTPS. |
| `BLOB_READ_WRITE_TOKEN` | Sí en producción | Token de un store **privado** de Vercel Blob para fotos y comprobantes. |
| `UPLOAD_DIR` | No | Solo compatibilidad con imágenes locales antiguas. |

### `client/.env`

| Variable | Descripción |
| --- | --- |
| `VITE_API_URL` | URL completa de la API, por ejemplo `https://tu-api.vercel.app/api/v1`. Si está vacía se usa `/api/v1` y el proxy de Vite. |

## Scripts

| Comando | Acción |
| --- | --- |
| `npm run install:all` | Instala servidor y cliente. |
| `npm run db:generate` | Genera Prisma Client. |
| `npm run db:push` | Sincroniza el schema con la base de datos. |
| `npm run db:seed` | Carga datos demo. |
| `npm run dev` | Ejecuta API y cliente en paralelo. |
| `npm run dev:server` | Solo API con `node --watch`. |
| `npm run dev:client` | Solo Vite. |
| `npm run build` | Build de producción del cliente. |
| `npm start` | Inicia el servidor Express. |

## API

Base: `/api/v1`

| Recurso | Endpoints principales |
| --- | --- |
| Salud | `GET /health` |
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`, `PATCH /auth/me` |
| Categorías | `GET/POST /categories`, `PATCH/DELETE /categories/:id` |
| Productos | `GET/POST /products`, `GET/PATCH/DELETE /products/:id` |
| Ventas | `GET/POST /sales`, `GET /sales/:id`, `POST /sales/:id/cancel` |
| Gastos | `GET/POST /expenses`, `GET/PATCH/DELETE /expenses/:id` |
| Categorías de gasto | `GET/POST /expenses/categories`, `PATCH/DELETE /expenses/categories/:id` |
| Dashboard | `GET /dashboard/summary`, `GET /dashboard/charts` |
| Reportes | `GET /reports/inventory.csv`, `/reports/sales.csv`, `/reports/expenses.csv` |
| Imágenes | `POST /uploads` con campo multipart `file`; `GET /media/assets/...` sirve el blob privado |

## Reglas de negocio

- Cada usuario solo puede acceder a sus propios datos.
- Los importes se guardan como `Decimal(10,2)` y se redondean a dos decimales.
- Una venta descuenta stock dentro de una transacción; su anulación lo restaura.
- Una inversión con productos suma stock; al eliminarla se revierte el stock.
- `SaleItem` conserva snapshots de nombre, variante, categoría y precios para que el historial no cambie si luego se edita o archiva el producto.
- `SaleItem.discount` es la rebaja total de la línea y `Sale.totalDiscount = subtotal - total`.
- El filtro por categoría del dashboard solo afecta métricas de ventas; inversiones y gastos se muestran de forma global.
- Archivar una categoría padre archiva también sus subcategorías; restaurarla las restaura.
- El dashboard compara el periodo seleccionado con el periodo inmediatamente anterior de igual duración.
- Los rangos `today`, `week`, `month` y `all` se calculan en `America/Lima`.

## PWA

- Manifest: `client/public/manifest.webmanifest`.
- Service worker: `client/public/sw.js` (network-first para navegación, cache-first para assets).
- Iconos: `client/public/icons/`.
- El botón de instalación aparece en el topbar cuando el navegador emite `beforeinstallprompt`.

## Despliegue en Vercel + Neon

### 1. Base de datos Neon

1. Crea un proyecto en Neon y una base PostgreSQL.
2. Copia la cadena de conexión con `sslmode=require`.
3. Configura `DATABASE_URL` en el proyecto de la API.
4. Desde local, apuntando a Neon, ejecuta:

```bash
npm run db:push
npm run db:seed
```

### 2. API en Vercel

1. Importa el repositorio y selecciona **Root Directory**: `server`.
2. Framework Preset: **Other**.
3. En **Storage > Blob**, crea un store con acceso **Private**, conéctalo al proyecto de la API y copia `BLOB_READ_WRITE_TOKEN`. La API sirve las imágenes mediante `/api/v1/media/*`; el store debe ser privado porque el código usa `access: 'private'`.
4. Configura las variables:
   - `DATABASE_URL`
   - `JWT_ACCESS_SECRET`
   - `JWT_REFRESH_SECRET`
   - `BLOB_READ_WRITE_TOKEN`
   - `NODE_ENV=production`
   - `CLIENT_ORIGIN=https://tu-frontend.vercel.app`
   - `COOKIE_SAMESITE=none`
   - `COOKIE_SECURE=true`
5. El archivo `server/vercel.json` enruta `/api/v1/*` y `/uploads/*` a `api/index.js`.
6. Verifica `https://tu-api.vercel.app/api/v1/health`.

> Si usas un dominio de preview de Vercel, agrégalo también en `CLIENT_ORIGIN` separado por coma.

### 3. Frontend en Vercel

1. Importa el mismo repositorio y selecciona **Root Directory**: `client`.
2. Framework Preset: **Vite**.
3. Variable de entorno:
   - `VITE_API_URL=https://tu-api.vercel.app/api/v1`
4. El archivo `client/vercel.json` reescribe las rutas de React Router hacia `index.html`.
5. Verifica el login, la persistencia de sesión y la instalación PWA.

### 4. Cookies entre dominios

Con frontend y API en dominios distintos, el refresh token necesita:

```env
COOKIE_SAMESITE=none
COOKIE_SECURE=true
```

Ambos sitios deben servirse por HTTPS. El backend ya usa `trust proxy` para funcionar detrás de Vercel.

## Limitaciones y notas de producción

- **Imágenes:** las fotos de productos y comprobantes se guardan en **Vercel Blob** (`BLOB_READ_WRITE_TOKEN`, store privado). El navegador las redimensiona y comprime antes de subirlas; el límite final es 4 MB. La API las entrega con URLs aleatorias e inmutables desde `/api/v1/media/*`; quien tenga el enlace puede verlas, así que no las compartas fuera del equipo. Las imágenes locales antiguas se sirven desde `/uploads` solo por compatibilidad.
- **Migraciones:** el proyecto usa `prisma db push`. Para equipos o producción formal, genera migraciones con `prisma migrate dev` y despliega con `prisma migrate deploy`.
- **Secretos:** no reutilices los valores de `server/.env.example` en producción.
- **Refresh tokens:** se rotan y se revocan al hacer logout. Los tokens expirados se limpian al iniciar sesión.
- **Seed:** las ventas demo no descuentan stock; es data de demostración, no una simulación contable exacta.
- **Archivos ignorados:** `server/.env`, `node_modules`, `dist` y los uploads locales están en `.gitignore`.

## Verificación

```bash
npm run build --prefix client
npm start --prefix server
```

También puedes comprobar la API con:

```bash
curl http://localhost:4000/api/v1/health
```
