# Quiniela Mundial ⚽

Aplicación web para llenar la quiniela del Mundial, guardar los pronósticos y
consultar la tabla de posiciones. Los usuarios entran con **Google Sign-In** y
un **administrador** cierra la quiniela y registra los resultados de los
partidos.

## Cómo funciona

- **Usuarios** inician sesión con Google y marcan, para cada partido, si gana el
  equipo A, gana el equipo B o hay empate. Pueden editar mientras la quiniela
  esté **abierta**.
- **Administrador** (definido por correo en `ADMIN_EMAILS`) puede:
  - **Cerrar** la quiniela → los usuarios ya no pueden modificar sus
    pronósticos.
  - **Registrar el resultado** real de cada partido.
- **Tabla de posiciones**: se calcula automáticamente, **1 punto por acierto**
  (igual que el Excel original).

## Stack

- [Next.js 14](https://nextjs.org) (App Router) + TypeScript
- [Auth.js / NextAuth v5](https://authjs.dev) con proveedor Google
- [Prisma](https://www.prisma.io) + SQLite (local) / Postgres (producción)
- Tailwind CSS

## Puesta en marcha (local)

```bash
# 1. Instalar dependencias
npm install

# 2. Variables de entorno
cp .env.example .env
#   - Genera AUTH_SECRET:  openssl rand -base64 32
#   - Pon tus credenciales de Google OAuth (ver abajo)
#   - Ajusta ADMIN_EMAILS con tu correo

# 3. Crear la base de datos y los partidos
npx prisma migrate dev --name init   # crea las tablas
npm run db:seed                       # carga los 16 partidos

# 4. Arrancar
npm run dev
# → http://localhost:3000
```

> La primera vez que se abre la app también se crean los partidos
> automáticamente si la base está vacía, así que `db:seed` es opcional.

## Credenciales de Google OAuth

1. Entra a [Google Cloud Console](https://console.cloud.google.com/) →
   *APIs & Services* → *Credentials*.
2. *Create Credentials* → *OAuth client ID* → tipo **Web application**.
3. En **Authorized redirect URIs** agrega:
   - `http://localhost:3000/api/auth/callback/google` (desarrollo)
   - `https://TU-DOMINIO/api/auth/callback/google` (producción)
4. Copia el *Client ID* y *Client Secret* a `AUTH_GOOGLE_ID` y
   `AUTH_GOOGLE_SECRET` en tu `.env`.

## Despliegue en Vercel (recomendado)

1. Cambia el provider en `prisma/schema.prisma` de `sqlite` a `postgresql`.
2. Crea una base Postgres (por ejemplo [Neon](https://neon.tech) o Vercel
   Postgres) y copia su cadena de conexión.
3. En Vercel, define las variables de entorno:
   - `DATABASE_URL` (Postgres)
   - `AUTH_SECRET`
   - `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
   - `ADMIN_EMAILS`
   - `AUTH_TRUST_HOST=true`
4. El script `build` ejecuta `prisma migrate deploy` automáticamente. Para
   generar la primera migración de Postgres en local:
   `npx prisma migrate dev --name init` (con `DATABASE_URL` apuntando a Postgres).

## Estructura

```
prisma/schema.prisma        Modelos (User, Match, Prediction, Tournament…)
prisma/seed.ts              Carga los 16 partidos
src/auth.ts                 Configuración de Auth.js (Google)
src/lib/matches.ts          Lista de partidos del Mundial
src/lib/quiniela.ts         Lógica de datos y tabla de posiciones
src/app/actions.ts          Server actions (guardar, cerrar, resultados)
src/app/page.tsx            Pantalla principal: llenar la quiniela
src/app/posiciones/         Tabla de posiciones
src/app/admin/              Panel del administrador
```
