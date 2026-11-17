<div align="center">

# 💠 EmprendeFlow POS & Gestión

**Vende, controla tu stock y descubre cuánto ganas de verdad.**

[![Frontend](https://img.shields.io/badge/Frontend-Vercel-000000?style=for-the-badge&logo=vercel)](https://emprende-flow-pos-gesti-n.vercel.app/)
[![PWA](https://img.shields.io/badge/PWA-Instalable-4F46E5?style=for-the-badge&logo=pwa)](https://emprende-flow-pos-gesti-n.vercel.app/)
[![API](https://img.shields.io/badge/API-Express%20%2B%20Prisma-10B981?style=for-the-badge&logo=express)](#-arquitectura)
[![Base de datos](https://img.shields.io/badge/Neon-PostgreSQL-00E599?style=for-the-badge&logo=postgresql)](https://neon.tech/)
[![Licencia](https://img.shields.io/badge/Licencia-Privada-F59E0B?style=for-the-badge)](#-licencia)

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Node](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)

</div>

---

## ✨ ¿Qué es EmprendeFlow?

Una **PWA de punto de venta y gestión financiera** pensada para emprendedores peruanos. Reúne ventas, inventario, inversiones y gastos en un solo lugar, con montos en **soles peruanos (PEN)** y una experiencia que funciona desde el celular.

> *Tu negocio claro, tu ganancia real.*

---

## 🏗️ Arquitectura

Frontend y API se despliegan como **dos proyectos independientes en Vercel**.

```text
┌────────────────────────────────────────────────────────────┐
│                         VERCEL                             │
│                                                            │
│   ┌──────────────────────┐      ┌───────────────────────┐  │
│   │  Frontend PWA        │      │  API Serverless       │  │
│   │  React + Vite        │─────▶│  Express + Prisma     │  │
│   │  Tailwind + Zustand  │      │  JWT + Zod            │  │
│   └──────────────────────┘      └───────────┬───────────┘  │
└─────────────────────────────────────────────┼──────────────┘
                                              │
                            ┌─────────────────┴─────────────────┐
                            │  Neon PostgreSQL                  │
                            │  Vercel Blob (imágenes privadas)  │
                            └───────────────────────────────────┘
```

- **Frontend:** `client/` → React, Vite, Tailwind y PWA instalable.
- **API:** `server/` → Express serverless, Prisma y PostgreSQL.
- **Almacenamiento:** Vercel Blob privado para fotos de productos y comprobantes.
- **Autenticación:** access token JWT + refresh token en cookie `httpOnly`.

---

## 🚀 Funcionalidades

### 📊 Dashboard
- Resumen de ventas, inversión, gastos y ganancia real.
- Gráficos de evolución, métodos de pago y categorías.
- Filtros por rango de fechas y categoría.
- Exportación de reportes en CSV.

### 🛒 Ventas
- Registro de ventas con múltiples productos.
- Precio final editable y cálculo automático de descuentos.
- Descuento de stock transaccional.
- Anulación de venta con restauración de stock.
- Historial con búsqueda, filtros y detalle.

### 📦 Productos e inventario
- CRUD de productos con imagen, SKU, variante y categoría.
- Costo, precio de lista, margen y valor de inventario.
- Alertas de stock bajo y productos agotados.
- Subida de imágenes a Vercel Blob.
- Búsqueda, filtros y exportación CSV.

### 🏷️ Categorías
- Categorías y subcategorías.
- Color e icono personalizables.
- Conteo de productos y archivado seguro.

### 💰 Gastos e inversiones
- Separación entre **inversión en mercadería** y **gasto operativo**.
- Ítems de inversión vinculados a productos.
- Reconciliación automática de stock al crear, editar o eliminar.
- Categorías de gasto personalizadas.
- Comprobantes de compra almacenados en Blob.
- Filtros, detalle y exportación CSV.

### 📱 PWA y experiencia
- Instalable en Android, iOS y escritorio.
- Service Worker con cache del shell y estrategia offline básica.
- Tema claro y oscuro.
- Diseño responsive con navegación móvil.
- Accesos directos a “Registrar venta” y “Gastos”.

### 🔐 Seguridad
- Contraseñas con `bcryptjs`.
- Access tokens de corta duración y refresh tokens rotativos.
- Cookies `httpOnly`, `secure` y `sameSite` configurables.
- Validación de datos con Zod.
- Helmet, CORS restringido y límite de subida de imágenes.

---

## 🧰 Stack Tecnológico

| Capa | Tecnologías |
|------|-------------|
| **Frontend** | React 18, Vite 5, React Router 6, Tailwind CSS 3, Zustand, Axios, Recharts, Lucide React, React Hot Toast |
| **Backend** | Node.js, Express 4, Prisma 5, Zod, JWT, bcryptjs, Helmet, CORS, Multer, Morgan |
| **Base de datos** | PostgreSQL en Neon |
| **Archivos** | Vercel Blob privado |
| **Deploy** | Vercel (frontend + API serverless) |
| **Calidad** | ESLint implícito por convenciones, builds de Vite, validación Zod |

---

## 🛠️ Desarrollo Local

### Requisitos

- Node.js 18 o superior
- Cuenta de Neon o PostgreSQL local
- Token de Vercel Blob para probar subidas de imágenes

### 1. Instalar dependencias

```bash
git clone https://github.com/ihvalverde/EmprendeFlow-POS-Gesti-n.git
cd EmprendeFlow-POS-Gesti-n
npm run install:all
```

### 2. Configurar el backend

Copia `server/.env.example` a `server/.env` y completa los valores:

```env
DATABASE_URL="postgresql://usuario:password@host/neondb?sslmode=require"
JWT_ACCESS_SECRET="una-cadena-larga-y-aleatoria"
JWT_REFRESH_SECRET="otra-cadena-larga-y-aleatoria"
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
NODE_ENV=development
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
COOKIE_SAMESITE=lax
COOKIE_SECURE=false
```

### 3. Preparar la base de datos

```bash
npm run db:generate
npm run db:push
```

Opcionalmente, carga datos de demostración:

```bash
npm run db:seed
```

### 4. Configurar el frontend

Copia `client/.env.example` a `client/.env` y déjalo así para usar el proxy de Vite:

```env
VITE_API_URL=
```

En producción, apunta a la API desplegada:

```env
VITE_API_URL=https://emprende-flow-pos-api.vercel.app/api/v1
```

### 5. Levantar todo

```bash
npm run dev
```

| Servicio | URL local |
|----------|-----------|
| Frontend | `http://localhost:5173` |
| API | `http://localhost:4000/api/v1` |
| Salud API | `http://localhost:4000/api/v1/health` |

### Cuenta demo

La pantalla de login incluye el botón **“Usar demo”**. También puedes entrar con:

```text
Correo: demo@emprendeflow.pe
Contraseña: demo1234
```

---

## 📜 Scripts

Ejecutados desde la raíz del proyecto:

| Script | Descripción |
|--------|-------------|
| `npm run install:all` | Instala dependencias de `server` y `client` |
| `npm run dev` | Levanta API y frontend en paralelo |
| `npm run dev:server` | Solo API con `node --watch` |
| `npm run dev:client` | Solo frontend con Vite |
| `npm run db:generate` | Genera el cliente Prisma |
| `npm run db:push` | Sincroniza el esquema con la base de datos |
| `npm run db:seed` | Carga datos demo |
| `npm run build` | Compila el frontend |
| `npm start` | Inicia la API en producción |

---

## 📁 Estructura del Proyecto

```text
EmprendeFlow-POS-Gesti-n/
├── 📁 client/                     # Frontend React + PWA
│   ├── 📁 public/
│   │   ├── manifest.webmanifest
│   │   ├── sw.js
│   │   └── icons/
│   ├── 📁 src/
│   │   ├── 📁 components/
│   │   │   ├── categories/
│   │   │   ├── expenses/
│   │   │   ├── layout/
│   │   │   ├── products/
│   │   │   ├── sales/
│   │   │   └── ui/
│   │   ├── 📁 hooks/
│   │   ├── 📁 lib/
│   │   ├── 📁 pages/
│   │   ├── 📁 stores/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── vercel.json
│   ├── vite.config.js
│   └── package.json
│
├── 📁 server/                     # API Express + Prisma
│   ├── 📁 api/
│   │   └── index.js               # Entrypoint serverless de Vercel
│   ├── 📁 prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── 📁 src/
│   │   ├── 📁 config/
│   │   ├── 📁 controllers/
│   │   ├── 📁 lib/
│   │   ├── 📁 middleware/
│   │   ├── 📁 routes/
│   │   ├── 📁 services/
│   │   ├── 📁 utils/
│   │   ├── app.js
│   │   └── index.js
│   ├── 📁 uploads/                # Compatibilidad con imágenes antiguas
│   ├── vercel.json
│   └── package.json
│
├── package.json
└── README.md
```

---

## 🌐 URLs de Producción

| Servicio | URL |
|----------|-----|
| **App / PWA** | [emprende-flow-pos-gesti-n.vercel.app](https://emprende-flow-pos-gesti-n.vercel.app/) |
| **API** | `https://emprende-flow-pos-api.vercel.app/api/v1` |
| **Salud API** | `https://emprende-flow-pos-api.vercel.app/api/v1/health` |

> La URL de la API debe coincidir con `VITE_API_URL` en el proyecto frontend. Si Vercel asigna otro dominio, actualiza la variable y vuelve a desplegar.

---

## 🔌 API Principal

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/auth/register` | Registrar emprendimiento |
| `POST` | `/auth/login` | Iniciar sesión |
| `POST` | `/auth/refresh` | Renovar access token |
| `POST` | `/auth/logout` | Cerrar sesión |
| `GET/PATCH` | `/auth/me` | Perfil del usuario |
| `GET/POST` | `/categories` | Listar o crear categorías |
| `PATCH/DELETE` | `/categories/:id` | Editar o archivar categoría |
| `GET/POST` | `/products` | Listar o crear productos |
| `GET/PATCH/DELETE` | `/products/:id` | Detalle, edición y borrado |
| `GET/POST` | `/sales` | Historial y registro de ventas |
| `POST` | `/sales/:id/cancel` | Anular venta y restaurar stock |
| `GET/POST` | `/expenses` | Listar o crear gastos/inversiones |
| `PATCH/DELETE` | `/expenses/:id` | Editar o eliminar gasto |
| `GET/POST` | `/expenses/categories` | Categorías de gasto |
| `GET` | `/dashboard/summary` | Métricas del dashboard |
| `GET` | `/dashboard/charts` | Datos para gráficos |
| `GET` | `/reports/*.csv` | Exportar inventario, ventas o gastos |
| `POST` | `/uploads` | Subir imagen a Vercel Blob |
| `GET` | `/media/*` | Servir imagen privada |
| `GET` | `/health` | Estado de la API |

---

## 🗄️ Modelo de Datos

Principales entidades de Prisma:

- **User** — emprendimiento y credenciales.
- **RefreshToken** — sesiones renovables con hash.
- **Category** — árbol de categorías y subcategorías.
- **Product** — inventario, costos, precios y stock.
- **Sale / SaleItem** — ventas con snapshot histórico del producto.
- **Expense / ExpenseItem** — gastos e inversiones con ítems vinculados.
- **ExpenseCategory** — categorías específicas para gastos.

Cada usuario tiene sus propios datos. Las operaciones de ventas e inversiones actualizan stock dentro de transacciones.

---

## ☁️ Deploy en Vercel

### API

1. Crear un proyecto en Vercel con **Root Directory: `server`**.
2. Framework Preset: **Other**.
3. Agregar las variables de `server/.env.vercel` en **Settings → Environment Variables**.
4. Desplegar. Vercel usará `server/vercel.json` y `server/api/index.js`.

Variables mínimas de producción:

```env
DATABASE_URL=postgresql://...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
BLOB_READ_WRITE_TOKEN=...
NODE_ENV=production
CLIENT_ORIGIN=https://emprende-flow-pos-gesti-n.vercel.app
COOKIE_SAMESITE=none
COOKIE_SECURE=true
```

> En Vercel no agregues comillas alrededor de los valores.

### Frontend

1. Crear un proyecto con **Root Directory: `client`**.
2. Framework Preset: **Vite**.
3. Agregar `VITE_API_URL` en **Settings → Environment Variables**.
4. Build Command: `npm run build`.
5. Output Directory: `dist`.
6. Desplegar.

```env
VITE_API_URL=https://emprende-flow-pos-api.vercel.app/api/v1
```

### Verificación

```text
GET https://emprende-flow-pos-api.vercel.app/api/v1/health
→ { "status": "ok", "service": "EmprendeFlow API" }
```

Luego abre la app, inicia sesión y confirma que el dashboard carga datos.

---

## 🔒 Seguridad y Variables de Entorno

- Los archivos `.env` y `.env.*` están ignorados por Git.
- Solo se versionan los `.env.example`.
- Nunca subas tokens de Neon, Vercel Blob o secretos JWT al repositorio.
- Usa secretos largos y aleatorios en producción.
- Si una credencial se comparte o expone, rótala y actualiza las variables en Vercel.
- En producción, con frontend y API en dominios distintos, usa `COOKIE_SAMESITE=none` y `COOKIE_SECURE=true`.

---

## 📝 Licencia

Proyecto privado — **EmprendeFlow POS & Gestión © 2026**

---

<div align="center">

**Hecho para emprendedores peruanos** 🇵🇪

*Menos planillas, más claridad para tu negocio.* ✨

</div>
