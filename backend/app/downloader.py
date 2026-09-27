import yt_dlp
import os
import asyncio
import uuid
from pathlib import Path
from .websockets_manager import manager

TMP_DIR = Path("/tmp/descargador_y2k")
TMP_DIR.mkdir(parents=True, exist_ok=True)

def download_audio_sync(url: str, session_id: str, loop: asyncio.AbstractEventLoop) -> str:
    """
    Descarga el audio y emite el progreso vía WebSocket.
    Retorna la ruta absoluta del archivo MP3 temporal.
    Se ejecuta de forma bloqueante (debe llamarse en un thread).
    """
    def my_hook(d):
        if d['status'] == 'downloading':
            percent_str = d.get('_percent_str', '0%').strip()
            import re
            percent_clean = re.sub(r'\x1b\[[0-9;]*m', '', percent_str)
            
            message = {
                "status": "downloading",
                "progress": percent_clean
            }
            asyncio.run_coroutine_threadsafe(manager.send_personal_message(message, session_id), loop)
            
        elif d['status'] == 'finished':
            msg = {"status": "processing", "message": "Convirtiendo a MP3..."}
            asyncio.run_coroutine_threadsafe(manager.send_personal_message(msg, session_id), loop)

    track_id = str(uuid.uuid4())
    outtmpl = str(TMP_DIR / f"{track_id}_%(title)s.%(ext)s")
    
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': outtmpl,
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '320',
        }],
        'progress_hooks': [my_hook],
        'quiet': False,
        'no_warnings': True
    }
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info_dict = ydl.extract_info(url, download=True)
        base_filename = ydl.prepare_filename(info_dict)
        final_mp3_path = os.path.splitext(base_filename)[0] + ".mp3"
        return final_mp3_path
