# Descargador de Música - Reproductor Y2K

Este proyecto es un reproductor de música local y descargador web con una interfaz de estilo Y2K (skeuomórfico, estilo Winamp/Mac OS Aqua).

## Arquitectura General y Stack Tecnológico (Stateless)

El sistema opera bajo un enfoque completamente "stateless" (sin estado). No hay base de datos. Todo el procesamiento de reproducción es local en el navegador, y el backend sirve puramente como un motor de descarga temporal.

### 1. Frontend (La Grabadora)
- **Framework:** React con Next.js (App Router) y TypeScript. Vercel.
- **Estilizado:** Tailwind CSS para replicar interfaces Y2K.
- **Reproducción Local:** API nativa de HTML5 `File` (`URL.createObjectURL(file)`) para reproducir canciones desde una carpeta local del PC sin necesidad de subirlas al servidor.
- **Gestión de Estado:** Zustand.
- **Web Audio API:** Para ecualizador de barras en tiempo real.

#### Mapeo de la Botonera Nakazaki
- **RECORD (🔴):** Envía el link (YouTube/Spotify) al backend para su descarga directa.
- **STOP/EJECT (⏏️):** Abre el explorador del SO para "insertar un casete" (cargar archivos MP3 locales en la memoria del navegador).
- **PLAY / PAUSE (⏯️):** Reproduce el audio en memoria.
- **FWD / REW (⏪ ⏩):** Navega por la carpeta local.

### 2. Backend (Motor Efímero de Extracción)
- **Hosting:** Fly.io mediante Docker.
- **Framework:** FastAPI (Python).
- **Herramientas:** `yt-dlp` y `ffmpeg`.
- **Proceso:** 
  1. Recibe la URL (`POST /api/download`).
  2. Descarga y convierte el archivo temporalmente en `/tmp`.
  3. Informa el progreso a través de WebSockets (`/ws/{session_id}`).
  4. Retorna el MP3 como un archivo descargable (`FileResponse`).
  5. Elimina el archivo de `/tmp` inmediatamente para liberar espacio (Background Tasks).
