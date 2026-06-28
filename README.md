# Quiniela Mundial ⚽

Aplicación web para llenar la quiniela del Mundial, guardar los pronósticos y
consultar la tabla de posiciones. Los usuarios entran con **Google Sign-In** y
un **administrador** cierra la quiniela y registra los resultados de los
partidos.

## Cómo funciona

- **Usuarios** inician sesión con Google y marcan, para cada partido, una de
  cuatro opciones (es eliminación, siempre hay un ganador):
  - **Gana A** / **Gana B** (en tiempo regular)
  - **Gana A en penales** / **Gana B en penales** (después de empate)

  Pueden editar mientras la quiniela esté **abierta**.
- **Administrador** (definido por correo en `ADMIN_EMAILS`) puede:
  - **Cerrar** la quiniela → los usuarios ya no pueden modificar sus
    pronósticos.
  - **Registrar el resultado** real de cada partido (incluyendo si se definió
    en penales).
- **Tabla de posiciones** automática:
  - **1 punto** por acertar al equipo ganador (sin importar cómo).
  - **+0.5 puntos** adicionales (desempate) si marcaste la opción
    *"gana en penales"* y el partido efectivamente se definió en penales con ese
    equipo ganando.

## Stack

- [Next.js 14](https://nextjs.org) (App Router) + TypeScript
- [Auth.js / NextAuth v5](https://authjs.dev) con proveedor Google
- [Prisma](https://www.prisma.io) + PostgreSQL (local y producción)
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
#   - DATABASE_URL: usa Neon (igual que producción) o un Postgres local

# 3a. (Opcional) Postgres local efímero, sin instalar nada extra:
npm run db:local
#     y deja en .env:
#     DATABASE_URL="postgresql://postgres@127.0.0.1:5433/quiniela?schema=public"

# 3b. Crear las tablas y cargar los 16 partidos
npx prisma migrate deploy   # aplica las migraciones
npm run db:seed             # carga los partidos (opcional: se crean solos)

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

## Despliegue en Vercel

La base ya es PostgreSQL, así que el despliegue es directo.

1. **Crea la base Postgres.** En [Neon](https://neon.tech) (gratis) crea un
   proyecto y copia la *connection string* (la que termina en `?sslmode=require`).
2. **Importa el repo en [Vercel](https://vercel.com)** (New Project → tu repo de
   GitHub). Vercel detecta Next.js automáticamente.
3. **Define las variables de entorno** en Vercel (Project → Settings →
   Environment Variables):
   - `DATABASE_URL` → la cadena de Neon
   - `AUTH_SECRET` → `openssl rand -base64 32`
   - `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` → credenciales de Google
   - `ADMIN_EMAILS` → tu correo (ej. `ernesto@agency.lat`)
   - `AUTH_TRUST_HOST` → `true`
4. **Deploy.** El comando `build` corre `prisma migrate deploy` y crea las
   tablas en Neon automáticamente. Los 16 partidos se cargan solos en la
   primera visita.
5. **Actualiza el redirect URI de Google** con tu dominio de Vercel:
   `https://TU-APP.vercel.app/api/auth/callback/google`.

> Local y producción usan el mismo motor (Postgres), por lo que no hay que
> cambiar nada del esquema entre uno y otro.

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
