# HQR — Quiniela 2026 ⚽

Quiniela del Mundial con **todo el bracket** (16avos → octavos → cuartos →
semifinales → 3er lugar → final). Los participantes entran con **Google**,
pronostican cada etapa, y los **ganadores avanzan solos** a la siguiente llave
cuando el administrador registra los resultados. La tabla de posiciones acumula
los puntos de todo el torneo.

Pensada para **hosting compartido (Hostinger, WordPress, etc.)**:

- **Frontend estático** (HTML/CSS/JS) → se sube tal cual a `public_html`. Sin
  Node, sin build.
- **Backend en Google Apps Script** (gratis) → guarda todo en una **Hoja de
  Google** y verifica el login.
- **Google Sheets** como base de datos: puedes abrir la hoja y ver/editar todo.

```
site/                Frontend para subir a Hostinger (public_html)
  index.html
  styles.css
  app.js
  config.js          ← editas 2 valores aquí
apps-script/
  Code.gs            Backend (se pega en Apps Script)
  appsscript.json    Permisos del proyecto
demo/                Mockup funcional autónomo (abre demo/index.html)
legacy-nextjs/       Versión anterior en Next.js (no se usa; se conserva)
```

## Cómo funciona

- Cada **etapa** se abre/cierra por separado desde el panel de **Admin**.
- Los usuarios marcan, por partido, una de 4 opciones: **Gana A**, **Gana B**,
  **Gana A en penales**, **Gana B en penales** (es eliminación: siempre hay
  ganador).
- El **admin** registra el resultado real de cada partido. Al hacerlo, el equipo
  ganador **aparece automáticamente** en su lugar de la siguiente ronda.
- **Puntos** (acumulados en todo el torneo):
  - **1 punto** por acertar al equipo ganador.
  - **+0.5** adicional si marcaste *"en penales"* y el partido efectivamente se
    definió en penales con ese equipo.

## Puesta en marcha (paso a paso)

### 1. Crea la Hoja de Google y el backend
1. Crea una **Hoja de Google** nueva (será tu base de datos).
2. En la hoja: **Extensiones → Apps Script**.
3. Borra el contenido y **pega `apps-script/Code.gs`**. (Opcional: en el ⚙️
   "Configuración del proyecto" activa "Mostrar `appsscript.json`" y pega
   `apps-script/appsscript.json`.)
4. Arriba del archivo, ajusta:
   - `CLIENT_ID` → tu Google Client ID (lo creas en el paso 2).
   - `ADMIN_EMAILS` → tu correo (ej. `ernesto@agency.lat`).
5. Ejecuta una vez la función **`setup`** (selecciónala y pulsa *Ejecutar*).
   Autoriza los permisos cuando lo pida. Esto crea las pestañas y los partidos.
6. **Implementar → Nueva implementación → tipo "Aplicación web"**:
   - *Ejecutar como:* **Yo**.
   - *Quién tiene acceso:* **Cualquier persona**.
   - Implementa y **copia la URL** (termina en `/exec`).

### 2. Crea el Google Client ID (para el botón de login)
1. [Google Cloud Console](https://console.cloud.google.com/) → *APIs &
   Services* → *Credentials*.
2. Configura la **OAuth consent screen** (External; agrega tu correo en *Test
   users* o publica la app).
3. *Create Credentials* → **OAuth client ID** → **Web application**.
4. En **Authorized JavaScript origins** agrega tu dominio de Hostinger
   (ej. `https://tudominio.com`) y, para pruebas, `http://localhost:8080`.
5. Copia el **Client ID** (termina en `.apps.googleusercontent.com`). Úsalo en
   `CLIENT_ID` del paso 1.4 **y** en `config.js` (paso 3).

> Para Google Sign-In **no** necesitas el Client Secret ni redirect URIs; basta
> el Client ID y los orígenes autorizados.

### 3. Configura el frontend
Edita **`site/config.js`** con tus dos valores:

```js
window.QUINIELA_CONFIG = {
  GAS_URL: "https://script.google.com/macros/s/XXXX/exec",
  GOOGLE_CLIENT_ID: "XXXX.apps.googleusercontent.com",
};
```

### 4. Sube a Hostinger
1. En hPanel → **Administrador de archivos** → entra a `public_html`.
2. Sube el **contenido de la carpeta `site/`** (index.html, styles.css, app.js,
   config.js).
3. Asegúrate de que el dominio use **HTTPS** (Google Sign-In lo requiere).
4. Abre tu dominio: entra con Google y a jugar.

## Uso (administrador)

1. **16avos** está abierta por defecto: la gente pronostica.
2. Cuando empiecen los partidos, en **Admin** cierra la etapa (para congelar
   pronósticos) y ve **registrando los resultados**.
3. Al registrar resultados, los ganadores llenan **octavos** automáticamente.
4. **Abre octavos** para que pronostiquen, y repite hasta la final.

## Probar en local (opcional)

Como es estático, cualquier servidor sirve. Por ejemplo:

```bash
cd site
python3 -m http.server 8080
# abre http://localhost:8080  (agrega ese origen en el Client ID)
```

## Datos en la Hoja

- **Config**: nombre del torneo y qué etapas están abiertas.
- **Partidos**: los 32 partidos del bracket (orden, etapa, equipos, resultado).
- **Pronosticos**: una fila por participante con sus elecciones.

Puedes editar a mano si hace falta; la app lo lee directo.
